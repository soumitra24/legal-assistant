import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Check user in custom users table
          const { data: user, error } = await supabase
            .from('users')
            .select('id, email, name, password, image')
            .eq('email', credentials.email)
            .eq('provider', 'email')
            .single();

          if (error || !user || !user.password) {
            console.error('User not found or no password:', error);
            return null;
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(credentials.password, user.password);
          
          if (!isValidPassword) {
            console.error('Invalid password');
            return null;
          }

          // Update last login
          await supabase
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', user.id);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account }: any) {
      if (account?.provider === "google" && user?.email) {
        try {
          // Handle Google sign-in sync
          const { error: dbError } = await supabase
            .from('users')
            .upsert({
              name: user.name,
              email: user.email,
              image: user.image,
              provider: 'google',
              email_verified: new Date().toISOString(),
              last_login: new Date().toISOString(),
            }, {
              onConflict: 'email'
            });

          if (dbError) {
            console.error('Error syncing Google user:', dbError);
            return false;
          }

          return true;
        } catch (error: any) {
          console.error('Error during Google sign-in:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
  },
  session: {
    strategy: "jwt" as const,
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };