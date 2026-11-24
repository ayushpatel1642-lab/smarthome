import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { homeApi } from '../services/api/homeApi';
import { activeDeviceAdapter } from '../services/iot/deviceAdapter';
import { createDefaultHomeState } from '../utils/defaultHomeState';
import { formatTimeNow } from '../utils/format';
import type {
  AcMode,
  AiRecommendation,
  AutomationRule,
  EnergyPoint,
  FanSpeed,
  HomeStatePayload,
  HouseMode,
  Room,
  SecurityEvent,
  SecurityMode,
  SmartDevice,
  UserProfile,
} from '../types/home';

export interface ToastMessage {
  id: number;
  text: string;
  tone: 'success' | 'info' | 'warning' | 'error';
}

interface HomeContextValue {
  state: HomeStatePayload;
  loading: boolean;
  syncError: string | null;
  toast: ToastMessage | null;
  dismissToast: () => void;
  showToast: (text: string, tone?: ToastMessage['tone']) => void;
  // Derived live metrics
  activeLightsCount: number;
  totalLightsCount: number;
  onlineDevicesCount: number;
  offlineDevicesCount: number;
  totalInstantWatts: number;
  todayKwh: number;
  primaryAc: SmartDevice | undefined;
  indoorTemp: number;
  indoorHumidity: number;
  // Actions
  setHouseMode: (mode: HouseMode) => Promise<void>;
  setSecurityMode: (mode: SecurityMode) => Promise<void>;
  triggerSecurityAlert: () => Promise<void>;
  dismissSecurityAlert: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  toggleDevicePower: (deviceId: number) => Promise<void>;
  setDeviceBrightness: (deviceId: number, brightness: number) => Promise<void>;
  setAcTemperature: (deviceId: number, targetTemp: number) => Promise<void>;
  setAcMode: (deviceId: number, acMode: AcMode) => Promise<void>;
  setAcFanSpeed: (deviceId: number, fanSpeed: FanSpeed) => Promise<void>;
  toggleLock: (deviceId: number) => Promise<void>;
  toggleSensorState: (deviceId: number) => Promise<void>;
  reconnectDevice: (deviceId: number) => Promise<void>;
  renameDevice: (deviceId: number, newName: string) => Promise<void>;
  removeDevice: (deviceId: number) => Promise<void>;
  addDevice: (payload: {
    name: string;
    subtitle?: string;
    roomId: number | null;
    roomName: string;
    category: string;
    deviceType: string;
    icon: string;
    protocol?: string;
  }) => Promise<SmartDevice | null>;
  turnOffRoomLights: (roomName: string) => Promise<void>;
  turnOffAllLights: () => Promise<void>;
  lockAllDoors: () => Promise<void>;
  addRoom: (name: string, icon?: string) => Promise<Room | null>;
  removeRoom: (roomId: number) => Promise<void>;
  toggleAutomation: (id: number) => Promise<void>;
  saveAutomation: (
    rule: Omit<AutomationRule, 'id' | 'lastTriggered' | 'savingsText'>,
    editingId?: number
  ) => Promise<AutomationRule | null>;
  deleteAutomation: (id: number) => Promise<void>;
  testAutomationRule: (rule: Pick<AutomationRule, 'name' | 'actions'> & { id?: number }) => Promise<void>;
  applyRecommendation: (rec: AiRecommendation) => Promise<void>;
  dismissRecommendation: (recId: number) => Promise<void>;
  requestGeminiRecommendation: () => Promise<void>;
  generatingAi: boolean;
  clearSecurityLog: () => Promise<void>;
  exportTelemetryJson: () => void;
  resetResidenceData: () => Promise<void>;
}

const LOCAL_STATE_PREFIX = 'aware_home_state_v1_';

const HomeContext = createContext<HomeContextValue | null>(null);

export const HomeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, idToken, authMode } = useAuth();
  const [state, setState] = useState<HomeStatePayload>(() => createDefaultHomeState());
  const [loading, setLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [generatingAi, setGeneratingAi] = useState(false);

  const showToast = useCallback((text: string, tone: ToastMessage['tone'] = 'info') => {
    setToast({ id: Date.now(), text, tone });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Load state when user authenticates (Cloud SQL for Firebase Auth, localStorage for local session)
  useEffect(() => {
    let active = true;
    if (!user) {
      setState(createDefaultHomeState());
      setSyncError(null);
      return;
    }

    if (authMode === 'firebase' && idToken) {
      setLoading(true);
      setSyncError(null);
      homeApi
        .fetchState(idToken)
        .then((data) => {
          if (active) setState(data);
        })
        .catch((err: unknown) => {
          console.error('Failed to load Cloud SQL home state:', err);
          if (active) {
            setSyncError('Unable to reach database. Displaying local fallback state.');
            setState(createDefaultHomeState(user.uid, user.email, user.displayName));
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    } else if (authMode === 'local') {
      const storageKey = `${LOCAL_STATE_PREFIX}${user.uid}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          setState(JSON.parse(saved) as HomeStatePayload);
        } catch {
          setState(createDefaultHomeState(user.uid, user.email, user.displayName));
        }
      } else {
        const fresh = createDefaultHomeState(user.uid, user.email, user.displayName);
        setState(fresh);
        localStorage.setItem(storageKey, JSON.stringify(fresh));
      }
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [user, idToken, authMode]);

  // Persist local session state whenever it updates
  useEffect(() => {
    if (authMode === 'local' && user) {
      try {
        localStorage.setItem(`${LOCAL_STATE_PREFIX}${user.uid}`, JSON.stringify(state));
      } catch {
        // Ignore storage quota issues
      }
    }
  }, [state, authMode, user]);

  // Apply Dark / Light / Auto theme class to <html>
  useEffect(() => {
    const root = document.documentElement;
    const theme = state.profile.theme;
    const apply = () => {
      if (theme === 'dark') {
        root.classList.add('dark');
      } else if (theme === 'light') {
        root.classList.remove('dark');
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', prefersDark);
      }
    };
    apply();
    if (theme === 'auto') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
  }, [state.profile.theme]);

  // Live thermal convergence loop: gently drifts room currentTemp toward AC targetTemp when AC is running
  useEffect(() => {
    if (!user) return;
    const timer = setInterval(() => {
      setState((prev) => {
        let changed = false;
        const nextDevices = prev.devices.map((d) => {
          if (d.deviceType !== 'ac' || !d.online || !d.isOn) return d;
          const target = d.targetTemp ?? 24;
          const curr = d.currentTemp ?? 24.5;
          const diff = target - curr;
          if (Math.abs(diff) < 0.08) return d;
          changed = true;
          const step = diff > 0 ? 0.1 : -0.1;
          const nextTemp = Math.round((curr + step) * 10) / 10;
          return { ...d, currentTemp: nextTemp };
        });
        return changed ? { ...prev, devices: nextDevices } : prev;
      });
    }, 6000);
    return () => clearInterval(timer);
  }, [user]);

  const recordEvent = useCallback(
    async (event: Omit<SecurityEvent, 'id'>) => {
      const tempId = Date.now() + Math.floor(Math.random() * 1000);
      setState((prev) => ({
        ...prev,
        securityEvents: [{ id: tempId, ...event }, ...prev.securityEvents],
      }));
      if (authMode === 'firebase' && idToken) {
        try {
          const saved = await homeApi.createSecurityEvent(idToken, event);
          setState((prev) => ({
            ...prev,
            securityEvents: prev.securityEvents.map((e) => (e.id === tempId ? saved : e)),
          }));
        } catch (err) {
          console.error('Failed to persist security event:', err);
        }
      }
    },
    [authMode, idToken]
  );

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      setState((prev) => ({
        ...prev,
        profile: { ...prev.profile, ...updates },
      }));
      if (authMode === 'firebase' && idToken) {
        try {
          await homeApi.updateProfile(idToken, updates);
        } catch (err) {
          console.error('Failed to persist profile update:', err);
          showToast('Saved locally; cloud sync temporarily unavailable.', 'warning');
        }
      }
    },
    [authMode, idToken, showToast]
  );

  const patchDeviceState = useCallback(
    async (deviceId: number, updates: Partial<SmartDevice>) => {
      setState((prev) => ({
        ...prev,
        devices: prev.devices.map((d) => (d.id === deviceId ? { ...d, ...updates } : d)),
      }));
      if (authMode === 'firebase' && idToken) {
        try {
          await homeApi.updateDevice(idToken, deviceId, updates);
        } catch (err) {
          console.error('Failed to persist device update:', err);
        }
      }
    },
    [authMode, idToken]
  );

  const toggleDevicePower = useCallback(
    async (deviceId: number) => {
      const target = state.devices.find((d) => d.id === deviceId);
      if (!target || !target.online) return;
      const nextOn = !target.isOn;
      await activeDeviceAdapter.sendCommand(target, {
        deviceId,
        command: 'toggle_power',
        value: nextOn,
      });
      const baseWatts =
        target.deviceType === 'ac'
          ? 620
          : target.deviceType === 'water_heater'
            ? 340
            : target.deviceType === 'light'
              ? Math.max(4, Math.round(((target.brightness ?? 70) / 100) * 18))
              : 10;
      await patchDeviceState(deviceId, {
        isOn: nextOn,
        powerWatts: nextOn ? baseWatts : 0,
        lastSeen: 'Just now',
      });
      showToast(`${target.name} turned ${nextOn ? 'on' : 'off'}`, 'info');
    },
    [state.devices, patchDeviceState, showToast]
  );

  const setDeviceBrightness = useCallback(
    async (deviceId: number, brightness: number) => {
      const clamped = Math.max(0, Math.min(100, Math.round(brightness)));
      const target = state.devices.find((d) => d.id === deviceId);
      if (!target) return;
      await activeDeviceAdapter.sendCommand(target, {
        deviceId,
        command: 'set_brightness',
        value: clamped,
      });
      await patchDeviceState(deviceId, {
        brightness: clamped,
        isOn: clamped > 0,
        powerWatts: clamped > 0 ? Math.max(3, Math.round((clamped / 100) * 18)) : 0,
        lastSeen: 'Just now',
      });
    },
    [state.devices, patchDeviceState]
  );

  const setAcTemperature = useCallback(
    async (deviceId: number, targetTemp: number) => {
      const clamped = Math.max(16, Math.min(30, Math.round(targetTemp * 2) / 2));
      const target = state.devices.find((d) => d.id === deviceId);
      if (!target) return;
      await activeDeviceAdapter.sendCommand(target, {
        deviceId,
        command: 'set_temperature',
        value: clamped,
      });
      const watts = target.isOn ? Math.max(280, Math.round(620 + (24 - clamped) * 45)) : 0;
      await patchDeviceState(deviceId, {
        targetTemp: clamped,
        powerWatts: watts,
        lastSeen: 'Just now',
      });
    },
    [state.devices, patchDeviceState]
  );

  const setAcMode = useCallback(
    async (deviceId: number, acMode: AcMode) => {
      const target = state.devices.find((d) => d.id === deviceId);
      if (!target) return;
      await activeDeviceAdapter.sendCommand(target, {
        deviceId,
        command: 'set_ac_mode',
        value: acMode,
      });
      await patchDeviceState(deviceId, { acMode, isOn: true, lastSeen: 'Just now' });
      showToast(`${target.name} set to ${acMode.toUpperCase()} mode`, 'info');
    },
    [state.devices, patchDeviceState, showToast]
  );

  const setAcFanSpeed = useCallback(
    async (deviceId: number, fanSpeed: FanSpeed) => {
      const target = state.devices.find((d) => d.id === deviceId);
      if (!target) return;
      await activeDeviceAdapter.sendCommand(target, {
        deviceId,
        command: 'set_fan_speed',
        value: fanSpeed,
      });
      await patchDeviceState(deviceId, { fanSpeed, lastSeen: 'Just now' });
    },
    [state.devices, patchDeviceState]
  );

  const toggleLock = useCallback(
    async (deviceId: number) => {
      const target = state.devices.find((d) => d.id === deviceId);
      if (!target) return;
      const nextLocked = !(target.isLocked ?? true);
      await activeDeviceAdapter.sendCommand(target, {
        deviceId,
        command: 'toggle_lock',
        value: nextLocked,
      });
      await patchDeviceState(deviceId, {
        isLocked: nextLocked,
        sensorStatus: nextLocked ? 'Locked' : 'Unlocked',
        lastSeen: 'Just now',
      });
      await recordEvent({
        title: `${target.name} ${nextLocked ? 'locked' : 'unlocked'}`,
        detail: nextLocked ? 'Deadbolt engaged manually' : 'Manual unlock triggered from console',
        severity: nextLocked ? 'info' : 'warning',
        zone: target.roomName,
        icon: nextLocked ? 'lock' : 'lock_open',
        timeLabel: formatTimeNow(),
      });
      showToast(`${target.name} ${nextLocked ? 'locked' : 'unlocked'}`, nextLocked ? 'success' : 'warning');
    },
    [state.devices, patchDeviceState, recordEvent, showToast]
  );

  const toggleSensorState = useCallback(
    async (deviceId: number) => {
      const target = state.devices.find((d) => d.id === deviceId);
      if (!target) return;
      const isMotion = target.deviceType === 'motion_sensor';
      const currentlyTriggered =
        target.sensorStatus === 'Motion' || target.sensorStatus === 'Open';
      const nextStatus = isMotion
        ? currentlyTriggered
          ? 'Clear'
          : 'Motion'
        : currentlyTriggered
          ? 'Closed'
          : 'Open';

      await patchDeviceState(deviceId, { sensorStatus: nextStatus, lastSeen: 'Just now' });
      const armed = state.profile.securityMode !== 'disarmed';
      const isAlertTrigger = !currentlyTriggered && armed;

      if (isAlertTrigger) {
        await updateProfile({ securityAlertActive: true });
      }
      await recordEvent({
        title: `${target.name}: ${nextStatus}`,
        detail: isAlertTrigger
          ? `Triggered while perimeter armed (${state.profile.securityMode} mode)`
          : `Simulated sensor state changed to ${nextStatus}`,
        severity: isAlertTrigger ? 'critical' : currentlyTriggered ? 'info' : 'warning',
        zone: target.roomName,
        icon: isAlertTrigger ? 'warning' : target.icon,
        timeLabel: formatTimeNow(),
      });
      showToast(
        `${target.name} state set to ${nextStatus}`,
        isAlertTrigger ? 'error' : 'info'
      );
    },
    [state.devices, state.profile.securityMode, patchDeviceState, updateProfile, recordEvent, showToast]
  );

  const reconnectDevice = useCallback(
    async (deviceId: number) => {
      const target = state.devices.find((d) => d.id === deviceId);
      if (!target) return;
      const res = await activeDeviceAdapter.ping(target);
      await patchDeviceState(deviceId, {
        online: res.online,
        isOn: true,
        powerWatts: 10,
        lastSeen: `Reconnected (${res.latencyMs}ms sim)`,
      });
      showToast(`${target.name} reconnected via simulated bridge`, 'success');
    },
    [state.devices, patchDeviceState, showToast]
  );

  const renameDevice = useCallback(
    async (deviceId: number, newName: string) => {
      const clean = newName.trim();
      if (!clean) return;
      await patchDeviceState(deviceId, { name: clean });
      showToast(`Device renamed to "${clean}"`, 'success');
    },
    [patchDeviceState, showToast]
  );

  const removeDevice = useCallback(
    async (deviceId: number) => {
      const target = state.devices.find((d) => d.id === deviceId);
      setState((prev) => ({
        ...prev,
        devices: prev.devices.filter((d) => d.id !== deviceId),
      }));
      if (authMode === 'firebase' && idToken) {
        try {
          await homeApi.deleteDevice(idToken, deviceId);
        } catch (err) {
          console.error('Failed to delete device:', err);
        }
      }
      if (target) showToast(`${target.name} removed`, 'info');
    },
    [state.devices, authMode, idToken, showToast]
  );

  const addDevice = useCallback(
    async (payload: {
      name: string;
      subtitle?: string;
      roomId: number | null;
      roomName: string;
      category: string;
      deviceType: string;
      icon: string;
      protocol?: string;
    }) => {
      if (authMode === 'firebase' && idToken) {
        try {
          const created = await homeApi.createDevice(idToken, payload);
          setState((prev) => ({ ...prev, devices: [...prev.devices, created] }));
          showToast(`${created.name} added to ${created.roomName}`, 'success');
          return created;
        } catch (err) {
          console.error('Failed to add device to Cloud SQL:', err);
          showToast('Could not save device to server.', 'error');
          return null;
        }
      }
      const isLight = payload.deviceType === 'light';
      const isAc = payload.deviceType === 'ac';
      const isLock = payload.deviceType === 'lock';
      const isSensor =
        payload.deviceType === 'door_sensor' ||
        payload.deviceType === 'window_sensor' ||
        payload.deviceType === 'motion_sensor';
      const localDevice: SmartDevice = {
        id: Date.now(),
        roomId: payload.roomId,
        roomName: payload.roomName,
        name: payload.name,
        subtitle: payload.subtitle || `${payload.roomName} • Simulated Node`,
        category: payload.category as SmartDevice['category'],
        deviceType: payload.deviceType as SmartDevice['deviceType'],
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
        ipAddress: `192.168.1.${Math.floor(150 + Math.random() * 80)}`,
        macAddress: `48:E7:DA:11:9A:${Math.floor(10 + Math.random() * 89)}`,
        firmware: 'v2.4.1-sim',
        lastSeen: 'Just now',
      };
      setState((prev) => ({ ...prev, devices: [...prev.devices, localDevice] }));
      showToast(`${localDevice.name} added to ${localDevice.roomName}`, 'success');
      return localDevice;
    },
    [authMode, idToken, showToast]
  );

  const turnOffRoomLights = useCallback(
    async (roomName: string) => {
      const lights = state.devices.filter(
        (d) => d.category === 'lighting' && d.roomName === roomName && d.isOn
      );
      await Promise.all(lights.map((d) => patchDeviceState(d.id, { isOn: false, powerWatts: 0 })));
      showToast(`All lights turned off in ${roomName}`, 'info');
    },
    [state.devices, patchDeviceState, showToast]
  );

  const turnOffAllLights = useCallback(async () => {
    const lights = state.devices.filter((d) => d.category === 'lighting' && d.isOn);
    await Promise.all(lights.map((d) => patchDeviceState(d.id, { isOn: false, powerWatts: 0 })));
    await recordEvent({
      title: 'All household lights switched off',
      detail: `${lights.length} active fixtures powered down via Quick Control`,
      severity: 'info',
      zone: 'All Rooms',
      icon: 'light_off',
      timeLabel: formatTimeNow(),
    });
    showToast(`Switched off ${lights.length} active light${lights.length === 1 ? '' : 's'}`, 'success');
  }, [state.devices, patchDeviceState, recordEvent, showToast]);

  const lockAllDoors = useCallback(async () => {
    const locks = state.devices.filter((d) => d.deviceType === 'lock');
    await Promise.all(
      locks.map((d) => patchDeviceState(d.id, { isLocked: true, sensorStatus: 'Locked' }))
    );
    await recordEvent({
      title: 'All electronic locks engaged',
      detail: 'Perimeter deadbolts secured via console',
      severity: 'info',
      zone: 'Perimeter',
      icon: 'lock',
      timeLabel: formatTimeNow(),
    });
    showToast('All smart locks secured', 'success');
  }, [state.devices, patchDeviceState, recordEvent, showToast]);

  const setSecurityMode = useCallback(
    async (mode: SecurityMode) => {
      await updateProfile({ securityMode: mode, securityAlertActive: false });
      if (mode === 'away' || mode === 'home') {
        const locks = state.devices.filter((d) => d.deviceType === 'lock' && !d.isLocked);
        await Promise.all(
          locks.map((d) => patchDeviceState(d.id, { isLocked: true, sensorStatus: 'Locked' }))
        );
      }
      await recordEvent({
        title:
          mode === 'disarmed'
            ? 'Security system disarmed'
            : `System armed to ${mode === 'away' ? 'Away' : 'Home'} mode`,
        detail:
          mode === 'disarmed'
            ? 'Perimeter sensors set to passive monitoring'
            : `Perimeter & entry zones active (${mode} profile)`,
        severity: mode === 'disarmed' ? 'warning' : 'info',
        zone: 'Perimeter',
        icon: mode === 'disarmed' ? 'lock_open' : 'verified_user',
        timeLabel: formatTimeNow(),
      });
      showToast(
        mode === 'disarmed' ? 'Security disarmed' : `Security armed: ${mode.toUpperCase()}`,
        mode === 'disarmed' ? 'warning' : 'success'
      );
    },
    [updateProfile, state.devices, patchDeviceState, recordEvent, showToast]
  );

  const triggerSecurityAlert = useCallback(async () => {
    await updateProfile({ securityAlertActive: true });
    const hallMotion = state.devices.find((d) => d.name.toLowerCase().includes('hall motion'));
    if (hallMotion) {
      await patchDeviceState(hallMotion.id, { sensorStatus: 'Motion' });
    }
    await recordEvent({
      title: 'Motion detected in Hall',
      detail: 'Simulated radar motion threshold exceeded in hallway zone while Armed.',
      severity: 'critical',
      zone: 'Zone 02',
      icon: 'warning',
      timeLabel: `${formatTimeNow()} (Simulated)`,
    });
  }, [updateProfile, state.devices, patchDeviceState, recordEvent]);

  const dismissSecurityAlert = useCallback(async () => {
    await updateProfile({ securityAlertActive: false });
    const hallMotion = state.devices.find((d) => d.name.toLowerCase().includes('hall motion'));
    if (hallMotion) {
      await patchDeviceState(hallMotion.id, { sensorStatus: 'Clear' });
    }
    await recordEvent({
      title: 'Hallway alert acknowledged & cleared',
      detail: 'Zone 02 returned to nominal perimeter status',
      severity: 'info',
      zone: 'Zone 02',
      icon: 'verified_user',
      timeLabel: formatTimeNow(),
    });
    showToast('Security alert dismissed', 'success');
  }, [updateProfile, state.devices, patchDeviceState, recordEvent, showToast]);

  // House mode also evaluates linked automation rules (Away -> arm & eco AC, Night -> 26°C & dim lights)
  const setHouseMode = useCallback(
    async (mode: HouseMode) => {
      await updateProfile({ houseMode: mode });
      const ac = state.devices.find((d) => d.deviceType === 'ac');

      if (mode === 'away') {
        const autoArmRule = state.automations.find(
          (a) => a.enabled && a.triggerType === 'presence'
        );
        if (autoArmRule) {
          await setSecurityMode('away');
          if (ac) await setAcTemperature(ac.id, 27.0);
          await turnOffAllLights();
          showToast('Away mode active: automation armed security & set AC to Eco 27°C', 'success');
          return;
        }
      } else if (mode === 'night') {
        const nightRule = state.automations.find(
          (a) => a.enabled && a.name.toLowerCase().includes('night')
        );
        if (ac && nightRule) {
          await setAcTemperature(ac.id, 26.0);
        }
        await setSecurityMode('home');
        const lights = state.devices.filter((d) => d.category === 'lighting' && d.isOn);
        await Promise.all(
          lights.map((l) => patchDeviceState(l.id, { brightness: 20, powerWatts: 5 }))
        );
        showToast('Night mode active: lights dimmed to 20%, perimeter armed', 'info');
        return;
      } else if (mode === 'home') {
        if (ac) await setAcTemperature(ac.id, 24.0);
      }
      showToast(`House mode switched to ${mode.toUpperCase()}`, 'info');
    },
    [
      updateProfile,
      state.devices,
      state.automations,
      setSecurityMode,
      setAcTemperature,
      turnOffAllLights,
      patchDeviceState,
      showToast,
    ]
  );

  const addRoom = useCallback(
    async (name: string, icon = 'sensor_door') => {
      const clean = name.trim();
      if (!clean) return null;
      if (authMode === 'firebase' && idToken) {
        try {
          const created = await homeApi.createRoom(idToken, { name: clean, icon });
          setState((prev) => ({ ...prev, rooms: [...prev.rooms, created] }));
          showToast(`Room "${clean}" created`, 'success');
          return created;
        } catch (err) {
          console.error('Failed to add room:', err);
          return null;
        }
      }
      const localRoom: Room = {
        id: Date.now(),
        name: clean,
        icon,
        zone: `Zone ${state.rooms.length + 1}`,
      };
      setState((prev) => ({ ...prev, rooms: [...prev.rooms, localRoom] }));
      showToast(`Room "${clean}" created`, 'success');
      return localRoom;
    },
    [authMode, idToken, state.rooms.length, showToast]
  );

  const removeRoom = useCallback(
    async (roomId: number) => {
      setState((prev) => ({
        ...prev,
        rooms: prev.rooms.filter((r) => r.id !== roomId),
      }));
      if (authMode === 'firebase' && idToken) {
        try {
          await homeApi.deleteRoom(idToken, roomId);
        } catch (err) {
          console.error('Failed to delete room:', err);
        }
      }
      showToast('Room removed', 'info');
    },
    [authMode, idToken, showToast]
  );

  const toggleAutomation = useCallback(
    async (id: number) => {
      const target = state.automations.find((a) => a.id === id);
      if (!target) return;
      const nextEnabled = !target.enabled;
      setState((prev) => ({
        ...prev,
        automations: prev.automations.map((a) =>
          a.id === id ? { ...a, enabled: nextEnabled } : a
        ),
      }));
      if (authMode === 'firebase' && idToken) {
        try {
          await homeApi.updateAutomation(idToken, id, { enabled: nextEnabled });
        } catch (err) {
          console.error('Failed to toggle automation:', err);
        }
      }
      showToast(`"${target.name}" ${nextEnabled ? 'enabled' : 'paused'}`, 'info');
    },
    [state.automations, authMode, idToken, showToast]
  );

  const saveAutomation = useCallback(
    async (
      rule: Omit<AutomationRule, 'id' | 'lastTriggered' | 'savingsText'>,
      editingId?: number
    ) => {
      if (editingId) {
        setState((prev) => ({
          ...prev,
          automations: prev.automations.map((a) =>
            a.id === editingId ? { ...a, ...rule } : a
          ),
        }));
        if (authMode === 'firebase' && idToken) {
          try {
            const updated = await homeApi.updateAutomation(idToken, editingId, rule);
            showToast(`Rule "${updated.name}" updated`, 'success');
            return updated;
          } catch (err) {
            console.error('Failed to update automation:', err);
          }
        }
        showToast(`Rule "${rule.name}" updated`, 'success');
        return state.automations.find((a) => a.id === editingId) ?? null;
      }

      if (authMode === 'firebase' && idToken) {
        try {
          const created = await homeApi.createAutomation(idToken, rule);
          setState((prev) => ({ ...prev, automations: [created, ...prev.automations] }));
          showToast(`Rule "${created.name}" saved`, 'success');
          return created;
        } catch (err) {
          console.error('Failed to create automation:', err);
          showToast('Could not save rule to server.', 'error');
          return null;
        }
      }

      const localRule: AutomationRule = {
        id: Date.now(),
        ...rule,
        lastTriggered: 'Just created',
        savingsText: null,
      };
      setState((prev) => ({ ...prev, automations: [localRule, ...prev.automations] }));
      showToast(`Rule "${localRule.name}" saved`, 'success');
      return localRule;
    },
    [authMode, idToken, state.automations, showToast]
  );

  const deleteAutomation = useCallback(
    async (id: number) => {
      setState((prev) => ({
        ...prev,
        automations: prev.automations.filter((a) => a.id !== id),
      }));
      if (authMode === 'firebase' && idToken) {
        try {
          await homeApi.deleteAutomation(idToken, id);
        } catch (err) {
          console.error('Failed to delete automation:', err);
        }
      }
      showToast('Automation rule deleted', 'info');
    },
    [authMode, idToken, showToast]
  );

  const testAutomationRule = useCallback(
    async (rule: Pick<AutomationRule, 'name' | 'actions'> & { id?: number }) => {
      const ac = state.devices.find((d) => d.deviceType === 'ac');
      for (const act of rule.actions) {
        if (act.actionType === 'arm_security') {
          const mode = act.payload.mode === 'away' ? 'away' : 'home';
          await updateProfile({ securityMode: mode });
        } else if (act.actionType === 'set_temp' && ac) {
          const temp = Number(act.payload.temp) || 26;
          await setAcTemperature(ac.id, temp);
        } else if (act.actionType === 'lights_off') {
          await turnOffAllLights();
        } else if (act.actionType === 'lock_doors') {
          await lockAllDoors();
        }
      }
      if (rule.id) {
        const triggeredLabel = `Tested ${formatTimeNow()}`;
        setState((prev) => ({
          ...prev,
          automations: prev.automations.map((a) =>
            a.id === rule.id ? { ...a, lastTriggered: triggeredLabel } : a
          ),
        }));
        if (authMode === 'firebase' && idToken) {
          homeApi
            .updateAutomation(idToken, rule.id, { lastTriggered: triggeredLabel })
            .catch(console.error);
        }
      }
      await recordEvent({
        title: `Rule executed: ${rule.name}`,
        detail: `${rule.actions.length} simulated action(s) applied cleanly`,
        severity: 'info',
        zone: 'Automation Engine',
        icon: 'auto_mode',
        timeLabel: formatTimeNow(),
      });
      showToast(`Test passed: "${rule.name}" executed ${rule.actions.length} action(s)`, 'success');
    },
    [
      state.devices,
      authMode,
      idToken,
      updateProfile,
      setAcTemperature,
      turnOffAllLights,
      lockAllDoors,
      recordEvent,
      showToast,
    ]
  );

  const applyRecommendation = useCallback(
    async (rec: AiRecommendation) => {
      setState((prev) => ({
        ...prev,
        recommendations: prev.recommendations.map((r) =>
          r.id === rec.id ? { ...r, status: 'applied' } : r
        ),
      }));
      if (authMode === 'firebase' && idToken) {
        homeApi.updateRecommendation(idToken, rec.id, 'applied').catch(console.error);
      }

      const ac = state.devices.find((d) => d.deviceType === 'ac');
      if (rec.actionPayload?.actionType === 'set_temp' && ac) {
        const nextTemp = Number(rec.actionPayload.targetTemp) || 24.5;
        await setAcTemperature(ac.id, nextTemp);
      }

      await saveAutomation({
        name: rec.title,
        description: rec.description,
        source: 'ai',
        enabled: true,
        triggerType: 'schedule',
        triggerLabel: 'Aware Assist Schedule',
        triggerIcon: 'auto_awesome',
        conditions: [],
        actions: [
          {
            id: `ai-${Date.now()}`,
            label: rec.title,
            detail: rec.savingsLabel,
            icon: 'auto_awesome',
            endIcon: 'check',
            actionType: 'set_temp',
            payload: { temp: Number(rec.actionPayload?.targetTemp) || 24.5 },
          },
        ],
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        startTime: String(rec.actionPayload?.scheduleTime || '17:30'),
        endTime: '20:30',
        priority: 'Normal',
        zoneLabel: 'Aware Assist Optimization',
      });
    },
    [authMode, idToken, state.devices, setAcTemperature, saveAutomation]
  );

  const dismissRecommendation = useCallback(
    async (recId: number) => {
      setState((prev) => ({
        ...prev,
        recommendations: prev.recommendations.map((r) =>
          r.id === recId ? { ...r, status: 'dismissed' } : r
        ),
      }));
      if (authMode === 'firebase' && idToken) {
        homeApi.updateRecommendation(idToken, recId, 'dismissed').catch(console.error);
      }
      showToast('Recommendation dismissed', 'info');
    },
    [authMode, idToken, showToast]
  );

  const clearSecurityLog = useCallback(async () => {
    setState((prev) => ({ ...prev, securityEvents: [] }));
    if (authMode === 'firebase' && idToken) {
      try {
        await homeApi.clearSecurityEvents(idToken);
      } catch (err) {
        console.error('Failed to clear security events:', err);
      }
    }
    showToast('Security event log cleared', 'info');
  }, [authMode, idToken, showToast]);

  const exportTelemetryJson = useCallback(() => {
    const bundle = {
      exportedAt: new Date().toISOString(),
      adapter: activeDeviceAdapter.label,
      simulated: activeDeviceAdapter.isSimulated,
      residence: state.profile.residenceName,
      rooms: state.rooms,
      devices: state.devices,
      automations: state.automations,
      securityEvents: state.securityEvents,
      energyLogs: state.energyLogs,
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aware-home-telemetry-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Telemetry archive exported as JSON', 'success');
  }, [state, showToast]);

  // Derived real-time values from shared state
  const derived = useMemo(() => {
    const lights = state.devices.filter((d) => d.category === 'lighting');
    const activeLightsCount = lights.filter((d) => d.isOn && d.online).length;
    const totalLightsCount = lights.length;
    const onlineDevicesCount = state.devices.filter((d) => d.online).length;
    const offlineDevicesCount = state.devices.filter((d) => !d.online).length;
    const totalInstantWatts = state.devices.reduce(
      (sum, d) => sum + (d.online && d.isOn ? d.powerWatts : 0),
      0
    );
    const primaryAc = state.devices.find((d) => d.deviceType === 'ac');
    const indoorTemp = primaryAc?.currentTemp ?? 24.5;
    const indoorHumidity = primaryAc?.humidity ?? 58;
    const dayPoints = state.energyLogs.filter((e: EnergyPoint) => e.period === 'day');
    const baseDaySum = dayPoints.reduce((s, p) => s + p.actualKwh, 0) || 3.2;
    // Reflect live instantaneous load deltas in today's simulated energy reading
    const loadDeltaKwh = ((totalInstantWatts - 1018) / 1000) * 0.4;
    const todayKwh = Math.max(0.4, Math.round((baseDaySum + loadDeltaKwh) * 10) / 10);

    return {
      activeLightsCount,
      totalLightsCount,
      onlineDevicesCount,
      offlineDevicesCount,
      totalInstantWatts,
      todayKwh,
      primaryAc,
      indoorTemp,
      indoorHumidity,
    };
  }, [state.devices, state.energyLogs]);

  const requestGeminiRecommendation = useCallback(async () => {
    setGeneratingAi(true);
    try {
      const generated = await homeApi.generateAiRecommendation(idToken, {
        houseMode: state.profile.houseMode,
        securityMode: state.profile.securityMode,
        activeLights: derived.activeLightsCount,
        totalLights: derived.totalLightsCount,
        acTargetTemp: derived.primaryAc?.targetTemp ?? 24,
        acCurrentTemp: derived.indoorTemp,
        acIsOn: derived.primaryAc?.isOn ?? false,
        totalWatts: derived.totalInstantWatts,
        tariffBase: state.profile.tariffBase,
        tariffPeak: state.profile.tariffPeak,
      });
      setState((prev) => ({
        ...prev,
        recommendations: [generated, ...prev.recommendations.filter((r) => r.id !== generated.id)],
      }));
      showToast('Aware Assist generated a new optimization', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Aware Assist request failed';
      showToast(msg, 'error');
    } finally {
      setGeneratingAi(false);
    }
  }, [idToken, state.profile, derived, showToast]);

  const resetResidenceData = useCallback(async () => {
    if (!user) return;
    if (authMode === 'firebase' && idToken) {
      try {
        const fresh = await homeApi.resetResidence(idToken);
        setState(fresh);
        showToast('Residence restored to factory defaults', 'success');
        return;
      } catch (err) {
        console.error('Failed to reset Cloud SQL state:', err);
        showToast('Unable to reset cloud residence right now.', 'error');
        return;
      }
    }
    const fresh = createDefaultHomeState(user.uid, user.email, user.displayName);
    setState(fresh);
    localStorage.setItem(`${LOCAL_STATE_PREFIX}${user.uid}`, JSON.stringify(fresh));
    showToast('Residence restored to factory defaults', 'success');
  }, [user, authMode, idToken, showToast]);

  return (
    <HomeContext.Provider
      value={{
        state,
        loading,
        syncError,
        toast,
        dismissToast,
        showToast,
        ...derived,
        setHouseMode,
        setSecurityMode,
        triggerSecurityAlert,
        dismissSecurityAlert,
        updateProfile,
        toggleDevicePower,
        setDeviceBrightness,
        setAcTemperature,
        setAcMode,
        setAcFanSpeed,
        toggleLock,
        toggleSensorState,
        reconnectDevice,
        renameDevice,
        removeDevice,
        addDevice,
        turnOffRoomLights,
        turnOffAllLights,
        lockAllDoors,
        addRoom,
        removeRoom,
        toggleAutomation,
        saveAutomation,
        deleteAutomation,
        testAutomationRule,
        applyRecommendation,
        dismissRecommendation,
        requestGeminiRecommendation,
        generatingAi,
        clearSecurityLog,
        exportTelemetryJson,
        resetResidenceData,
      }}
    >
      {children}
    </HomeContext.Provider>
  );
};

export function useHome() {
  const ctx = useContext(HomeContext);
  if (!ctx) {
    throw new Error('useHome must be used within a HomeProvider');
  }
  return ctx;
}
