import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TODO: thay bằng URL và anon key thật của project Supabase (Settings > API)
const supabaseUrl = 'https://kmkjrklvhzgtbyrnypuf.supabase.co';
const supabaseAnonKey = 'sb_publishable_QXLr9GUk_rlrb_RjxmKyiw_R0Wu-730';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
