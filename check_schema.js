const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    const { data, error } = await supabase
      .from('energy_logs')
      .select('daily_cost')
      .limit(1);
    
    if (error) {
      console.error('Error fetching record:', error);
    } else {
      console.log('Fetched record keys:', data.length > 0 ? Object.keys(data[0]) : 'No records found');
      console.log('Fetched record data:', data);
    }
  } catch (err) {
    console.error('Script error:', err);
  }
}

run();
