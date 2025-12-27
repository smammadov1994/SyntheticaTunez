import 'react-native-url-polyfill/auto';
import './webcrypto-polyfill';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Get environment variables - these should be set in a .env file at the project root
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://vmjskjejkdxslnihrmzh.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY || '';

if (!supabaseKey) {
  // Auth cannot work without the anon key; fail fast with an actionable message.
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_KEY. Create a .env file in the project root with:\n' +
      'EXPO_PUBLIC_SUPABASE_URL=https://vmjskjejkdxslnihrmzh.supabase.co\n' +
      'EXPO_PUBLIC_SUPABASE_KEY=your_supabase_anon_key_here\n' +
      '\n' +
      'Then restart Expo (`npm run start`) so the env vars are picked up.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Native apps should use PKCE; we’ll exchange the `code` from the redirect URL for a session.
    flowType: 'pkce',
  },
});

