import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import {
  automations,
  devices,
  energyLogs,
  recommendations,
  rooms,
  RuleAction,
  RuleCondition,
  securityEvents,
  users,
} from './schema.ts';

export async function getOrCreateUser(uid: string, email: string, displayName?: string) {
  try {
    const cleanName = displayName?.trim() || email.split('@')[0] || 'Ayush Sharma';
    const [user] = await db
      .insert(users)
      .values({
        uid,
        email,
        displayName: cleanName,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: { email },
      })
      .returning();

    const existingRooms = await db.select().from(rooms).where(eq(rooms.userUid, uid));
    if (existingRooms.length === 0) {
      await seedInitialHomeData(uid);
    }

    return user;
  } catch (error) {
    console.error('Database error in getOrCreateUser:', error);
    throw new Error('Failed to load user profile.', { cause: error });
  }
}

async function seedInitialHomeData(uid: string) {
  const insertedRooms = await db
    .insert(rooms)
    .values([
      { userUid: uid, name: 'Living Room', icon: 'chair', zone: 'Zone 1' },
      { userUid: uid, name: 'Bedroom', icon: 'bed', zone: 'Zone 2' },
      { userUid: uid, name: 'Kitchen', icon: 'kitchen', zone: 'Zone 3' },
      { userUid: uid, name: 'Hallway & Entry', icon: 'meeting_room', zone: 'Zone 4' },
      { userUid: uid, name: 'Office', icon: 'desk', zone: 'Zone 5' },
    ])
    .returning();

  const roomMap = new Map(insertedRooms.map((r) => [r.name, r.id]));

  await db.insert(devices).values([
    {
      userUid: uid,
      roomId: roomMap.get('Living Room') ?? null,
      roomName: 'Living Room',
      name: 'Ceiling Luminaire',
      subtitle: 'Living Zone • 18W',
      category: 'lighting',
      deviceType: 'light',
      icon: 'lightbulb',
      isOn: true,
      online: true,
      brightness: 70,
      powerWatts: 18,
      weeklyKwh: 2.8,
      protocol: 'Simulated MQTT',
      ipAddress: '192.168.1.104',
      macAddress: '48:E7:DA:11:8C:A1',
      firmware: 'v2.4.1-sim',
      lastSeen: 'Just now',
    },
    {
      userUid: uid,
      roomId: roomMap.get('Living Room') ?? null,
      roomName: 'Living Room',
      name: 'Nordic Desk Lamp',
      subtitle: 'Reading Corner • 8W',
      category: 'lighting',
      deviceType: 'light',
      icon: 'desk',
      isOn: true,
      online: true,
      brightness: 40,
      powerWatts: 8,
      weeklyKwh: 1.7,
      protocol: 'Simulated MQTT',
      ipAddress: '192.168.1.105',
      macAddress: '48:E7:DA:11:8C:A2',
      firmware: 'v2.4.1-sim',
      lastSeen: 'Just now',
    },
    {
      userUid: uid,
      roomId: roomMap.get('Living Room') ?? null,
      roomName: 'Living Room',
      name: 'Climate Master Pro',
      subtitle: 'Dual Inverter Heat Pump',
      category: 'climate',
      deviceType: 'ac',
      icon: 'thermostat',
      isOn: true,
      online: true,
      targetTemp: 24.0,
      currentTemp: 25.1,
      humidity: 48,
      acMode: 'cool',
      fanSpeed: 'med',
      powerWatts: 620,
      weeklyKwh: 11.2,
      protocol: 'Simulated MQTT',
      ipAddress: '192.168.1.142',
      macAddress: '48:E7:DA:11:8C:F2',
      firmware: 'v2.4.1-build88',
      lastSeen: '2 min ago',
    },
    {
      userUid: uid,
      roomId: roomMap.get('Living Room') ?? null,
      roomName: 'Living Room',
      name: 'Living Room Window',
      subtitle: 'Vibration • Secure',
      category: 'security',
      deviceType: 'window_sensor',
      icon: 'window',
      isOn: true,
      online: true,
      sensorStatus: 'Closed',
      battery: 91,
      powerWatts: 1,
      weeklyKwh: 0.2,
      protocol: 'Simulated Zigbee',
      ipAddress: '192.168.1.112',
      macAddress: '48:E7:DA:11:8C:B4',
      firmware: 'v2.1.0-sim',
      lastSeen: 'Just now',
    },
    {
      userUid: uid,
      roomId: roomMap.get('Bedroom') ?? null,
      roomName: 'Bedroom',
      name: 'Bedroom Ambient Strip',
      subtitle: 'Warm Cove • 12W',
      category: 'lighting',
      deviceType: 'light',
      icon: 'lightbulb',
      isOn: true,
      online: true,
      brightness: 55,
      powerWatts: 12,
      weeklyKwh: 0.9,
      protocol: 'Simulated MQTT',
      ipAddress: '192.168.1.118',
      macAddress: '48:E7:DA:11:8C:C1',
      firmware: 'v2.4.1-sim',
      lastSeen: 'Just now',
    },
    {
      userUid: uid,
      roomId: roomMap.get('Bedroom') ?? null,
      roomName: 'Bedroom',
      name: 'Door Sensor',
      subtitle: 'Contact • Batt 94%',
      category: 'security',
      deviceType: 'door_sensor',
      icon: 'sensor_door',
      isOn: true,
      online: true,
      sensorStatus: 'Closed',
      battery: 94,
      powerWatts: 1,
      weeklyKwh: 0.1,
      protocol: 'Simulated Zigbee',
      ipAddress: '192.168.1.120',
      macAddress: '48:E7:DA:11:8C:C2',
      firmware: 'v2.1.0-sim',
      lastSeen: '1 min ago',
    },
    {
      userUid: uid,
      roomId: roomMap.get('Bedroom') ?? null,
      roomName: 'Bedroom',
      name: 'Radar Motion',
      subtitle: 'mmWave Presence • Clear',
      category: 'security',
      deviceType: 'motion_sensor',
      icon: 'sensors',
      isOn: true,
      online: true,
      sensorStatus: 'Clear',
      battery: 88,
      powerWatts: 1,
      weeklyKwh: 0.1,
      protocol: 'Simulated Zigbee',
      ipAddress: '192.168.1.121',
      macAddress: '48:E7:DA:11:8C:C3',
      firmware: 'v2.1.0-sim',
      lastSeen: 'Just now',
    },
    {
      userUid: uid,
      roomId: roomMap.get('Kitchen') ?? null,
      roomName: 'Kitchen',
      name: 'Water Heater Heat Pump',
      subtitle: 'Utility • Solar Boost Ready',
      category: 'appliance',
      deviceType: 'water_heater',
      icon: 'water_heater',
      isOn: true,
      online: true,
      powerWatts: 340,
      weeklyKwh: 4.2,
      protocol: 'Simulated MQTT',
      ipAddress: '192.168.1.130',
      macAddress: '48:E7:DA:11:8C:D1',
      firmware: 'v2.3.4-sim',
      lastSeen: 'Just now',
    },
    {
      userUid: uid,
      roomId: roomMap.get('Kitchen') ?? null,
      roomName: 'Kitchen',
      name: 'Kitchen Counter LED',
      subtitle: 'Task Lighting • 14W',
      category: 'lighting',
      deviceType: 'light',
      icon: 'lightbulb',
      isOn: true,
      online: true,
      brightness: 80,
      powerWatts: 14,
      weeklyKwh: 0.6,
      protocol: 'Simulated MQTT',
      ipAddress: '192.168.1.131',
      macAddress: '48:E7:DA:11:8C:D2',
      firmware: 'v2.4.1-sim',
      lastSeen: 'Just now',
    },
    {
      userUid: uid,
      roomId: roomMap.get('Kitchen') ?? null,
      roomName: 'Kitchen',
      name: 'Kitchen Smart Plug',
      subtitle: 'Counter Outlet • Offline for 2h',
      category: 'appliance',
      deviceType: 'plug',
      icon: 'power',
      isOn: false,
      online: false,
      powerWatts: 0,
      weeklyKwh: 0.3,
      protocol: 'Simulated Wi-Fi',
      ipAddress: '192.168.1.135',
      macAddress: '48:E7:DA:11:8C:D5',
      firmware: 'v1.9.8-sim',
      lastSeen: '2h ago',
    },
    {
      userUid: uid,
      roomId: roomMap.get('Hallway & Entry') ?? null,
      roomName: 'Hallway & Entry',
      name: 'Hallway Smart Lock',
      subtitle: 'Deadbolt • Batt 92%',
      category: 'security',
      deviceType: 'lock',
      icon: 'lock',
      isOn: true,
      online: true,
      isLocked: true,
      sensorStatus: 'Locked',
      battery: 92,
      powerWatts: 2,
      weeklyKwh: 0.8,
      protocol: 'Simulated Thread',
      ipAddress: '192.168.1.140',
      macAddress: '48:E7:DA:11:8C:E1',
      firmware: 'v2.4.0-sim',
      lastSeen: 'Just now',
    },
    {
      userUid: uid,
      roomId: roomMap.get('Hallway & Entry') ?? null,
      roomName: 'Hallway & Entry',
      name: 'Front Door',
      subtitle: 'Contact • Batt 94%',
      category: 'security',
      deviceType: 'door_sensor',
      icon: 'door_front',
      isOn: true,
      online: true,
      sensorStatus: 'Closed',
      battery: 94,
      powerWatts: 1,
      weeklyKwh: 0.2,
      protocol: 'Simulated Zigbee',
      ipAddress: '192.168.1.141',
      macAddress: '48:E7:DA:11:8C:E2',
      firmware: 'v2.1.0-sim',
      lastSeen: 'Just now',
    },
    {
      userUid: uid,
      roomId: roomMap.get('Hallway & Entry') ?? null,
      roomName: 'Hallway & Entry',
      name: 'Hall Motion',
      subtitle: 'PIR • Idle 42m',
      category: 'security',
      deviceType: 'motion_sensor',
      icon: 'motion_sensor_active',
      isOn: true,
      online: true,
      sensorStatus: 'Clear',
      battery: 89,
      powerWatts: 1,
      weeklyKwh: 0.2,
      protocol: 'Simulated Zigbee',
      ipAddress: '192.168.1.143',
      macAddress: '48:E7:DA:11:8C:E3',
      firmware: 'v2.1.0-sim',
      lastSeen: 'Just now',
    },
    {
      userUid: uid,
      roomId: roomMap.get('Hallway & Entry') ?? null,
      roomName: 'Hallway & Entry',
      name: 'Entryway Sconce',
      subtitle: 'Hallway • 9W',
      category: 'lighting',
      deviceType: 'light',
      icon: 'lightbulb',
      isOn: true,
      online: true,
      brightness: 60,
      powerWatts: 9,
      weeklyKwh: 0.5,
      protocol: 'Simulated MQTT',
      ipAddress: '192.168.1.144',
      macAddress: '48:E7:DA:11:8C:E4',
      firmware: 'v2.4.1-sim',
      lastSeen: 'Just now',
    },
  ]);

  await db.insert(automations).values([
    {
      userUid: uid,
      name: 'Lights off when empty',
      description: 'If no motion for 10 min, turn off Living Room lights',
      source: 'manual',
      enabled: true,
      triggerType: 'motion',
      triggerLabel: 'Motion Sensor (No motion 10 min)',
      triggerIcon: 'sensors',
      conditions: [
        {
          id: 'c1',
          label: 'Living Room vacant',
          detail: 'Radar occupancy = 0 for 10m',
          icon: 'sensors',
          metric: 'occupancy',
          operator: '==',
          value: '0',
        },
      ],
      actions: [
        {
          id: 'a1',
          label: 'Turn off lights',
          detail: 'Living Room fixtures off',
          icon: 'light_off',
          endIcon: 'lightbulb',
          actionType: 'lights_off',
          payload: { room: 'Living Room' },
        },
      ],
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      startTime: '06:00',
      endTime: '23:30',
      priority: 'Normal',
      zoneLabel: 'Living Room • Radar Motion',
      lastTriggered: 'Triggered 14m ago',
      savingsText: null,
    },
    {
      userUid: uid,
      name: 'Night cooling',
      description: 'At 11:00 PM, set AC to 26°C',
      source: 'ai',
      enabled: true,
      triggerType: 'schedule',
      triggerLabel: 'Time Schedule (11:00 PM)',
      triggerIcon: 'ac_unit',
      conditions: [
        {
          id: 'c2',
          label: 'Night mode active',
          detail: 'Indoor temp > 24°C',
          icon: 'bedtime',
          metric: 'temp',
          operator: '>',
          value: '24',
        },
      ],
      actions: [
        {
          id: 'a2',
          label: 'Set temperature',
          detail: 'AC to Eco (26°C)',
          icon: 'thermostat',
          endIcon: 'eco',
          actionType: 'set_temp',
          payload: { temp: 26 },
        },
      ],
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      startTime: '23:00',
      endTime: '06:00',
      priority: 'Normal',
      zoneLabel: 'Living Climate Master',
      lastTriggered: 'Yesterday, 11:00 PM',
      savingsText: 'Saved 0.4 kWh',
    },
    {
      userUid: uid,
      name: 'Auto-arm security',
      description: 'When everyone leaves, arm security system to Away',
      source: 'manual',
      enabled: true,
      triggerType: 'presence',
      triggerLabel: 'Presence (When everyone leaves)',
      triggerIcon: 'shield',
      conditions: [
        {
          id: 'c3',
          label: 'Energy price is High',
          detail: 'Peak Tariff > ₹9.00/kWh',
          icon: 'price_change',
          metric: 'tariff',
          operator: '>',
          value: '9.0',
        },
      ],
      actions: [
        {
          id: 'a3',
          label: 'Arm security',
          detail: 'Set mode to Away',
          icon: 'shield',
          endIcon: 'lock',
          actionType: 'arm_security',
          payload: { mode: 'away' },
        },
        {
          id: 'a4',
          label: 'Set temperature',
          detail: 'AC to Eco (27°C)',
          icon: 'thermostat',
          endIcon: 'eco',
          actionType: 'set_temp',
          payload: { temp: 27 },
        },
        {
          id: 'a5',
          label: 'Notify',
          detail: 'Push alert to family members',
          icon: 'notifications_active',
          endIcon: 'devices',
          actionType: 'notify',
          payload: { message: 'Home armed to Away mode' },
        },
      ],
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      startTime: '08:00',
      endTime: '18:00',
      priority: 'High',
      zoneLabel: 'Whole Home Presence',
      lastTriggered: 'Today, 8:45 AM',
      savingsText: null,
    },
    {
      userUid: uid,
      name: 'Solar excess water heater',
      description: 'When solar generation > 3.0 kW, run water heat pump',
      source: 'ai',
      enabled: false,
      triggerType: 'energy',
      triggerLabel: 'Grid Energy Tariff (Solar surplus)',
      triggerIcon: 'electric_bolt',
      conditions: [],
      actions: [
        {
          id: 'a6',
          label: 'Boost Water Heater',
          detail: 'Heat pump solar cycle',
          icon: 'water_heater',
          endIcon: 'bolt',
          actionType: 'notify',
          payload: { message: 'Water heat pump solar boost started' },
        },
      ],
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      startTime: '11:30',
      endTime: '14:30',
      priority: 'Low',
      zoneLabel: 'Suspended during grid maintenance',
      lastTriggered: 'Inactive',
      savingsText: null,
    },
  ]);

  await db.insert(securityEvents).values([
    {
      userUid: uid,
      title: 'System armed to Home mode',
      detail: 'Scheduled routine: Night protection activated',
      severity: 'info',
      zone: 'Perimeter',
      icon: 'verified_user',
      timeLabel: '11:00 PM',
    },
    {
      userUid: uid,
      title: 'Front Door auto-locked',
      detail: 'Locked automatically after 5 minutes closed',
      severity: 'info',
      zone: 'Hallway & Entry',
      icon: 'lock',
      timeLabel: '10:45 PM',
    },
    {
      userUid: uid,
      title: 'Back Patio sensor low battery',
      detail: 'Battery dropped below 15% threshold (CR2032)',
      severity: 'warning',
      zone: 'Patio Zone',
      icon: 'warning',
      timeLabel: '06:12 PM',
    },
    {
      userUid: uid,
      title: 'Tamper detection test completed',
      detail: 'Manual siren & sensor diagnostic passed',
      severity: 'critical',
      zone: 'All Zones',
      icon: 'gpp_maybe',
      timeLabel: 'Yesterday, 04:30 PM',
    },
  ]);

  await db.insert(recommendations).values([
    {
      userUid: uid,
      title: 'Pre-cool living room at 5:30 PM',
      description:
        'Pre-cool prior to evening tariff surge (₹9.80/kWh → ₹4.20/kWh) to avoid expensive compression cycles.',
      savingsLabel: '+0.8 kWh saved (~₹14/day)',
      confidence: 94,
      category: 'energy',
      status: 'active',
      actionPayload: { actionType: 'set_temp', targetTemp: 23.5, scheduleTime: '17:30' },
    },
    {
      userUid: uid,
      title: 'Auto-eco during midday vacancy',
      description: 'Radar sensors detect zero occupancy between 1:00 PM – 4:00 PM on weekdays.',
      savingsLabel: '+1.2 kWh saved (~₹21/day)',
      confidence: 91,
      category: 'energy',
      status: 'active',
      actionPayload: { actionType: 'set_temp', targetTemp: 26.5, scheduleTime: '13:00' },
    },
    {
      userUid: uid,
      title: 'Weekdays 7:00 AM: bedroom lights on, AC off',
      description:
        'Observed consistently over past 14 days with 94% confidence. Estimated morning comfort optimization.',
      savingsLabel: '94% confidence',
      confidence: 94,
      category: 'routine',
      status: 'active',
      actionPayload: { actionType: 'create_routine', startTime: '07:00' },
    },
  ]);

  await db.insert(energyLogs).values([
    // Day (7 blocks)
    { userUid: uid, period: 'day', label: '00:00', actualKwh: 0.28, baselineKwh: 0.35, sortOrder: 1 },
    { userUid: uid, period: 'day', label: '04:00', actualKwh: 0.22, baselineKwh: 0.30, sortOrder: 2 },
    { userUid: uid, period: 'day', label: '08:00', actualKwh: 0.54, baselineKwh: 0.62, sortOrder: 3 },
    { userUid: uid, period: 'day', label: '12:00', actualKwh: 0.48, baselineKwh: 0.56, sortOrder: 4 },
    { userUid: uid, period: 'day', label: '16:00', actualKwh: 0.61, baselineKwh: 0.72, sortOrder: 5 },
    { userUid: uid, period: 'day', label: '20:00', actualKwh: 0.69, baselineKwh: 0.78, sortOrder: 6 },
    { userUid: uid, period: 'day', label: 'Now', actualKwh: 0.38, baselineKwh: 0.45, sortOrder: 7 },
    // Week (Mon - Sun = 21.4 kWh)
    { userUid: uid, period: 'week', label: 'Mon', actualKwh: 3.2, baselineKwh: 3.8, sortOrder: 1 },
    { userUid: uid, period: 'week', label: 'Tue', actualKwh: 2.9, baselineKwh: 3.5, sortOrder: 2 },
    { userUid: uid, period: 'week', label: 'Wed', actualKwh: 3.4, baselineKwh: 3.7, sortOrder: 3 },
    { userUid: uid, period: 'week', label: 'Thu', actualKwh: 2.8, baselineKwh: 3.4, sortOrder: 4 },
    { userUid: uid, period: 'week', label: 'Fri', actualKwh: 3.1, baselineKwh: 3.6, sortOrder: 5 },
    { userUid: uid, period: 'week', label: 'Sat', actualKwh: 3.6, baselineKwh: 4.2, sortOrder: 6 },
    { userUid: uid, period: 'week', label: 'Sun', actualKwh: 2.4, baselineKwh: 3.2, sortOrder: 7 },
    // Month (4 Weeks = 83.9 kWh)
    { userUid: uid, period: 'month', label: 'Wk 1', actualKwh: 22.8, baselineKwh: 26.2, sortOrder: 1 },
    { userUid: uid, period: 'month', label: 'Wk 2', actualKwh: 20.1, baselineKwh: 24.8, sortOrder: 2 },
    { userUid: uid, period: 'month', label: 'Wk 3', actualKwh: 21.4, baselineKwh: 25.4, sortOrder: 3 },
    { userUid: uid, period: 'month', label: 'Wk 4', actualKwh: 19.6, baselineKwh: 23.9, sortOrder: 4 },
  ]);
}

export async function getFullHomeState(uid: string, email: string, displayName?: string) {
  try {
    const profile = await getOrCreateUser(uid, email, displayName);
    const [userRooms, userDevices, userAutomations, userEvents, userRecs, userEnergy] =
      await Promise.all([
        db.select().from(rooms).where(eq(rooms.userUid, uid)).orderBy(asc(rooms.id)),
        db.select().from(devices).where(eq(devices.userUid, uid)).orderBy(asc(devices.id)),
        db
          .select()
          .from(automations)
          .where(eq(automations.userUid, uid))
          .orderBy(desc(automations.id)),
        db
          .select()
          .from(securityEvents)
          .where(eq(securityEvents.userUid, uid))
          .orderBy(desc(securityEvents.id)),
        db
          .select()
          .from(recommendations)
          .where(eq(recommendations.userUid, uid))
          .orderBy(asc(recommendations.id)),
        db
          .select()
          .from(energyLogs)
          .where(eq(energyLogs.userUid, uid))
          .orderBy(asc(energyLogs.sortOrder)),
      ]);

    return {
      profile,
      rooms: userRooms,
      devices: userDevices,
      automations: userAutomations,
      securityEvents: userEvents,
      recommendations: userRecs,
      energyLogs: userEnergy,
    };
  } catch (error) {
    console.error('Database error in getFullHomeState:', error);
    throw new Error('Failed to load smart home state.', { cause: error });
  }
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<{
    displayName: string;
    residenceName: string;
    houseMode: string;
    securityMode: string;
    securityAlertActive: boolean;
    theme: string;
    tempUnit: string;
    tariffBase: number;
    tariffPeak: number;
    notifySecurity: boolean;
    notifyEnergy: boolean;
    notifyOffline: boolean;
    localProcessing: boolean;
  }>
) {
  try {
    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.uid, uid))
      .returning();
    return updated;
  } catch (error) {
    console.error('Database error in updateUserProfile:', error);
    throw new Error('Failed to update settings.', { cause: error });
  }
}

export async function createRoom(uid: string, name: string, icon = 'sensor_door', zone = 'Custom Zone') {
  try {
    const [created] = await db
      .insert(rooms)
      .values({ userUid: uid, name, icon, zone })
      .returning();
    return created;
  } catch (error) {
    console.error('Database error in createRoom:', error);
    throw new Error('Failed to create room.', { cause: error });
  }
}

export async function deleteRoom(uid: string, roomId: number) {
  try {
    await db.delete(rooms).where(and(eq(rooms.id, roomId), eq(rooms.userUid, uid)));
    return { ok: true };
  } catch (error) {
    console.error('Database error in deleteRoom:', error);
    throw new Error('Failed to delete room.', { cause: error });
  }
}

export async function createDevice(
  uid: string,
  payload: {
    name: string;
    subtitle: string;
    roomId: number | null;
    roomName: string;
    category: string;
    deviceType: string;
    icon: string;
    protocol: string;
  }
) {
  try {
    const isLight = payload.deviceType === 'light';
    const isAc = payload.deviceType === 'ac';
    const isLock = payload.deviceType === 'lock';
    const isSensor =
      payload.deviceType === 'door_sensor' ||
      payload.deviceType === 'window_sensor' ||
      payload.deviceType === 'motion_sensor';

    const [created] = await db
      .insert(devices)
      .values({
        userUid: uid,
        roomId: payload.roomId,
        roomName: payload.roomName,
        name: payload.name,
        subtitle: payload.subtitle || `${payload.roomName} • Simulated Node`,
        category: payload.category,
        deviceType: payload.deviceType,
        icon: payload.icon,
        isOn: true,
        online: true,
        brightness: isLight ? 75 : null,
        targetTemp: isAc ? 24.0 : null,
        currentTemp: isAc ? 25.0 : null,
        humidity: isAc ? 50 : null,
        acMode: isAc ? 'cool' : null,
        fanSpeed: isAc ? 'auto' : null,
        isLocked: isLock ? true : null,
        sensorStatus: isLock ? 'Locked' : isSensor ? 'Closed' : null,
        battery: isLock || isSensor ? 100 : null,
        powerWatts: isAc ? 580 : isLight ? 12 : 4,
        weeklyKwh: isAc ? 6.5 : isLight ? 0.8 : 0.2,
        protocol: payload.protocol || 'Simulated MQTT',
        ipAddress: `192.168.1.${Math.floor(150 + Math.random() * 90)}`,
        macAddress: `48:E7:DA:11:9A:${Math.floor(10 + Math.random() * 89)}`,
        firmware: 'v2.4.1-sim',
        lastSeen: 'Just now',
      })
      .returning();
    return created;
  } catch (error) {
    console.error('Database error in createDevice:', error);
    throw new Error('Failed to add device.', { cause: error });
  }
}

export async function updateDevice(
  uid: string,
  deviceId: number,
  updates: Partial<{
    name: string;
    roomName: string;
    isOn: boolean;
    online: boolean;
    brightness: number | null;
    targetTemp: number | null;
    acMode: string | null;
    fanSpeed: string | null;
    isLocked: boolean | null;
    sensorStatus: string | null;
    powerWatts: number;
    lastSeen: string;
  }>
) {
  try {
    const [updated] = await db
      .update(devices)
      .set(updates)
      .where(and(eq(devices.id, deviceId), eq(devices.userUid, uid)))
      .returning();
    return updated;
  } catch (error) {
    console.error('Database error in updateDevice:', error);
    throw new Error('Failed to update device.', { cause: error });
  }
}

export async function deleteDevice(uid: string, deviceId: number) {
  try {
    await db.delete(devices).where(and(eq(devices.id, deviceId), eq(devices.userUid, uid)));
    return { ok: true };
  } catch (error) {
    console.error('Database error in deleteDevice:', error);
    throw new Error('Failed to remove device.', { cause: error });
  }
}

export async function createAutomation(
  uid: string,
  payload: {
    name: string;
    description: string;
    source?: string;
    enabled?: boolean;
    triggerType: string;
    triggerLabel: string;
    triggerIcon: string;
    conditions: RuleCondition[];
    actions: RuleAction[];
    days: string[];
    startTime: string;
    endTime: string;
    priority: string;
    zoneLabel: string;
  }
) {
  try {
    const [created] = await db
      .insert(automations)
      .values({
        userUid: uid,
        name: payload.name,
        description: payload.description,
        source: payload.source ?? 'manual',
        enabled: payload.enabled ?? true,
        triggerType: payload.triggerType,
        triggerLabel: payload.triggerLabel,
        triggerIcon: payload.triggerIcon,
        conditions: payload.conditions,
        actions: payload.actions,
        days: payload.days,
        startTime: payload.startTime,
        endTime: payload.endTime,
        priority: payload.priority,
        zoneLabel: payload.zoneLabel,
        lastTriggered: 'Just created',
      })
      .returning();
    return created;
  } catch (error) {
    console.error('Database error in createAutomation:', error);
    throw new Error('Failed to create automation rule.', { cause: error });
  }
}

export async function updateAutomation(
  uid: string,
  automationId: number,
  updates: Partial<{
    name: string;
    description: string;
    enabled: boolean;
    triggerType: string;
    triggerLabel: string;
    triggerIcon: string;
    conditions: RuleCondition[];
    actions: RuleAction[];
    days: string[];
    startTime: string;
    endTime: string;
    priority: string;
    zoneLabel: string;
    lastTriggered: string;
  }>
) {
  try {
    const [updated] = await db
      .update(automations)
      .set(updates)
      .where(and(eq(automations.id, automationId), eq(automations.userUid, uid)))
      .returning();
    return updated;
  } catch (error) {
    console.error('Database error in updateAutomation:', error);
    throw new Error('Failed to update automation rule.', { cause: error });
  }
}

export async function deleteAutomation(uid: string, automationId: number) {
  try {
    await db
      .delete(automations)
      .where(and(eq(automations.id, automationId), eq(automations.userUid, uid)));
    return { ok: true };
  } catch (error) {
    console.error('Database error in deleteAutomation:', error);
    throw new Error('Failed to delete automation rule.', { cause: error });
  }
}

export async function createSecurityEvent(
  uid: string,
  payload: {
    title: string;
    detail: string;
    severity: 'info' | 'warning' | 'critical';
    zone: string;
    icon: string;
    timeLabel: string;
  }
) {
  try {
    const [created] = await db
      .insert(securityEvents)
      .values({ userUid: uid, ...payload })
      .returning();
    return created;
  } catch (error) {
    console.error('Database error in createSecurityEvent:', error);
    throw new Error('Failed to record security event.', { cause: error });
  }
}

export async function clearSecurityEvents(uid: string) {
  try {
    await db.delete(securityEvents).where(eq(securityEvents.userUid, uid));
    return { ok: true };
  } catch (error) {
    console.error('Database error in clearSecurityEvents:', error);
    throw new Error('Failed to clear security events.', { cause: error });
  }
}

export async function updateRecommendationStatus(
  uid: string,
  recommendationId: number,
  status: 'active' | 'applied' | 'dismissed'
) {
  try {
    const [updated] = await db
      .update(recommendations)
      .set({ status })
      .where(and(eq(recommendations.id, recommendationId), eq(recommendations.userUid, uid)))
      .returning();
    return updated;
  } catch (error) {
    console.error('Database error in updateRecommendationStatus:', error);
    throw new Error('Failed to update recommendation.', { cause: error });
  }
}

export async function insertRecommendation(
  uid: string,
  payload: {
    title: string;
    description: string;
    savingsLabel: string;
    confidence: number;
    category: string;
    actionPayload: Record<string, string | number | boolean>;
  }
) {
  try {
    const [created] = await db
      .insert(recommendations)
      .values({ userUid: uid, ...payload, status: 'active' })
      .returning();
    return created;
  } catch (error) {
    console.error('Database error in insertRecommendation:', error);
    throw new Error('Failed to save recommendation.', { cause: error });
  }
}
