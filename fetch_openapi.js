const axios = require('axios');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

async function run() {
  try {
    const url = `${supabaseUrl}/rest/v1/`;
    console.log('Fetching URL:', url);
    const response = await axios.get(url, {
      headers: {
        'apikey': supabaseAnonKey.trim(),
        'Authorization': `Bearer ${supabaseAnonKey.trim()}`
      }
    });
    console.log('Keys of schema definitions:', Object.keys(response.data.definitions));
    if (response.data.definitions.energy_logs) {
      console.log('energy_logs columns:', Object.keys(response.data.definitions.energy_logs.properties));
      console.log('energy_logs properties:', JSON.stringify(response.data.definitions.energy_logs.properties, null, 2));
    }
  } catch (err) {
    if (err.response) {
      console.error('Response Error:', err.response.status, err.response.data);
    } else {
      console.error('Error:', err.message);
    }
  }
}

run();
