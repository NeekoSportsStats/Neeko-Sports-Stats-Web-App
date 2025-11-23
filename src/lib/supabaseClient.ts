// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

// Vite env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// 🔥 Stripe Checkout Fix:
// When coming back from Stripe, Vercel SSR or hydration can break `localStorage` access.
// This wrapper safely falls back if the browser hasn't fully restored localStorage yet.
const safeStorage = {
  getItem: (key: string) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
  },
  removeItem: (key: string) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",

    // 🔥 REQUIRED FIX — safe client-side storage for Stripe redirect
    storage: safeStorage,

    // 🔥 prevents silent getSession() crashes
    debug: true,
  },
});
