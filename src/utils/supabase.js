import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Get environment variables - these should be set in a .env file at the project root
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://vmjskjejkdxslnihrmzh.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY || '';

if (!supabaseKey) {
  console.warn(
    '⚠️ EXPO_PUBLIC_SUPABASE_KEY is not set. Please create a .env file in the project root with:\n' +
    'EXPO_PUBLIC_SUPABASE_URL=https://vmjskjejkdxslnihrmzh.supabase.co\n' +
    'EXPO_PUBLIC_SUPABASE_KEY=your_supabase_anon_key_here'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

