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
  // MODIFIED: Idinagdag ang 'room' sa pag-destructure mula sa pinapásang data payload
  const { appliance, category, room, unit, period, provider } = data;
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
        room: room || 'General', // MODIFIED: Isinama ang room column kasama ang 'General' bilang safe default fallback
        unit: unit,
        period: period || 'Daily',
        value: numericValue,
        hours_used: numericHours,
        quantity: numericQty,
        provider: provider,
        rate: numericRate,
        daily_kwh: dailyKwh,
        daily_cost: dailyCost,
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
  let isMounted = true;
  let activeChannel: any = null;

  const fetchData = async () => {
    try {
      const user = await getAuthenticatedUser();
      const userId = user?.id;
      if (!userId || !isValidUUID(userId)) {
        if (isMounted) callback([]);
        return;
      }

      const { data, error } = await supabase
        .from('energy_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase history fetch error:', error);
        if (isMounted) callback([]);
        return;
      }

      if (isMounted) callback(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      if (isMounted) callback([]);
    }
  };

  fetchData();

  getAuthenticatedUser().then((user) => {
    if (!user?.id || !isMounted) return;

    const channelName = `history_user_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'energy_logs',
        filter: `user_id=eq.${user.id}` 
      }, () => {
        fetchData();
      });

    activeChannel = channel;
    channel.subscribe();
  });

  return () => {
    isMounted = false;
    if (activeChannel) {
        supabase.removeChannel(activeChannel);
    }
  };
}

// --- DASHBOARD LOGIC (REAL-TIME) ---
export function getDashboardData(callback: (data: any) => void) {
  let isMounted = true;
  let activeChannel: any = null;

  const fetchDashboard = async () => {
    try {
      const user = await getAuthenticatedUser();
      const userId = user?.id;
      if (!userId || !isValidUUID(userId)) {
        if (isMounted) callback({
          totalMonthly: 0,
          totalDaily: 0,
          applianceCount: 0,
          pieData: [],
          topTenData: { labels: [], datasets: [{ data: [] }] },
          trendData: { labels: ['S', 'M', 'T', 'W', 'T', 'F', 'S'], datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }] },
        });
        return;
      }

      // 📅 MONTHLY FILTER: Only aggregate records from the current calendar month.
      // History records remain fully intact — only the dashboard query scope changes.
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

      const { data: logs, error } = await supabase
        .from('energy_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startOfMonth)
        .lt('created_at', startOfNextMonth)
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
        if (isMounted) callback({
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
        
        // 🛠️ TINAMPOK AT INAYOS: Ginawang lowercase ang key para basahin bilang ISA ang parehong spelling (light, LIGHT, Light)
        const rawName = (item.appliance || item.appliance_name || 'Unknown').trim();
        const lowerName = rawName.toLowerCase();

        tempMonthly += monthlyCost;
        tempDaily += dailyCost;

        categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + monthlyCost;
        
        // Pinagsasama na natin ang value gamit ang iisang case-insensitive key
        applianceAggregator[lowerName] = (applianceAggregator[lowerName] || 0) + monthlyCost;

        const createdAt = item.created_at ? new Date(item.created_at) : null;
        if (createdAt && createdAt >= pitongArawNaNakaraan) {
          const itemDayLabel = daysOfWeek[createdAt.getDay()];
          const labelIdx = dynamicLabels.indexOf(itemDayLabel);
          if (labelIdx !== -1) {
            weeklyTrendData[labelIdx] += dailyCost;
          }
        }
      });

      // 🎨 TINAMPOK AT INAYOS: Pinalawak ang color palette ng high-contrast distinct colors para makita lahat ng categories
      const colors = ['#1A442E', '#2D6A4F', '#2A6F97', '#014F86', '#4A4E69', '#6D597A', '#B56576', '#E56B6F', '#E07A5F', '#F4A261'];
      
      const formattedPie = Object.keys(categoryTotals).map((cat, index) => ({
        name: cat,
        population: categoryTotals[cat],
        color: colors[index % colors.length], // Dynamic cycling para sa unique identifications
        legendFontColor: '#64748B',
        legendFontSize: 12,
      }));

      const sortedList = Object.keys(applianceAggregator)
        .map((lowerName) => ({
          // Ibinabalik natin sa Proper Case para malinis at may capital letter pa rin ang label sa graph mo
          name: lowerName.charAt(0).toUpperCase() + lowerName.slice(1),
          cost: applianceAggregator[lowerName],
        }))
        .sort((a, b) => b.cost - a.cost)
        .slice(0, 10);

      if (isMounted) callback({
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

  getAuthenticatedUser().then((user) => {
    if (!user?.id || !isMounted) return;

    const channelName = `dashboard_user_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'energy_logs',
        filter: `user_id=eq.${user.id}` 
      }, () => {
        fetchDashboard();
      });

    activeChannel = channel;
    channel.subscribe();
  });

  return () => {
    isMounted = false;
    if (activeChannel) {
        supabase.removeChannel(activeChannel);
    }
  };
}