import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const NEXT_PUBLIC_SUPABASE_URL =
  "https://yzpgidujkkdyovdktgxr.supabase.co";

export const NEXT_PUBLIC_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6cGdpZHVqa2tkeW92ZGt0Z3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NDUwMjIsImV4cCI6MjEwMTQyMTAyMn0.-42vUhpATy5apXZ_xVfvBKy-tLR7AAuOQZm2m9S16bk";

export const NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_fE4HS2bWCI95Mqw35gcNLQ_p911OIMf";

/**
 * Main client (with session persistence for logged-in users)
 */
export const supabase = createClient(
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

/**
 * Public-only client (no session persistence; useful if you want to
 * avoid auth state entirely for read-only operations)
 */
export const supabasePublic = createClient(
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {}
      }
    }
  }
);

export const SUPABASE_URL = NEXT_PUBLIC_SUPABASE_URL;