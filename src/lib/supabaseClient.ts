// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    persistSession: true,        // ⬅️ REQUIRED: fixes logout + reload issues
    autoRefreshToken: true,      // ⬅️ REQUIRED: fixes session dying on redirect
    detectSessionInUrl: true,    // ⬅️ REQUIRED: Stripe PKCE redirect
    flowType: "pkce",            // ⬅️ REQUIRED: modern secure login flow
    storage: localStorage,       // ⬅️ Ensures stable persistent sessions
  },
});
