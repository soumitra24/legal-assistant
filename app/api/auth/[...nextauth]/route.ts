import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  ],
  callbacks: {
    async signIn({ user, account, profile }: any) {
      console.log("[NextAuth SignInCB] Processing sign-in");

      if (account?.provider === "google") {
        if (!user.email) {
          console.error("[NextAuth SignInCB] Google user email is missing.");
          return false;
        }
        try {
          console.log(`[NextAuth SignInCB] Checking Supabase for user`);
          const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('id, email')
            .eq('email', user.email)
            .single();

          if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('[NextAuth SignInCB] Supabase error fetching user:', fetchError.message);
            return false;
          }

          const now = new Date().toISOString();

          if (!existingUser) {
            console.log(`[NextAuth SignInCB] Creating new user in Supabase`);
            
            const { data: newUser, error: insertError } = await supabase
              .from('users')
              .insert({
                name: user.name,
                email: user.email,
                image: user.image,
                provider: account.provider,
                created_at: now,
                last_login: now,
                email_verified: now, // Google users are automatically verified
              })
              .select('id')
              .single();

            if (insertError) {
              console.error('[NextAuth SignInCB] Supabase error inserting user:', insertError.message);
              return false;
            }
            console.log(`[NextAuth SignInCB] New user created successfully`);
          } else {
            console.log(`[NextAuth SignInCB] Existing user found, updating last_login`);
            const { error: updateError } = await supabase
              .from('users')
              .update({ last_login: now })
              .eq('email', user.email);

            if (updateError) {
              console.error('[NextAuth SignInCB] Error updating last_login:', updateError.message);
            } else {
              console.log(`[NextAuth SignInCB] Successfully updated last_login`);
            }
          }
          console.log("[NextAuth SignInCB] Sign-in successful");
          return true;
        } catch (error: any) {
          console.error('[NextAuth SignInCB] Error during user processing:', error.message);
          return false;
        }
      }
      return true;
    },

    async redirect({ url, baseUrl }: { url: string, baseUrl: string }) {
      console.log(`[NextAuth RedirectCB] url: ${url}, baseUrl: ${baseUrl}`);
      
      // Allows relative callback URLs
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) {
        return url;
      }
      // Default to home page
      return baseUrl;
    },

    async jwt({ token, user, account, profile }: { token: any, user?: any, account?: any, profile?: any }) {
      if (account && user?.email) {
        console.log(`[NextAuth JwtCB] Fetching Supabase user ID`);
        try {
          const { data: supabaseUser, error: fetchSupabaseUserError } = await supabase
            .from('users')
            .select('id')
            .eq('email', user.email)
            .single();

          if (fetchSupabaseUserError) {
            console.error(`[NextAuth JwtCB] Error fetching Supabase user:`, fetchSupabaseUserError.message);
          } else if (supabaseUser && supabaseUser.id) {
            console.log(`[NextAuth JwtCB] Supabase user found, adding to token`);
            token.supabaseUserId = supabaseUser.id;
          } else {
            console.warn(`[NextAuth JwtCB] No Supabase user found or ID missing`);
          }
        } catch (e: any) {
          console.error("[NextAuth JwtCB] Exception while fetching Supabase user:", e.message);
        }
      }
      return token;
    },

    async session({ session, token }: { session: any, token: any }) {
      if (session.user) {
        if (token.supabaseUserId) {
          session.user.id = token.supabaseUserId as string;
          console.log(`[NextAuth SessionCB] Added user ID to session`);
        } else {
          console.warn("[NextAuth SessionCB] supabaseUserId missing in token");
        }
      } else {
        console.warn("[NextAuth SessionCB] session.user object is missing");
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: "jwt" as const,
  },
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };