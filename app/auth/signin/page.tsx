"use client";
import { signIn, getSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Scale, Zap } from "lucide-react";
import Link from "next/link";
import { useTheme } from "../../contexts/ThemeContext";
import ThemeToggle from "../../components/ThemeToggle";

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { theme } = useTheme();

  useEffect(() => {
    // Check if user is already signed in
    getSession().then((session) => {
      if (session) {
        router.push('/');
      }
    });
  }, [router]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('google', { callbackUrl: '/' });
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isLight = theme === 'light';

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      isLight 
        ? 'bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50' 
        : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
    }`}>
      {/* Theme Toggle - Top Right */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center space-x-3 group">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isLight ? 'bg-orange-600' : 'bg-blue-600'
            }`}>
              <Scale className="w-5 h-5 text-white" />
            </div>
            <span className={`text-xl font-bold tracking-tight font-serif ${
              isLight 
                ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-transparent bg-clip-text' 
                : 'text-slate-100'
            }`}>
              advAIcate
            </span>
          </Link>
        </div>

        {/* Sign In Card */}
        <div className={`p-8 rounded-2xl shadow-xl border ${
          isLight 
            ? 'bg-white border-orange-100' 
            : 'bg-slate-800/90 backdrop-blur-sm border-slate-700'
        }`}>
          <div className="text-center mb-8">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-6 ${
              isLight 
                ? 'bg-gradient-to-r from-orange-100 to-amber-100 border border-orange-200 text-orange-800' 
                : 'bg-gradient-to-r from-orange-950/60 to-amber-950/60 border border-orange-700/50 text-orange-300'
            }`}>
              <Zap className="w-3 h-3 mr-1" />
              Powered by Advanced AI
            </div>
            <h1 className={`text-2xl font-light mb-2 ${
              isLight ? 'text-slate-900' : 'text-slate-100'
            }`}>
              Welcome back
            </h1>
            <p className={`font-light ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}>
              Sign in to access your legal AI assistant
            </p>
          </div>

          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className={`w-full font-medium py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-sm ${
              isLight 
                ? 'bg-white border border-slate-300 text-slate-900 hover:bg-slate-50 hover:border-orange-300' 
                : 'bg-slate-700 border border-slate-600 text-slate-100 hover:bg-slate-600 hover:border-orange-500'
            }`}
          >
            {isLoading ? (
              <div className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin ${
                isLight ? 'border-orange-400' : 'border-orange-500'
              }`} />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            <span className={`font-medium ${
              isLight ? 'text-slate-900' : 'text-slate-100'
            }`}>
              {isLoading ? 'Signing in...' : 'Continue with Google'}
            </span>
          </Button>

          <p className={`text-xs text-center mt-6 font-light ${
            isLight ? 'text-slate-500' : 'text-slate-400'
          }`}>
            Privacy-first • Secure • No data sharing
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <Link 
            href="/" 
            className={`text-sm transition-colors font-light ${
              isLight ? 'text-slate-500 hover:text-orange-600' : 'text-slate-400 hover:text-orange-400'
            }`}
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}