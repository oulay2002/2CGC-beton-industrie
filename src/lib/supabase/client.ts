import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export const isSupabaseConfigured = (): boolean => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return (
    typeof url === 'string' &&
    url.trim().length > 0 &&
    typeof key === 'string' &&
    key.trim().length > 0 &&
    !url.includes('VOTRE_') &&
    !url.includes('placeholder')
  );
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
