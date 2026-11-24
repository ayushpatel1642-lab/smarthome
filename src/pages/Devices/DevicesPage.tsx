import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { AppShell } from '../../components/navigation/AppShell';
import { useHome } from '../../context/HomeContext';
import type { AcMode, SmartDevice } from '../../types/home';
import { formatTemp } from '../../utils/format';

type CategoryFilter = 'all' | 'lighting' | 'climate' | 'security' | 'appliance';

const CATEGORIES: { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'lighting', label: 'Lighting' },
  { id: 'climate', label: 'Climate' },
  { id: 'security', label: 'Security' },
  { id: 'appliance', label: 'Appliances' },
];

const AC_MODES: AcMode[] = ['cool', 'heat', 'fan', 'auto'];

export const DevicesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCat = (searchParams.get('category') as CategoryFilter) || 'all';

  const {
    state,
    onlineDevicesCount,
    offlineDevicesCount,
    toggleDevicePower,
    setDeviceBrightness,
    setAcTemperature,
    setAcMode,
    toggleLock,
    toggleSensorState,
    reconnectDevice,
    turnOffRoomLights,
  } = useHome();

  const [category, setCategory] = useState<CategoryFilter>(
    ['all', 'lighting', 'climate', 'security', 'appliance'].includes(initialCat) ? initialCat : 'all'
  );
  const [selectedRoom, setSelectedRoom] = useState<string>('All Rooms');
  const [searchQuery, setSearchQuery] = useState('');
  const [reconnectingId, setReconnectingId] = useState<number | null>(null);

  const unit = state.profile.tempUnit;

  const handleCategoryChange = (cat: CategoryFilter) => {
    setCategory(cat);
    if (cat === 'all') {
      searchParams.delete('category');
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ category: cat }, { replace: true });
    }
  };

  const roomChips = useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of state.devices) {
      counts.set(d.roomName, (counts.get(d.roomName) || 0) + 1);
    }
    const ordered = state.rooms.map((r) => ({ name: r.name, count: counts.get(r.name) || 0 }));
    for (const [name, count] of counts.entries()) {
      if (!ordered.some((r) => r.name === name)) {
        ordered.push({ name, count });
      }
    }
    return [{ name: 'All Rooms', count: state.devices.length }, ...ordered];
  }, [state.devices, state.rooms]);

  const filteredDevices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return state.devices.filter((d) => {
      const catMatch = category === 'all' || d.category === category;
      const roomMatch = selectedRoom === 'All Rooms' || d.roomName === selectedRoom;
      const queryMatch =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.roomName.toLowerCase().includes(q) ||
        d.protocol.toLowerCase().includes(q);
      return catMatch && roomMatch && queryMatch;
    });
  }, [state.devices, category, selectedRoom, searchQuery]);

  const groupedByRoom = useMemo(() => {
    const groups = new Map<string, SmartDevice[]>();
    for (const d of filteredDevices) {
      const list = groups.get(d.roomName) || [];
      list.push(d);
      groups.set(d.roomName, list);
    }
    return Array.from(groups.entries());
  }, [filteredDevices]);

  const handleReconnect = async (id: number) => {
    setReconnectingId(id);
    await reconnectDevice(id);
    setReconnectingId(null);
  };

  return (
    <AppShell
      title="Devices"
      subtitle={`${onlineDevicesCount} connected · ${offlineDevicesCount} offline`}
      rightSlot={
        <Button
          variant="primary"
          size="small"
          onClick={() => navigate('/add-device')}
          aria-label="Add device"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span className="hidden sm:inline">Add device</span>
        </Button>
      }
    >
      <div className="space-y-4 pb-14 font-gellix">
        {/* Header Summary */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-title-xs font-semibold text-on-surface">Connected devices</h1>
            <p className="text-text-xs text-on-surface-variant mt-0.5 tabular-nums">
              {onlineDevicesCount} connected · {offlineDevicesCount} offline · Simulated local bridge
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => navigate('/add-device')}
            className="hidden sm:inline-flex"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Add device</span>
          </Button>
        </div>

        {/* Search input */}
        <div className="relative">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2">
            search
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search devices by name, room, or protocol..."
            aria-label="Search devices"
            className="w-full h-10 pl-10 pr-9 rounded-lg bg-surface-container border border-outline text-text-s font-normal text-on-surface placeholder-gray-50 focus:outline-none focus:border-accent-text transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* 5-Tab Category Segmented Filter */}
        <div className="grid grid-cols-5 gap-1 p-1 rounded-lg bg-surface-container-low border border-outline overflow-x-auto no-scrollbar">
          {CATEGORIES.map((c) => {
            const active = category === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => handleCategoryChange(c.id)}
                className={`py-2 px-1.5 rounded-lg text-text-xs font-semibold transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-amplitude-blue text-white'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        {/* Scrollable Room Filter Controls */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {roomChips.map((chip) => {
            const active = selectedRoom === chip.name;
            return (
              <button
                key={chip.name}
                type="button"
                onClick={() => setSelectedRoom(chip.name)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-text-xs font-medium border transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-accent/10 border-accent-text text-accent-text'
                    : 'bg-surface-container border-outline text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span>{chip.name}</span>
                <span className="text-text-xxs opacity-80 tabular-nums">{chip.count}</span>
              </button>
            );
          })}
        </div>

        {/* Room-grouped Device Cards */}
        {groupedByRoom.length === 0 ? (
          <div className="rounded-xl bg-surface-container border border-outline p-8 text-center space-y-2">
            <span className="material-symbols-outlined text-[32px] text-on-surface-variant">
              devices_off
            </span>
            <p className="text-text-s font-semibold text-on-surface">No devices match this filter</p>
            <p className="text-text-xs text-on-surface-variant">
              Clear your search or choose another category.
            </p>
            {(searchQuery || category !== 'all' || selectedRoom !== 'All Rooms') && (
              <Button
                variant="secondary"
                size="small"
                onClick={() => {
                  setSearchQuery('');
                  handleCategoryChange('all');
                  setSelectedRoom('All Rooms');
                }}
              >
                Reset filters
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {groupedByRoom.map(([roomName, roomDevices]) => {
              const hasActiveLight = roomDevices.some(
                (d) => d.category === 'lighting' && d.isOn && d.online
              );
              const sensors = roomDevices.filter(
                (d) =>
                  d.deviceType === 'door_sensor' ||
                  d.deviceType === 'window_sensor' ||
                  d.deviceType === 'motion_sensor'
              );
              const primaryDevices = roomDevices.filter((d) => !sensors.includes(d));

              return (
                <section key={roomName} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-eyebrow-s text-on-surface-variant tabular-nums">
                      {roomName} ({roomDevices.length})
                    </h2>
                    {hasActiveLight && (
                      <Button
                        variant="tertiary"
                        size="small"
                        onClick={() => turnOffRoomLights(roomName)}
                      >
                        All off
                      </Button>
                    )}
                  </div>

                  {/* Primary Device Cards */}
                  <div className="space-y-3">
                    {primaryDevices.map((device) => {
                      if (!device.online) {
                        return (
                          <div
                            key={device.id}
                            className="rounded-xl bg-surface-container border border-error/50 p-4 flex items-center justify-between gap-3"
                          >
                            <button
                              type="button"
                              onClick={() => navigate(`/device-detail/${device.id}`)}
                              className="flex items-center gap-3 min-w-0 text-left group"
                            >
                              <div className="w-10 h-10 rounded-lg bg-error/10 text-error flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-[20px]">
                                  {device.icon}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-text-s font-semibold text-on-surface group-hover:text-accent-text truncate">
                                    {device.name}
                                  </span>
                                  <span className="text-text-xs font-semibold text-error shrink-0">
                                    · Offline
                                  </span>
                                </div>
                                <p className="text-text-xs text-on-surface-variant mt-0.5 truncate">
                                  Last seen {device.lastSeen} · {device.protocol}
                                </p>
                              </div>
                            </button>
                            <Button
                              variant="secondary"
                              size="small"
                              isLoading={reconnectingId === device.id}
                              onClick={() => handleReconnect(device.id)}
                            >
                              {reconnectingId === device.id ? 'Pinging' : 'Reconnect'}
                            </Button>
                          </div>
                        );
                      }

                      if (device.deviceType === 'ac') {
                        return (
                          <div
                            key={device.id}
                            className="rounded-xl bg-surface-container border border-outline p-4 space-y-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <button
                                type="button"
                                onClick={() => navigate(`/device-detail/${device.id}`)}
                                className="flex items-center gap-3 text-left min-w-0 group"
                              >
                                <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent-text flex items-center justify-center shrink-0">
                                  <span className="material-symbols-outlined text-[22px]">
                                    ac_unit
                                  </span>
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-text-s font-semibold text-on-surface group-hover:text-accent-text transition-colors truncate">
                                      {device.name}
                                    </span>
                                    <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                                      chevron_right
                                    </span>
                                  </div>
                                  <p className="text-text-xs text-on-surface-variant tabular-nums">
                                    Current {formatTemp(device.currentTemp ?? 24.5, unit, 1)} ·{' '}
                                    {device.humidity ?? 58}% RH · {device.powerWatts}W
                                  </p>
                                </div>
                              </button>

                              <button
                                type="button"
                                role="switch"
                                aria-checked={device.isOn}
                                aria-label={`Toggle ${device.name}`}
                                onClick={() => toggleDevicePower(device.id)}
                                className={`w-12 h-7 rounded-full p-1 transition-colors shrink-0 ${
                                  device.isOn ? 'bg-amplitude-blue' : 'bg-surface-container-highest'
                                }`}
                              >
                                <span
                                  className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
                                    device.isOn ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-outline">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="secondary"
                                  iconOnly
                                  onClick={() =>
                                    setAcTemperature(device.id, (device.targetTemp ?? 24) - 0.5)
                                  }
                                  aria-label="Decrease temperature"
                                >
                                  <span className="material-symbols-outlined text-[18px]">
                                    remove
                                  </span>
                                </Button>
                                <div className="min-w-[68px] text-center">
                                  <div className="text-text-m font-semibold text-on-surface tabular-nums">
                                    {formatTemp(device.targetTemp ?? 24, unit, 1)}
                                  </div>
                                  <div className="text-text-xxs text-on-surface-variant">Target</div>
                                </div>
                                <Button
                                  variant="secondary"
                                  iconOnly
                                  onClick={() =>
                                    setAcTemperature(device.id, (device.targetTemp ?? 24) + 0.5)
                                  }
                                  aria-label="Increase temperature"
                                >
                                  <span className="material-symbols-outlined text-[18px]">add</span>
                                </Button>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {AC_MODES.map((m) => {
                                  const selected = device.acMode === m && device.isOn;
                                  return (
                                    <Button
                                      key={m}
                                      variant={selected ? 'primary' : 'secondary'}
                                      size="small"
                                      onClick={() => setAcMode(device.id, m)}
                                      className="capitalize"
                                    >
                                      {m}
                                    </Button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      if (device.deviceType === 'lock') {
                        const locked = device.isLocked ?? true;
                        return (
                          <div
                            key={device.id}
                            className="rounded-xl bg-surface-container border border-outline p-4 flex items-center justify-between gap-3"
                          >
                            <button
                              type="button"
                              onClick={() => navigate(`/device-detail/${device.id}`)}
                              className="flex items-center gap-3 min-w-0 text-left group"
                            >
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                  locked
                                    ? 'bg-accent/10 text-accent-text'
                                    : 'bg-error/10 text-error'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[20px]">
                                  {locked ? 'lock' : 'lock_open'}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1">
                                  <span className="text-text-s font-semibold text-on-surface group-hover:text-accent-text truncate">
                                    {device.name}
                                  </span>
                                  <span className="material-symbols-outlined text-[15px] text-on-surface-variant">
                                    chevron_right
                                  </span>
                                </div>
                                <p className="text-text-xs text-on-surface-variant tabular-nums">
                                  {locked ? 'Secured' : 'Unlocked'} · Battery{' '}
                                  {device.battery ?? 88}%
                                </p>
                              </div>
                            </button>
                            <Button
                              variant={locked ? 'secondary' : 'primary'}
                              size="small"
                              onClick={() => toggleLock(device.id)}
                            >
                              {locked ? 'Unlock' : 'Lock'}
                            </Button>
                          </div>
                        );
                      }

                      const isLight = device.deviceType === 'light';
                      return (
                        <div
                          key={device.id}
                          className="rounded-xl bg-surface-container border border-outline p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <button
                              type="button"
                              onClick={() => navigate(`/device-detail/${device.id}`)}
                              className="flex items-center gap-3 min-w-0 text-left group"
                            >
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                  device.isOn
                                    ? 'bg-accent/10 text-accent-text'
                                    : 'bg-surface-container-high text-on-surface-variant'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[20px]">
                                  {device.icon}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1">
                                  <span className="text-text-s font-semibold text-on-surface group-hover:text-accent-text truncate">
                                    {device.name}
                                  </span>
                                  <span className="material-symbols-outlined text-[15px] text-on-surface-variant">
                                    chevron_right
                                  </span>
                                </div>
                                <p className="text-text-xs text-on-surface-variant truncate tabular-nums">
                                  {isLight
                                    ? device.isOn
                                      ? `${device.brightness ?? 80}% brightness · ${device.powerWatts}W`
                                      : 'Standby · 0W'
                                    : device.isOn
                                      ? `Active · ${device.powerWatts}W`
                                      : 'Standby · 0W'}
                                </p>
                              </div>
                            </button>

                            <button
                              type="button"
                              role="switch"
                              aria-checked={device.isOn}
                              aria-label={`Toggle ${device.name}`}
                              onClick={() => toggleDevicePower(device.id)}
                              className={`w-12 h-7 rounded-full p-1 transition-colors shrink-0 ${
                                device.isOn ? 'bg-amplitude-blue' : 'bg-surface-container-highest'
                              }`}
                            >
                              <span
                                className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
                                  device.isOn ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>

                          {isLight && (
                            <div className="flex items-center gap-3 pt-1">
                              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                                brightness_low
                              </span>
                              <input
                                type="range"
                                min={0}
                                max={100}
                                value={device.isOn ? (device.brightness ?? 75) : 0}
                                onChange={(e) =>
                                  setDeviceBrightness(device.id, Number(e.target.value))
                                }
                                aria-label={`${device.name} brightness`}
                                className="flex-1 h-1.5 rounded-full accent-amplitude-blue cursor-pointer bg-surface-container-highest"
                              />
                              <span className="text-text-xs font-medium text-on-surface-variant w-9 text-right tabular-nums">
                                {device.isOn ? (device.brightness ?? 75) : 0}%
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* 2-Column Sensor Tiles (clickable to detail + quick simulate toggle) */}
                  {sensors.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {sensors.map((sensor) => {
                        const isTriggered =
                          sensor.sensorStatus === 'Motion' || sensor.sensorStatus === 'Open';
                        return (
                          <div
                            key={sensor.id}
                            className={`rounded-xl border p-3.5 space-y-2 ${
                              isTriggered
                                ? 'bg-error-container border-error/50'
                                : 'bg-surface-container border-outline'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => navigate(`/device-detail/${sensor.id}`)}
                              className="w-full text-left group"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span
                                  className={`material-symbols-outlined text-[20px] ${
                                    isTriggered ? 'text-error' : 'text-accent-text'
                                  }`}
                                >
                                  {sensor.icon}
                                </span>
                                <span className="text-text-xxs text-on-surface-variant tabular-nums">
                                  {sensor.battery ?? 94}%
                                </span>
                              </div>
                              <div className="text-text-xs font-semibold text-on-surface group-hover:text-accent-text truncate">
                                {sensor.name}
                              </div>
                            </button>
                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-outline/60">
                              <span
                                className={`text-text-xs ${
                                  isTriggered
                                    ? 'text-error font-semibold'
                                    : 'text-on-surface-variant'
                                }`}
                              >
                                {sensor.sensorStatus || 'Clear'}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleSensorState(sensor.id)}
                                className="text-text-xxs font-semibold text-accent-text hover:underline"
                              >
                                Simulate
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* Mobile Add Device FAB */}
      <Button
        variant="primary"
        onClick={() => navigate('/add-device')}
        className="sm:hidden fixed bottom-20 right-4 z-30 h-10 px-4 shadow-xl"
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
        <span>Add device</span>
      </Button>
    </AppShell>
  );
};
