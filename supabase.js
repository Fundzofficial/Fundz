// supabase.js

import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL =
  "https://yzpgidujkkdyovdktgxr.supabase.co";

const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6cGdpZHVqa2tkeW92ZGt0Z3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NDUwMjIsImV4cCI6MjEwMTQyMTAyMn0.-42vUhpATy5apXZ_xVfvBKy-tLR7AAuOQZm2m9S16bk";

export const supabase =
  createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );