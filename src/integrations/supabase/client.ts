import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

if (!SUPABASE_URL) {
  console.error('❌ VITE_SUPABASE_URL is not set in .env file');
  console.error('📝 Create a .env file in the project root with:');
  console.error('   VITE_SUPABASE_URL=your_supabase_url');
  console.error('   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');
}

if (!SUPABASE_ANON_KEY) {
  console.error('❌ VITE_SUPABASE_ANON_KEY is not set in .env file');
}

// Provide fallback values to prevent app crash during development
const supabaseUrl = SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Debug helper
export const _supabase_debug = {
  url: SUPABASE_URL,
  anon_present: !!SUPABASE_ANON_KEY,
  configured: !!(SUPABASE_URL && SUPABASE_ANON_KEY)
};
