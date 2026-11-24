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
  source: 'gemini' | 'local_heuristic';
  actionPayload: Record<string, string | number | boolean>;
}

const MODEL_CHAIN = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'] as const;

function buildTelemetryFallback(snapshot: TelemetrySnapshot): GeneratedRecommendation {
  const spread = Math.max(1, snapshot.tariffPeak - snapshot.tariffBase);
  if (snapshot.acIsOn && snapshot.acTargetTemp < 24.5) {
    const suggestedTemp = Math.min(26, Math.round((snapshot.acTargetTemp + 1.5) * 2) / 2);
    const savedKwh = Number((0.45 + (suggestedTemp - snapshot.acTargetTemp) * 0.25).toFixed(1));
    const savedInr = Math.round(savedKwh * snapshot.tariffPeak);
    return {
      title: `Raise AC setpoint to ${suggestedTemp}°C during peak`,
      description: `Increasing target from ${snapshot.acTargetTemp}°C trims compressor load by ~14% while staying within comfort range.`,
      savingsLabel: `+${savedKwh} kWh saved (~₹${savedInr}/day)`,
      confidence: 93,
      category: 'climate',
      source: 'local_heuristic',
      actionPayload: { actionType: 'set_temp', targetTemp: suggestedTemp, scheduleTime: '18:00' },
    };
  }
  if (snapshot.activeLights >= 3) {
    const savedKwh = Number((snapshot.activeLights * 0.14).toFixed(1));
    const savedInr = Math.max(4, Math.round(savedKwh * snapshot.tariffPeak));
    return {
      title: `Dim ${snapshot.activeLights} active lights to 55% at dusk`,
      description: `Evening ambient dimming lowers lighting draw from ${snapshot.totalWatts}W total load without reducing room visibility.`,
      savingsLabel: `+${savedKwh} kWh saved (~₹${savedInr}/day)`,
      confidence: 91,
      category: 'routine',
      source: 'local_heuristic',
      actionPayload: { actionType: 'set_temp', targetTemp: 24.5, scheduleTime: '19:30' },
    };
  }
  const savedKwh = Number((0.6 + spread * 0.08).toFixed(1));
  const savedInr = Math.max(8, Math.round(savedKwh * spread));
  return {
    title: 'Pre-cool residence at 5:30 PM off-peak',
    description: `Shifting cooling before the ₹${snapshot.tariffPeak.toFixed(1)}/kWh peak tariff window lowers daily HVAC cost.`,
    savingsLabel: `+${savedKwh} kWh saved (~₹${savedInr}/day)`,
    confidence: 92,
    category: 'energy',
    source: 'local_heuristic',
    actionPayload: { actionType: 'set_temp', targetTemp: 24, scheduleTime: '17:30' },
  };
}

export async function generateAwareAssistSuggestion(
  snapshot: TelemetrySnapshot
): Promise<GeneratedRecommendation> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return buildTelemetryFallback(snapshot);
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
Analyze this live household telemetry and produce ONE specific, actionable optimization recommendation:
- House Mode: ${snapshot.houseMode}
- Security Mode: ${snapshot.securityMode}
- Lighting: ${snapshot.activeLights} of ${snapshot.totalLights} fixtures active
- AC State: ${snapshot.acIsOn ? `On, Target ${snapshot.acTargetTemp}°C (Room ${snapshot.acCurrentTemp}°C)` : 'Off'}
- Current Instantaneous Load: ${snapshot.totalWatts} W
- Tariff Rates: Off-Peak ₹${snapshot.tariffBase}/kWh, Peak ₹${snapshot.tariffPeak}/kWh

Return concise, plain-language guidance with realistic estimated kWh and ₹/day savings.`;

  for (const model of MODEL_CHAIN) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: 'Short actionable headline under 48 characters.',
              },
              description: {
                type: Type.STRING,
                description:
                  'One concise sentence explaining why this saves energy or improves comfort.',
              },
              savingsLabel: {
                type: Type.STRING,
                description: 'Compact savings metric like "+0.6 kWh saved (~₹11/day)".',
              },
              confidence: {
                type: Type.INTEGER,
                description: 'Confidence percentage between 82 and 98.',
              },
              category: {
                type: Type.STRING,
                description: 'One of energy, climate, or routine.',
              },
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
      if (!rawText) continue;
      const parsed = JSON.parse(rawText);

      const category =
        parsed.category === 'climate' || parsed.category === 'routine'
          ? parsed.category
          : 'energy';

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
    } catch (err) {
      console.warn(`Aware Assist model ${model} unavailable, trying next fallback:`, err);
    }
  }

  return buildTelemetryFallback(snapshot);
}
