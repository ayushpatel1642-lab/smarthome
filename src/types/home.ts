export type HouseMode = 'home' | 'away' | 'night' | 'auto';
export type SecurityMode = 'home' | 'away' | 'disarmed';
export type ThemePreference = 'dark' | 'light' | 'auto';
export type TempUnit = 'C' | 'F';
export type DeviceCategory = 'lighting' | 'climate' | 'security' | 'appliance';
export type DeviceType =
  | 'light'
  | 'ac'
  | 'lock'
  | 'door_sensor'
  | 'window_sensor'
  | 'motion_sensor'
  | 'plug'
  | 'water_heater';
export type AcMode = 'cool' | 'heat' | 'fan' | 'auto' | 'dry';
export type FanSpeed = 'low' | 'med' | 'high' | 'auto';
export type RulePriority = 'Low' | 'Normal' | 'High';
export type EnergyPeriod = 'day' | 'week' | 'month';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  residenceName: string;
  role: string;
  houseMode: HouseMode;
  securityMode: SecurityMode;
  securityAlertActive: boolean;
  theme: ThemePreference;
  tempUnit: TempUnit;
  tariffBase: number;
  tariffPeak: number;
  notifySecurity: boolean;
  notifyEnergy: boolean;
  notifyOffline: boolean;
  localProcessing: boolean;
}

export interface Room {
  id: number;
  name: string;
  icon: string;
  zone: string;
}

export interface SmartDevice {
  id: number;
  roomId: number | null;
  roomName: string;
  name: string;
  subtitle: string;
  category: DeviceCategory;
  deviceType: DeviceType;
  icon: string;
  isOn: boolean;
  online: boolean;
  brightness: number | null;
  targetTemp: number | null;
  currentTemp: number | null;
  humidity: number | null;
  acMode: AcMode | null;
  fanSpeed: FanSpeed | null;
  isLocked: boolean | null;
  sensorStatus: string | null;
  battery: number | null;
  powerWatts: number;
  weeklyKwh: number;
  protocol: string;
  ipAddress: string;
  macAddress: string;
  firmware: string;
  lastSeen: string;
}

export interface RuleCondition {
  id: string;
  label: string;
  detail: string;
  icon: string;
  metric: string;
  operator: string;
  value: string;
}

export interface RuleAction {
  id: string;
  label: string;
  detail: string;
  icon: string;
  endIcon: string;
  actionType: 'arm_security' | 'set_temp' | 'lights_off' | 'lights_on' | 'notify' | 'lock_doors';
  payload: Record<string, string | number | boolean>;
}

export interface AutomationRule {
  id: number;
  name: string;
  description: string;
  source: 'manual' | 'ai';
  enabled: boolean;
  triggerType: string;
  triggerLabel: string;
  triggerIcon: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  days: string[];
  startTime: string;
  endTime: string;
  priority: RulePriority;
  zoneLabel: string;
  lastTriggered: string;
  savingsText: string | null;
}

export interface SecurityEvent {
  id: number;
  title: string;
  detail: string;
  severity: 'info' | 'warning' | 'critical';
  zone: string;
  icon: string;
  timeLabel: string;
}

export interface AiRecommendation {
  id: number;
  title: string;
  description: string;
  savingsLabel: string;
  confidence: number;
  category: 'energy' | 'routine' | 'climate';
  status: 'active' | 'applied' | 'dismissed';
  actionPayload: Record<string, string | number | boolean>;
}

export interface EnergyPoint {
  id: number;
  period: EnergyPeriod;
  label: string;
  actualKwh: number;
  baselineKwh: number;
  sortOrder: number;
}

export interface HomeStatePayload {
  profile: UserProfile;
  rooms: Room[];
  devices: SmartDevice[];
  automations: AutomationRule[];
  securityEvents: SecurityEvent[];
  recommendations: AiRecommendation[];
  energyLogs: EnergyPoint[];
}
