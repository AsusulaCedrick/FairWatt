const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Testing consumption_kwh column...');
  const { data, error } = await supabase
    .from('energy_logs')
    .insert([{
      user_id: '11111111-1111-1111-1111-111111111111',
      appliance: 'Test Schema',
      consumption_kwh: 0.2
    }])
    .select();

  console.log('Error output for consumption_kwh:', error);
}

run();
