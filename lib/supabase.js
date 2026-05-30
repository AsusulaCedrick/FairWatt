import { createClient } from '@supabase/supabase-js';

// PALIWANAG: Hinihila natin ito nang ligtas mula sa iyong .env file
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

// PALIWANAG: Hinihila rin natin ang tamang anon key mula sa .env file para hindi ito nakabuyangyang sa code
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// PALIWANAG: Dito natin pinagsasama ang URL at Key para mabuo ang 'supabase' object na gagamitin sa buong app.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);