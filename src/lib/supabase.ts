import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zrffaisyidwbfzinblub.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QDghpWYqD8ssoCHngSaZkw_oOHmY_hF';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
