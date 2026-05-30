import axios from 'axios';

// 🛠️ FIX: Opisyal na Google Generative Language API Base URL para sa Gemini Models
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
// Gagamitin natin ang gemini-1.5-flash dahil ito ang pinakamabilis at cost-effective para sa mobile analytics text processing
const GEMINI_MODEL = 'gemini-1.5-flash'; 

export async function generateEnergyInsights(prompt: string): Promise<string> {
  // 🛠️ FIX: Siguraduhing may "EXPO_PUBLIC_" prefix ang iyong .env variable para mabasa ng bundler sa mobile app
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    console.error('Missing Gemini API Key. Make sure EXPO_PUBLIC_GEMINI_API_KEY is defined in your .env file.');
    return "Hindi makabuo ng AI Insights sa ngayon dahil kulang ang configuration ng system.";
  }

  try {
    // 🛠️ FIX: Ang API key ay ipinapasa bilang query param (?key=), at ang dulo ng URL ay :generateContent
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

    // 🛠️ FIX: Tamang pag-extract ng text payload base sa JSON return object ng Gemini API response
    const aiResponseText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!aiResponseText) {
      throw new Error('Empty response format from Gemini API structure.');
    }

    return aiResponseText;

  } catch (error: any) {
    console.error('Gemini API request failed:', error?.response?.data || error.message);
    // Nag-iiwan tayo ng ligtas at user-friendly na fallback message para sa mga tenants kapag walang internet o nag-rate limit ang key
    return "Paumanhin, hindi mkapag-generate ng AI energy insights sa ngayon. Paki-check ang iyong network connection.";
  }
}