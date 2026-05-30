import { supabase } from '../lib/supabase'; 
import { DEV_MODE, mockUser } from '../config/dev';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidUUID(id: any) {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

async function getAuthenticatedUser() {
  if (DEV_MODE) return mockUser as any;
  const { data: sessionData, error } = await supabase.auth.getSession();
  if (error && error.message !== 'AuthSessionMissingError') {
    console.error('Supabase getSession error:', error);
  }
  return sessionData?.session?.user || null;
}

// ==========================================
// 🧮 CENTRALIZED COST COMPUTATION ENGINE
// ==========================================
function calculateRecordCosts(data: any) {
  const numericValue = parseFloat(data.value) || 0;
  const numericHours = parseFloat(data.hours_used || data.hours) || 0;
  const numericQty = parseInt(data.quantity, 10) || 1;
  const numericRate = parseFloat(data.rate) || 0;

  let dailyKwh = 0;
  let dailyCost = 0;
  let monthlyCost = 0;

  // 🛠️ FIX: Inayos ang math logic para sa kWh direct extraction tracking
  if (data.period === 'Monthly') {
    dailyKwh = data.unit === 'Watts'
      ? (numericValue / 1000) * numericHours * numericQty
      : numericValue * numericQty; // Kung kWh na ang submeter value, hindi na kailangan i-multiply sa hours
    
    monthlyCost = dailyKwh * numericRate;
    dailyCost = monthlyCost / 30;
  } else {
    dailyKwh = data.unit === 'Watts'
      ? (numericValue / 1000) * numericHours * numericQty
      : numericValue * numericQty; // Iwas-overcharge sa automatic computing logs ng tenant
      
    dailyCost = dailyKwh * numericRate;
    monthlyCost = dailyCost * 30;
  }

  return { dailyKwh, dailyCost, monthlyCost, numericValue, numericHours, numericQty, numericRate };
}

// --- SAVE LOGIC ---
export async function saveConsumptionRecord(data: any) {
  const { appliance, category, unit, period, provider } = data;
  const { dailyKwh, dailyCost, monthlyCost, numericValue, numericHours, numericQty, numericRate } = calculateRecordCosts(data);

  try {
    const user = await getAuthenticatedUser();
    // ✅ AYOS: Diretsahang kinuha ang user.id para siguradong may maipasa sa RLS
    const userId = user?.id; 

    if (!userId || !isValidUUID(userId)) {
      const msg = `Invalid or missing user id for DB insert: ${userId}`;
      console.error(msg);
      return { success: false, error: msg };
    }

    const { error } = await supabase
      .from('energy_logs')
      .insert([{
        user_id: userId, // Siguradong pasok na ito sa RLS policy mo
        appliance: appliance,
        category: category,
        unit: unit,
        period: period || 'Daily',
        value: numericValue,
        hours_used: numericHours,
        quantity: numericQty,
        provider: provider,
        rate: numericRate,
        daily_kwh: dailyKwh,
        monthly_cost: monthlyCost,
        created_at: new Date().toISOString(),
      }]);

    if (error) {
      console.error('Supabase insert error:', error);
      return { success: false, error };
    }

    return { success: true, dailyCost, monthlyCost };
  } catch (error) {
    console.error('Error saving record:', error);
    return { success: false, error };
  }
}

// --- DELETE LOGIC ---
export async function deleteConsumptionRecord(id: string) {
  try {
    const { error } = await supabase
      .from('energy_logs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }
    return { success: true };
  } catch (error) {
    console.error('Error deleting record:', error);
    throw error;
  }
}

// --- HISTORY LIST LOGIC (REAL-TIME) ---
export function getConsumptionHistory(callback: (data: any[]) => void) {
  let subscription: any = null;

  const fetchData = async () => {
    try {
      const user = await getAuthenticatedUser();
      const userId = user?.id;
      if (!userId || !isValidUUID(userId)) {
        callback([]);
        return;
      }

      const { data, error } = await supabase
        .from('energy_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase history fetch error:', error);
        callback([]);
        return;
      }

      callback(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      callback([]);
    }
  };

  fetchData();

  (async () => {
    const user = await getAuthenticatedUser();
    const userId = user?.id;
    if (!userId) return;

    subscription = supabase
      .channel(`history_user_${userId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'energy_logs',
        filter: `user_id=eq.${userId}` 
      }, () => {
        fetchData();
      })
      .subscribe();
  })();

  return () => {
    if (subscription) supabase.removeChannel(subscription);
  };
}

// --- DASHBOARD LOGIC (REAL-TIME) ---
export function getDashboardData(callback: (data: any) => void) {
  let subscription: any = null;

  const fetchDashboard = async () => {
    try {
      const user = await getAuthenticatedUser();
      const userId = user?.id;
      if (!userId || !isValidUUID(userId)) {
        callback({
          totalMonthly: 0,
          totalDaily: 0,
          applianceCount: 0,
          pieData: [],
          topTenData: { labels: [], datasets: [{ data: [] }] },
          trendData: { labels: ['S', 'M', 'T', 'W', 'T', 'F', 'S'], datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }] },
        });
        return;
      }

      const { data: logs, error } = await supabase
        .from('energy_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
      const todayIndex = new Date().getDay();
      
      const dynamicLabels: string[] = [];
      for (let i = 6; i >= 0; i--) {
        const dayIndex = (todayIndex - i + 7) % 7;
        dynamicLabels.push(daysOfWeek[dayIndex]);
      }

      if (error || !logs || logs.length === 0) {
        if (error) console.error('Supabase dashboard fetch error:', error);
        callback({
          totalMonthly: 0,
          totalDaily: 0,
          applianceCount: 0,
          pieData: [],
          topTenData: { labels: [], datasets: [{ data: [] }] },
          trendData: { labels: dynamicLabels, datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }] },
        });
        return;
      }

      let tempMonthly = 0;
      let tempDaily = 0;
      const categoryTotals: Record<string, number> = {};
      const applianceAggregator: Record<string, number> = {};
      
      const weeklyTrendData = new Array(7).fill(0);
      const pitongArawNaNakaraan = new Date();
      pitongArawNaNakaraan.setDate(pitongArawNaNakaraan.getDate() - 7);

      logs.forEach((item: any) => {
        const { dailyCost, monthlyCost } = calculateRecordCosts(item);
        const categoryName = item.category || 'Others';
        const name = (item.appliance || item.appliance_name || 'Unknown').trim();

        tempMonthly += monthlyCost;
        tempDaily += dailyCost;

        categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + monthlyCost;
        applianceAggregator[name] = (applianceAggregator[name] || 0) + monthlyCost;

        const createdAt = item.created_at ? new Date(item.created_at) : null;
        if (createdAt && createdAt >= pitongArawNaNakaraan) {
          const itemDayLabel = daysOfWeek[createdAt.getDay()];
          const labelIdx = dynamicLabels.indexOf(itemDayLabel);
          if (labelIdx !== -1) {
            weeklyTrendData[labelIdx] += dailyCost;
          }
        }
      });

      const colors = ['#1A442E', '#2D6A4F', '#40916C', '#52B788', '#74C69D'];
      const formattedPie = Object.keys(categoryTotals).map((cat, index) => ({
        name: cat,
        population: categoryTotals[cat],
        color: colors[index % colors.length],
        legendFontColor: '#64748B',
        legendFontSize: 12,
      }));

      const sortedList = Object.keys(applianceAggregator)
        .map((name) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          cost: applianceAggregator[name],
        }))
        .sort((a, b) => b.cost - a.cost)
        .slice(0, 10);

      callback({
        totalMonthly: tempMonthly,
        totalDaily: tempDaily,
        applianceCount: Object.keys(applianceAggregator).length,
        pieData: formattedPie,
        topTenData: {
          labels: sortedList.map((item) => item.name.substring(0, 6)),
          datasets: [{ data: sortedList.map((item) => item.cost) }],
        },
        trendData: {
          labels: dynamicLabels,
          datasets: [{ data: weeklyTrendData }],
        },
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  fetchDashboard();

  (async () => {
    const user = await getAuthenticatedUser();
    const userId = user?.id;
    if (!userId) return;

    subscription = supabase
      .channel(`dashboard_user_${userId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'energy_logs',
        filter: `user_id=eq.${userId}` 
      }, () => {
        fetchDashboard();
      })
      .subscribe();
  })();

  return () => {
    if (subscription) supabase.removeChannel(subscription);
  };
}