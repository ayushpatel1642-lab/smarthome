import type {
  AiRecommendation,
  AutomationRule,
  HomeStatePayload,
  Room,
  SecurityEvent,
  SmartDevice,
  UserProfile,
} from '../../types/home';

async function apiFetch<T>(
  url: string,
  token: string | null,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const homeApi = {
  fetchState: (token: string) => apiFetch<HomeStatePayload>('/api/state', token),

  updateProfile: (token: string, updates: Partial<UserProfile>) =>
    apiFetch<UserProfile>('/api/profile', token, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  createRoom: (token: string, payload: { name: string; icon?: string; zone?: string }) =>
    apiFetch<Room>('/api/rooms', token, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteRoom: (token: string, id: number) =>
    apiFetch<{ ok: boolean }>(`/api/rooms/${id}`, token, { method: 'DELETE' }),

  createDevice: (
    token: string,
    payload: {
      name: string;
      subtitle?: string;
      roomId: number | null;
      roomName: string;
      category: string;
      deviceType: string;
      icon: string;
      protocol?: string;
    }
  ) =>
    apiFetch<SmartDevice>('/api/devices', token, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateDevice: (token: string, id: number, updates: Partial<SmartDevice>) =>
    apiFetch<SmartDevice>(`/api/devices/${id}`, token, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  deleteDevice: (token: string, id: number) =>
    apiFetch<{ ok: boolean }>(`/api/devices/${id}`, token, { method: 'DELETE' }),

  createAutomation: (token: string, payload: Omit<AutomationRule, 'id' | 'lastTriggered' | 'savingsText'>) =>
    apiFetch<AutomationRule>('/api/automations', token, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateAutomation: (token: string, id: number, updates: Partial<AutomationRule>) =>
    apiFetch<AutomationRule>(`/api/automations/${id}`, token, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  deleteAutomation: (token: string, id: number) =>
    apiFetch<{ ok: boolean }>(`/api/automations/${id}`, token, { method: 'DELETE' }),

  createSecurityEvent: (token: string, payload: Omit<SecurityEvent, 'id'>) =>
    apiFetch<SecurityEvent>('/api/security-events', token, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  clearSecurityEvents: (token: string) =>
    apiFetch<{ ok: boolean }>('/api/security-events', token, { method: 'DELETE' }),

  updateRecommendation: (
    token: string,
    id: number,
    status: 'active' | 'applied' | 'dismissed'
  ) =>
    apiFetch<AiRecommendation>(`/api/recommendations/${id}`, token, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  generateAiRecommendation: (
    token: string | null,
    snapshot: {
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
  ) =>
    apiFetch<AiRecommendation & { source?: 'gemini' | 'local_heuristic' }>('/api/ai/recommend', token, {
      method: 'POST',
      body: JSON.stringify({ snapshot }),
    }),

  resetResidence: (token: string) =>
    apiFetch<HomeStatePayload>('/api/reset', token, { method: 'POST' }),
};
