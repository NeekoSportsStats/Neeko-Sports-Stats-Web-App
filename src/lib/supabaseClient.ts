import { createClient } from '@supabase/supabase-js';

console.log("📦 [supabaseClient] Initialising Supabase client");
console.log("🌍 VITE_SUPABASE_URL:", import.meta.env.VITE_SUPABASE_URL);
console.log("🔑 VITE_SUPABASE_ANON_KEY Loaded:", !!import.meta.env.VITE_SUPABASE_ANON_KEY);

const client = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined
    }
  }
);

client.auth.onAuthStateChange((event, session) => {
  console.log("🌀 [AuthStateChange] Event:", event);
  console.log("🗂 [Auth Session Snapshot]:", session);
  console.log("🗂 [Auth User]:", session?.user?.email);
});

console.log("✅ [supabaseClient] Client initialized");

export const supabase = client;
