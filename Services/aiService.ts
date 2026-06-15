import axios from 'axios';

// 🛠️ Official Google Generative Language API Base URL for Gemini Models
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1/models';
// Using gemini-2.5-flash as it is the latest, fast, and most effective model for mobile text processing
const GEMINI_MODEL = 'gemini-2.5-flash'; 

/**
 * PRIMARY FUNCTION: Direct communication with the Gemini API using a prompt string
 */
export async function generateEnergyInsights(prompt: string): Promise<string> {
  // Ensure the EXPO_PUBLIC_ prefix is present so the bundler can read it in the mobile app
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    console.error('Missing Gemini API Key. Make sure EXPO_PUBLIC_GEMINI_API_KEY is defined in your .env file.');
    return "Could not generate AI Insights at this moment due to missing system configuration.";
  }

  try {
    // The API key is passed as a query param (?key=), and the endpoint terminates with :generateContent
    const response = await axios.post(
      `${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // Correct extraction of text payload based on the Gemini API JSON response structure
    const aiResponseText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!aiResponseText) {
      throw new Error('Empty response format from Gemini API structure.');
    }

    return aiResponseText;

  } catch (error: any) {
    console.error('Gemini API request failed:', error?.response?.data || error.message);
    // Safe user-friendly fallback message in case of network issues or rate limits
    return "An error occurred while generating AI energy insights. Please check your network connection and try again.";
  }
}
export function getApplianceLogsText(activeDatabaseLogs: any[]): string {
  let text = '';
  if (activeDatabaseLogs && activeDatabaseLogs.length > 0) {
    activeDatabaseLogs.forEach(log => {
      const name = log.appliance || 'Unknown Appliance';
      const hours = log.hours_used || 0;
      const monthly = log.monthly_cost || 0;
      const quantity = log.quantity || 1;
      text += `- Appliance: ${name}, Hours Used: ${hours} hrs/day, Quantity: ${quantity}, Monthly Cost: ₱${Number(monthly).toFixed(2)}\n`;
    });
  } else {
    text += "(No appliance logs are currently saved in the tenant's history database.)\n";
  }
  return text.trim();
}

export function getDailyLogsText(dailyLogs: { date: string; totalKwh: number }[]): string {
  const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  let text = '';
  if (dailyLogs && dailyLogs.length > 0) {
    dailyLogs.forEach(log => {
      const dateObj = new Date(log.date);
      const dayOfWeek = weekdayNames[dateObj.getDay()] || 'Unknown';
      text += `- Date: ${log.date}, Day: ${dayOfWeek}, Total kWh: ${log.totalKwh.toFixed(3)} kWh\n`;
    });
  } else {
    text += "(No daily logs are recorded this month.)\n";
  }
  return text.trim();
}

export async function getTenantPredictionAndTips(
  activeDatabaseLogs: any[],
  dailyLogs: { date: string; totalKwh: number }[],
  totalAccumulatedKwh: number,
  currentRate: number = 11.50
): Promise<string> {
  const historyText = getApplianceLogsText(activeDatabaseLogs);
  const baseDailyText = getDailyLogsText(dailyLogs);

  // 2. TypeScript calculations
  const daysLogged = dailyLogs.length;

  const weekdayLogs = dailyLogs.filter((entry) => {
    const day = new Date(entry.date).getDay();
    return day !== 0 && day !== 6;
  });
  const weekendLogs = dailyLogs.filter((entry) => {
    const day = new Date(entry.date).getDay();
    return day === 0 || day === 6;
  });

  const overallAvg = daysLogged > 0
    ? dailyLogs.reduce((sum, entry) => sum + entry.totalKwh, 0) / daysLogged
    : 0;

  const weekdayAvg = weekdayLogs.length > 0
    ? weekdayLogs.reduce((sum, entry) => sum + entry.totalKwh, 0) / weekdayLogs.length
    : overallAvg * 0.75;

  const weekendAvg = weekendLogs.length > 0
    ? weekendLogs.reduce((sum, entry) => sum + entry.totalKwh, 0) / weekendLogs.length
    : overallAvg * 1.35;

  let stdDev: number | null = null;
  if (daysLogged >= 7) {
    const sumOfSquares = dailyLogs.reduce((sum, entry) => sum + Math.pow(entry.totalKwh - overallAvg, 2), 0);
    stdDev = Math.sqrt(sumOfSquares / daysLogged);
  }

  let dailyText = baseDailyText;
  dailyText += `\nComputed Metrics:\n`;
  dailyText += `- Days Logged: ${daysLogged}\n`;
  dailyText += `- Overall Average Daily Usage: ${overallAvg.toFixed(3)} kWh\n`;
  dailyText += `- Weekday Average Daily Usage: ${weekdayAvg.toFixed(3)} kWh\n`;
  dailyText += `- Weekend Average Daily Usage: ${weekendAvg.toFixed(3)} kWh\n`;
  dailyText += `- Standard Deviation: ${stdDev !== null ? stdDev.toFixed(3) : 'N/A'}\n`;

  // Calculate prediction and explanation programmatically for perfect formatting
  let confidence = '';
  let howIComputedThis = '';
  let predictedKwhStr = '';
  let estimatedBillStr = '';

  const totalLoggedKwh = dailyLogs.reduce((sum, entry) => sum + entry.totalKwh, 0);

  if (daysLogged <= 2) {
    confidence = 'Early Estimate';
    const predictedKwhValue = overallAvg * 30;
    const predictedBillValue = predictedKwhValue * currentRate;

    howIComputedThis = `Step 1 — Daily average: ${totalLoggedKwh.toFixed(3)} kWh total ÷ ${daysLogged || 1} days = ${overallAvg.toFixed(3)} kWh/day
Step 2 — Monthly projection: ${overallAvg.toFixed(3)} kWh/day × 30 days = ${predictedKwhValue.toFixed(3)} kWh
Step 3 — Estimated bill: ${predictedKwhValue.toFixed(3)} kWh × ₱${currentRate.toFixed(2)}/kWh = ₱${predictedBillValue.toFixed(2)}

Note: Only ${daysLogged} day(s) logged. This is an early estimate. Accuracy improves as you log more days.`;

    predictedKwhStr = predictedKwhValue.toFixed(3);
    estimatedBillStr = `₱${predictedBillValue.toFixed(2)}`;
  } else if (daysLogged <= 6) {
    confidence = 'Building Estimate';
    const wdTotal = weekdayAvg * 22;
    const weTotal = weekendAvg * 8;
    const predictedKwhValue = wdTotal + weTotal;
    const predictedBillValue = predictedKwhValue * currentRate;

    howIComputedThis = `Step 1 — Weekday average: ${weekdayAvg.toFixed(3)} kWh/day × 22 weekdays = ${wdTotal.toFixed(3)} kWh
Step 2 — Weekend average: ${weekendAvg.toFixed(3)} kWh/day × 8 weekend days = ${weTotal.toFixed(3)} kWh
Step 3 — Total predicted: ${wdTotal.toFixed(3)} + ${weTotal.toFixed(3)} = ${predictedKwhValue.toFixed(3)} kWh
Step 4 — Estimated bill: ${predictedKwhValue.toFixed(3)} kWh × ₱${currentRate.toFixed(2)}/kWh = ₱${predictedBillValue.toFixed(2)}`;

    predictedKwhStr = predictedKwhValue.toFixed(3);
    estimatedBillStr = `₱${predictedBillValue.toFixed(2)}`;
  } else {
    confidence = 'Confident Estimate';
    const wdTotal = weekdayAvg * 22;
    const weTotal = weekendAvg * 8;
    const predictedKwhValue = wdTotal + weTotal;
    const predictedBillValue = predictedKwhValue * currentRate;
    const spread = (stdDev || 0) * 0.5 * 30;
    const lowKwh = predictedKwhValue - spread;
    const highKwh = predictedKwhValue + spread;
    const lowBill = lowKwh * currentRate;
    const highBill = highKwh * currentRate;

    howIComputedThis = `Step 1 — Weekday average: ${weekdayAvg.toFixed(3)} kWh/day × 22 weekdays = ${wdTotal.toFixed(3)} kWh
Step 2 — Weekend average: ${weekendAvg.toFixed(3)} kWh/day × 8 weekend days = ${weTotal.toFixed(3)} kWh
Step 3 — Total predicted: ${wdTotal.toFixed(3)} + ${weTotal.toFixed(3)} = ${predictedKwhValue.toFixed(3)} kWh
Step 4 — Estimated bill: ${predictedKwhValue.toFixed(3)} kWh × ₱${currentRate.toFixed(2)}/kWh = ₱${predictedBillValue.toFixed(2)}
Step 5 — Variance spread: ${(stdDev || 0).toFixed(3)} std dev × 0.5 × 30 = ±${spread.toFixed(3)} kWh
Step 6 — Bill range: ₱${lowBill.toFixed(2)} – ₱${highBill.toFixed(2)}, most likely ₱${predictedBillValue.toFixed(2)}`;

    predictedKwhStr = predictedKwhValue.toFixed(3);
    estimatedBillStr = `₱${lowBill.toFixed(2)} – ₱${highBill.toFixed(2)}, most likely ₱${predictedBillValue.toFixed(2)}`;
  }

  // De-duplicate top appliances and sort by monthly cost descending
  interface ApplianceGroup {
    originalName: string;
    totalCost: number;
    quantity: number;
  }
  const applianceMap = new Map<string, ApplianceGroup>();
  activeDatabaseLogs.forEach(log => {
    const name = (log.appliance || 'Unknown Appliance').trim();
    const quantity = Number(log.quantity) || 1;
    const cost = Number(log.monthly_cost) || 0;
    const key = name.toLowerCase();
    if (applianceMap.has(key)) {
      const existing = applianceMap.get(key)!;
      existing.totalCost += cost;
      existing.quantity += quantity;
    } else {
      applianceMap.set(key, { originalName: name, totalCost: cost, quantity });
    }
  });

  const sortedAppliances = Array.from(applianceMap.values())
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, 3);

  const topAppliancesLines = sortedAppliances.length > 0
    ? sortedAppliances
        .map(app => `${app.originalName} (x${app.quantity}): ₱${app.totalCost.toFixed(2)}`)
        .join('\n')
    : 'No logged appliances';

  // Request saving tips from Gemini model based on user's appliances and usage metrics
  const systemPrompt = `You are FairWatt AI, an expert energy data analyst. 
Based on the tenant's manual appliance logs, daily logs, and computed metrics, generate exactly 3 personalized, highly practical energy saving tips.

Tenant's Logged Appliances:
${historyText}

Computed Daily/Weekly Usage Summary:
${dailyText}

CRITICAL RULES:
1. Generate exactly 3 saving tips.
2. Format them EXACTLY as:
1. [Title of tip]
[2–3 sentence explanation specific to their appliance and hours used.]

2. [Title of tip]
[2–3 sentence explanation specific to their appliance and hours used.]

3. [Title of tip]
[2–3 sentence explanation specific to their appliance and hours used.]

3. Add exactly one blank line between the numbered tips.
4. Do NOT use any asterisks (*) anywhere in the response. Do NOT use markdown formatting (no bold **, no italic *). Use plain text ONLY.
5. Do NOT include any introductory or concluding remarks. Start directly with the first tip and end with the last tip.`;

  let savingTipsFromGemini = '';
  try {
    const aiResponseText = await generateEnergyInsights(systemPrompt);
    savingTipsFromGemini = aiResponseText.replace(/\*/g, '').trim();
  } catch (error) {
    console.error('Failed to generate saving tips from Gemini API:', error);
    savingTipsFromGemini = `1. Monitor Appliance Usage
Try to limit high-wattage appliance usage during peak hours to help manage your overall consumption.

2. Optimize Thermostat Settings
Keep air conditioners set to a moderate level and use built-in timers to reduce hours of operation where possible.

3. Unplug Idle Devices
Turn off bulbs and unplug electronics that are not actively in use to avoid phantom energy drain.`;
  }

  const separator = '────────────────────';
  
  const finalResponse = `📊 BILL PREDICTION

Confidence: ${confidence}
Days logged: ${daysLogged}

How I computed this:
${howIComputedThis}

Predicted kWh this month: ${predictedKwhStr} kWh
Estimated bill: ${estimatedBillStr}

${separator}

⚡ TOP CONSUMING APPLIANCES

${topAppliancesLines}

${separator}

💡 SAVING TIPS

${savingTipsFromGemini}

${separator}`;

  return finalResponse;
}