const axios = require('axios');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

async function run() {
  try {
    const response = await axios.get(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    const schema = response.data;
    const energyLogsTable = schema.definitions.energy_logs;
    if (energyLogsTable) {
      console.log('Energy Logs Columns:', Object.keys(energyLogsTable.properties));
      console.log('Detailed Properties:', JSON.stringify(energyLogsTable.properties, null, 2));
    } else {
      console.log('energy_logs definition not found in schema');
    }
  } catch (err) {
    console.error('Error fetching schema:', err.message);
  }
}

run();
