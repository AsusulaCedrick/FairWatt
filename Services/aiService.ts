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

/**
 * MODULE 6 FUNCTION: Processes database logs for Bill Prediction and Personalized Saving Tips
 */
export async function getTenantPredictionAndTips(activeDatabaseLogs: any[]): Promise<string> {
  // 1. PROMPT ENGINEERING: Mapped perfectly to match your actual database schema attributes
  let historyText = `Tenant's Saved Appliance Consumption Logs:\n`;
  
  if (activeDatabaseLogs && activeDatabaseLogs.length > 0) {
    activeDatabaseLogs.forEach(log => {
      // 🛠️ SCHEMA FIX: Using log.appliance, log.hours_used, log.quantity, log.rate, and log.monthly_cost from your system
      const name = log.appliance || 'Unknown Appliance';
      const hours = log.hours_used || 0;
      const rate = log.rate || 0;
      const monthly = log.monthly_cost || 0;
      const quantity = log.quantity || 1;

      historyText += `- Appliance: ${name}, Hours Used: ${hours} hrs/day, Quantity: ${quantity}, Calculated Monthly Cost: ₱${Number(monthly).toFixed(2)} (at a billing rate of ₱${Number(rate).toFixed(2)}/kWh)\n`;
    });
  } else {
    historyText += "(No appliance logs are currently saved in the tenant's history database.)\n";
  }

  // 2. SYSTEM INSTRUCTION: Formulating strict rules for Gemini based on Project Module 6 Requirements
  const systemPrompt = `You are FairWatt AI, an expert energy data analyst built specifically for tenants living in shared spaces without individual sub-meters. 
Your job is to evaluate the tenant's manual appliance usage history logs and provide a professional, highly detailed energy consumption breakdown.

CRITICAL REQUIREMENTS (Based on Project Module 6):
1. BILL PREDICTION: Analyze the provided appliance usage array and compute/predict their cumulative consumption pattern or expected upcoming bill total if they maintain these daily and monthly habits.
2. PERSONALIZED SAVING TIPS: Pinpoint exactly which high-load or heavy-use appliances (based on monthly costs and operational hours) are escalating their bill the most. Provide actionable, practical, and highly specific tips to help them lower their shared electricity expenses.
3. LANGUAGE & TONE: Respond entirely in clear, professional, yet easy-to-read English. Maintain a supportive and analytical tone. Use well-structured markdown fields, bold titles, and bullet points for effortless scannability on a mobile screen.

Here is the Tenant's Real-Time Data Logs:
${historyText}`;

  // 3. Invoke the core engine function using the compiled prompt template
  return await generateEnergyInsights(systemPrompt);
}