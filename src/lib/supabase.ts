import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

function isConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url && url.startsWith("http");
}

export function getSupabase() {
  if (!_supabase) {
    if (!isConfigured()) return null;
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _supabase;
}
