import { supabase } from '../lib/supabase';
import { DEV_MODE, mockUser } from '../config/dev';

// TEMP MOCK ID PARA SA UI DEV
async function getAuthenticatedUser() {
  if (DEV_MODE) return mockUser.id;

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data?.session?.user?.id ?? null;
}

// ==========================================
// 🧮 CORE ENERGY CALCULATION ENGINE HELPER
// ==========================================
function calculateCosts(record: any) {
  const val = parseFloat(record.value) || 0;
  const hrs = parseFloat(record.hours) || 0;
  const qty = parseInt(record.quantity) || 1;
  const r = parseFloat(record.rate) || 0;

  let dCost = 0;
  let mCost = 0;

  // 🛠️ FIX: Inayos ang kWh math condition upang maiwasan ang maling multiplication multiplier loop
  const dailyKwh = record.unit === "Watts" 
    ? (val / 1000) * hrs * qty 
    : val * qty; // Kung kWh na, direct total consumption weight na ito per tracking item

  if (record.period === 'Monthly') {
    // Kung Monthly kung i-track, ang kuryente ay hinahati sa 30 araw para makuha ang daily base share
    mCost = dailyKwh * r;
    dCost = mCost / 30;
  } else {
    // Default 'Daily' processing computation pattern
    dCost = dailyKwh * r;
    mCost = dCost * 30;
  }

  return { dCost, mCost };
}

// SAVE DATA TO SUPABASE TABLE
export async function saveConsumptionRecord(data: any) {
  try {
    const userId = await getAuthenticatedUser();
    const { appliance, category, unit, value, hours, quantity, rate, period } = data;

    // 1. I-compute muna ang costs gamit ang corrected math helper
    const { dCost, mCost } = calculateCosts(data);

    const { data: insertedData, error } = await supabase
      .from('consumption_history')
      .insert([
        {
          user_id: userId,
          appliance_name: appliance,
          category,
          unit,
          value,
          hours,
          quantity,
          rate,
          period: period || 'Daily',
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) throw error;
    console.log("Data successfully saved to Supabase!");
    
    return {
      success: true,
      dailyCost: dCost,
      monthlyCost: mCost,
      raw: insertedData
    };
  } catch (error: any) {
    console.error("Supabase Save Error:", error.message);
    throw error;
  }
}

// REAL-TIME FETCHING PARA SA DASHBOARD & HISTORY
export function getDashboardData(callback: (data: any) => void) {
  let subscription: any = null;

  (async () => {
    try {
      const userId = await getAuthenticatedUser();

      // 1. Initial Load ng Data
      const { data, error } = await supabase
        .from('consumption_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processAndCallback = (records: any[]) => {
        let tMonthly = 0;
        let tDaily = 0;
        const appAgg: Record<string, number> = {};
        const catAgg: Record<string, number> = {};

        records.forEach((d) => {
          const { dCost, mCost } = calculateCosts(d);

          tMonthly += mCost;
          tDaily += dCost;

          appAgg[d.appliance_name || 'Unknown'] = (appAgg[d.appliance_name || 'Unknown'] || 0) + mCost;
          catAgg[d.category || 'Others'] = (catAgg[d.category || 'Others'] || 0) + mCost;
        });

        const colors = ["#1A442E", "#2E7D32", "#4CAF50", "#81C784", "#A5D6A7"];
        const formattedPie = Object.keys(catAgg).map((key, index) => ({
          name: key,
          population: catAgg[key],
          color: colors[index % colors.length],
          legendFontColor: "#64748B",
          legendFontSize: 12,
        }));

        const sortedApps = Object.entries(appAgg)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5);

        callback({
          totalMonthly: tMonthly,
          totalDaily: tDaily,
          applianceCount: records.length,
          pieData: formattedPie,
          topTenData: {
            labels: sortedApps.map(([name]) => name.substring(0, 6)),
            datasets: [{ data: sortedApps.map(([, val]) => val) }]
          },
          trendData: {
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            datasets: [{ data: [0, 0, 0, 0, 0, 0, tDaily] }]
          },
          rawDocs: records
        });
      };

      processAndCallback(data || []);

      // 2. Supabase Real-time Listener Group
      subscription = supabase
        .channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'consumption_history', filter: `user_id=eq.${userId}` }, async () => {
          const { data: updatedData } = await supabase
            .from('consumption_history')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
          processAndCallback(updatedData || []);
        })
        .subscribe();

    } catch (error) {
      console.error("Error setting up dashboard data:", error);
    }
  })();

  return () => {
    if (subscription) supabase.removeChannel(subscription);
  };
}