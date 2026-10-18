import { createClient } from '@supabase/supabase-js';

// Production defaults ensure multi-device sync works out-of-the-box across all laptops, phones, and deployments
const DEFAULT_SUPABASE_URL = 'https://zumrrvmvsxbomvxmahhp.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1bXJydm12c3hib212eG1haGhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzMjAzNDcsImV4cCI6MjEwNzg5NjM0N30.yfkoenb77ZX6j0PmFpaWCFn4kxMcoCFXGjwf2OePejA';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-supabase-id.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
