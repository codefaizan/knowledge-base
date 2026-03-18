"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { getSupabase } from "@/lib/supabase";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  const signIn = async () => {
    setErrorMessage(null);
    const supabase = getSupabase();

    if (!supabase) {
      setErrorMessage("Supabase is not configured for this deployment.");
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setErrorMessage(error.message || "Google sign-in failed. Please try again.");
    }
  };

  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <p className="text-zinc-500 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="bg-zinc-900 p-8 rounded-lg shadow-lg border border-zinc-800 w-full max-w-sm text-center">
        <h1 className="text-xl font-semibold mb-2 text-zinc-100">Knowledge Base</h1>
        <p className="text-zinc-400 text-sm mb-6">Sign in to get started</p>
        <button
          onClick={signIn}
          className="w-full bg-zinc-100 text-zinc-900 py-2 px-4 rounded-md hover:bg-zinc-200 transition-colors cursor-pointer font-medium"
        >
          Sign in with Google
        </button>
        {errorMessage && (
          <p className="mt-3 text-xs text-red-400">{errorMessage}</p>
        )}
      </div>
    </div>
  );
}
