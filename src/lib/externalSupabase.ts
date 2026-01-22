import { createClient } from '@supabase/supabase-js';

// External live backend connection (publishable credentials provided by user)
// NOTE: This is intentionally separate from the auto-generated Lovable Cloud client.
const EXTERNAL_SUPABASE_URL = 'https://zdgireilszdeiqybhmbs.supabase.co';
const EXTERNAL_SUPABASE_ANON_KEY = 'sb_publishable_yGtXWWP0O3PpRQzwXYogTQ_WDYCYJU6';

export const externalSupabase = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
