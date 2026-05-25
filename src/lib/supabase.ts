import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function maskKey(key: string | undefined | null) {
  if (!key) return null;
  if (key.length <= 12) return '•••';
  return `${key.slice(0, 6)}...${key.slice(-6)}`;
}

console.info('Supabase config:', {
  supabaseUrl: supabaseUrl ? supabaseUrl : null,
  supabaseAnonKey: supabaseAnonKey ? maskKey(supabaseAnonKey) : null
});

let supabase: any;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing. Supabase client will be disabled.');
  const thrower = () => {
    throw new Error('Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env and restart the dev server.');
  };

  supabase = {
    from: thrower,
    auth: {
      signOut: thrower,
      getSession: thrower,
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } })
    }
  };
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
}

export { supabase };
