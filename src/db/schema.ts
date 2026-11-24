import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

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

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name').notNull().default('Ayush Sharma'),
  residenceName: text('residence_name').notNull().default('Oakridge Residence'),
  role: text('role').notNull().default('Admin'),
  houseMode: text('house_mode').notNull().default('auto'),
  securityMode: text('security_mode').notNull().default('home'),
  securityAlertActive: boolean('security_alert_active').notNull().default(false),
  theme: text('theme').notNull().default('dark'),
  tempUnit: text('temp_unit').notNull().default('C'),
  tariffBase: doublePrecision('tariff_base').notNull().default(4.2),
  tariffPeak: doublePrecision('tariff_peak').notNull().default(9.8),
  notifySecurity: boolean('notify_security').notNull().default(true),
  notifyEnergy: boolean('notify_energy').notNull().default(true),
  notifyOffline: boolean('notify_offline').notNull().default(false),
  localProcessing: boolean('local_processing').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const rooms = pgTable('rooms', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid')
    .notNull()
    .references(() => users.uid, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  icon: text('icon').notNull().default('chair'),
  zone: text('zone').notNull().default('Zone 1'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const devices = pgTable('devices', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid')
    .notNull()
    .references(() => users.uid, { onDelete: 'cascade' }),
  roomId: integer('room_id').references(() => rooms.id, { onDelete: 'set null' }),
  roomName: text('room_name').notNull(),
  name: text('name').notNull(),
  subtitle: text('subtitle').notNull().default(''),
  category: text('category').notNull(), // lighting | climate | security | appliance
  deviceType: text('device_type').notNull(), // light | ac | lock | door_sensor | window_sensor | motion_sensor | plug | water_heater
  icon: text('icon').notNull().default('devices'),
  isOn: boolean('is_on').notNull().default(true),
  online: boolean('online').notNull().default(true),
  brightness: integer('brightness'),
  targetTemp: doublePrecision('target_temp'),
  currentTemp: doublePrecision('current_temp'),
  humidity: integer('humidity'),
  acMode: text('ac_mode'),
  fanSpeed: text('fan_speed'),
  isLocked: boolean('is_locked'),
  sensorStatus: text('sensor_status'),
  battery: integer('battery'),
  powerWatts: doublePrecision('power_watts').notNull().default(0),
  weeklyKwh: doublePrecision('weekly_kwh').notNull().default(0),
  protocol: text('protocol').notNull().default('Simulated MQTT'),
  ipAddress: text('ip_address').notNull().default('192.168.1.142'),
  macAddress: text('mac_address').notNull().default('48:E7:DA:11:8C:F2'),
  firmware: text('firmware').notNull().default('v2.4.1-sim'),
  lastSeen: text('last_seen').notNull().default('Just now'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const automations = pgTable('automations', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid')
    .notNull()
    .references(() => users.uid, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description').notNull(),
  source: text('source').notNull().default('manual'), // manual | ai
  enabled: boolean('enabled').notNull().default(true),
  triggerType: text('trigger_type').notNull(),
  triggerLabel: text('trigger_label').notNull(),
  triggerIcon: text('trigger_icon').notNull().default('bolt'),
  conditions: jsonb('conditions').$type<RuleCondition[]>().notNull().default([]),
  actions: jsonb('actions').$type<RuleAction[]>().notNull().default([]),
  days: jsonb('days').$type<string[]>().notNull().default(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']),
  startTime: text('start_time').notNull().default('08:00'),
  endTime: text('end_time').notNull().default('18:00'),
  priority: text('priority').notNull().default('Normal'), // Low | Normal | High
  zoneLabel: text('zone_label').notNull().default('Whole Home'),
  lastTriggered: text('last_triggered').notNull().default('Never'),
  savingsText: text('savings_text'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const securityEvents = pgTable('security_events', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid')
    .notNull()
    .references(() => users.uid, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  detail: text('detail').notNull(),
  severity: text('severity').notNull().default('info'), // info | warning | critical
  zone: text('zone').notNull().default('Perimeter'),
  icon: text('icon').notNull().default('verified_user'),
  timeLabel: text('time_label').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const recommendations = pgTable('recommendations', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid')
    .notNull()
    .references(() => users.uid, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  savingsLabel: text('savings_label').notNull(),
  confidence: integer('confidence').notNull().default(94),
  category: text('category').notNull().default('energy'), // energy | routine | climate
  status: text('status').notNull().default('active'), // active | applied | dismissed
  actionPayload: jsonb('action_payload').$type<Record<string, string | number | boolean>>().notNull().default({}),
  createdAt: timestamp('created_at').defaultNow(),
});

export const energyLogs = pgTable('energy_logs', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid')
    .notNull()
    .references(() => users.uid, { onDelete: 'cascade' }),
  period: text('period').notNull(), // day | week | month
  label: text('label').notNull(),
  actualKwh: doublePrecision('actual_kwh').notNull(),
  baselineKwh: doublePrecision('baseline_kwh').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const usersRelations = relations(users, ({ many }) => ({
  rooms: many(rooms),
  devices: many(devices),
  automations: many(automations),
  securityEvents: many(securityEvents),
  recommendations: many(recommendations),
  energyLogs: many(energyLogs),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  user: one(users, { fields: [rooms.userUid], references: [users.uid] }),
  devices: many(devices),
}));

export const devicesRelations = relations(devices, ({ one }) => ({
  user: one(users, { fields: [devices.userUid], references: [users.uid] }),
  room: one(rooms, { fields: [devices.roomId], references: [rooms.id] }),
}));
