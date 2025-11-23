// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    persistSession: true,              // << REQUIRED (prevents logout on reload)
    autoRefreshToken: true,            // << REQUIRED (keeps session fresh)
    detectSessionInUrl: true,          // << REQUIRED for Stripe redirect PKCE
    flowType: "pkce",                  // << The modern Supabase login flow
    storage: localStorage,             // << Ensures sessions are browser persistent
  },
});
