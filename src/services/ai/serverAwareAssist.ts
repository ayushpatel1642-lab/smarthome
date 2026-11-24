import { GoogleGenAI, Type } from '@google/genai';

export interface TelemetrySnapshot {
  houseMode: string;
  securityMode: string;
  activeLights: number;
  totalLights: number;
  acTargetTemp: number;
  acCurrentTemp: number;
  acIsOn: boolean;
  totalWatts: number;
  tariffBase: number;
  tariffPeak: number;
}

export interface GeneratedRecommendation {
  title: string;
  description: string;
  savingsLabel: string;
  confidence: number;
  category: 'energy' | 'climate' | 'routine';
  source: 'gemini' | 'deterministic';
  actionPayload: Record<string, string | number | boolean>;
}

export async function generateAwareAssistSuggestion(
  snapshot: TelemetrySnapshot
): Promise<GeneratedRecommendation> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const prompt = `You are Aware Assist, a smart home energy and comfort optimization engine.
Analyze this live simulated household telemetry and produce ONE specific, actionable optimization recommendation:
- House Mode: ${snapshot.houseMode}
- Security Mode: ${snapshot.securityMode}
- Lighting: ${snapshot.activeLights} of ${snapshot.totalLights} fixtures active
- AC State: ${snapshot.acIsOn ? `On, Target ${snapshot.acTargetTemp}°C (Room ${snapshot.acCurrentTemp}°C)` : 'Off'}
- Current Instantaneous Load: ${snapshot.totalWatts} W
- Tariff Rates: Off-Peak ₹${snapshot.tariffBase}/kWh, Peak ₹${snapshot.tariffPeak}/kWh

Return concise, practical smart home guidance with realistic estimated kWh and ₹/day savings.`;

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'Short actionable headline under 48 characters.' },
          description: {
            type: Type.STRING,
            description: 'One concise sentence explaining why this saves energy or improves comfort.',
          },
          savingsLabel: {
            type: Type.STRING,
            description: 'Compact savings metric like "+0.6 kWh saved (~₹11/day)".',
          },
          confidence: { type: Type.INTEGER, description: 'Confidence percentage between 82 and 98.' },
          category: { type: Type.STRING, description: 'One of energy, climate, or routine.' },
          recommendedTemp: {
            type: Type.NUMBER,
            description: 'Recommended AC temperature in Celsius between 23 and 27.',
          },
        },
        required: ['title', 'description', 'savingsLabel', 'confidence', 'category'],
      },
    },
  });

  const rawText = (response.text ?? '').trim();
  const parsed = JSON.parse(rawText);

  const category =
    parsed.category === 'climate' || parsed.category === 'routine' ? parsed.category : 'energy';

  return {
    title: String(parsed.title || 'Optimize off-peak HVAC cycle'),
    description: String(
      parsed.description ||
        'Shift cooling load outside peak tariff hours based on current room thermal inertia.'
    ),
    savingsLabel: String(parsed.savingsLabel || '+0.7 kWh saved (~₹12/day)'),
    confidence: Math.min(99, Math.max(75, Number(parsed.confidence) || 92)),
    category,
    source: 'gemini',
    actionPayload: {
      actionType: 'set_temp',
      targetTemp: Number(parsed.recommendedTemp) || 25,
    },
  };
}
