import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { AppShell } from '../../components/navigation/AppShell';
import { useHome } from '../../context/HomeContext';
import type { AcMode, FanSpeed } from '../../types/home';
import { formatTemp, formatTempValue } from '../../utils/format';

const AC_MODES: { id: AcMode; label: string; icon: string }[] = [
  { id: 'cool', label: 'Cool', icon: 'ac_unit' },
  { id: 'heat', label: 'Heat', icon: 'local_fire_department' },
  { id: 'fan', label: 'Fan', icon: 'mode_fan' },
  { id: 'auto', label: 'Auto', icon: 'hdr_auto' },
  { id: 'dry', label: 'Dry', icon: 'water_drop' },
];

const FAN_SPEEDS: { id: FanSpeed; label: string }[] = [
  { id: 'low', label: 'Low' },
  { id: 'med', label: 'Med' },
  { id: 'high', label: 'High' },
  { id: 'auto', label: 'Auto' },
];

export const DeviceDetailPage: React.FC = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const {
    state,
    primaryAc,
    toggleDevicePower,
    setAcTemperature,
    setAcMode,
    setAcFanSpeed,
    renameDevice,
    removeDevice,
  } = useHome();

  const device =
    state.devices.find((d) => String(d.id) === deviceId) || primaryAc || state.devices[0];

  const [renameOpen, setRenameOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState(device?.name || '');
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);

  if (!device) {
    return (
      <AppShell headerMode="stack" title="Device detail" backTo="/devices" hideBottomNav>
        <div className="rounded-xl bg-surface-container border border-outline p-8 text-center font-gellix">
          <p className="text-text-s font-semibold text-on-surface">Device not found.</p>
          <Button variant="primary" className="mt-4" onClick={() => navigate('/devices')}>
            Back to devices
          </Button>
        </div>
      </AppShell>
    );
  }

  const unit = state.profile.tempUnit;
  const targetTemp = device.targetTemp ?? 24.0;
  const currentTemp = device.currentTemp ?? 24.5;
  const humidity = device.humidity ?? 58;

  const minTemp = 16;
  const maxTemp = 30;
  const ratio = Math.max(0, Math.min(1, (targetTemp - minTemp) / (maxTemp - minTemp)));
  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  const arcFraction = 0.75;
  const totalArcLen = circumference * arcFraction;
  const activeArcLen = totalArcLen * ratio;
  const notchAngleDeg = 135 + ratio * 270;
  const notchRad = (notchAngleDeg * Math.PI) / 180;
  const notchX = 110 + radius * Math.cos(notchRad);
  const notchY = 110 + radius * Math.sin(notchRad);

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameDraft.trim()) return;
    await renameDevice(device.id, nameDraft);
    setRenameOpen(false);
  };

  const handleRemoveConfirm = async () => {
    await removeDevice(device.id);
    setRemoveConfirmOpen(false);
    navigate('/devices');
  };

  return (
    <AppShell
      headerMode="stack"
      title={device.name}
      subtitle={`${device.roomName} · ${device.protocol}`}
      backTo="/devices"
      hideBottomNav
    >
      <div className="space-y-4 pb-8 font-gellix">
        {/* Top Hero Info Card */}
        <section className="rounded-xl bg-surface-container border border-outline p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-lg bg-accent/10 border border-outline text-accent-text flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">{device.icon}</span>
            </div>
            <div className="min-w-0">
              <div className="text-eyebrow-s text-accent-text">
                {device.roomName} · {device.online ? 'Online' : 'Offline'}
              </div>
              <h2 className="text-text-m font-semibold text-on-surface truncate">{device.name}</h2>
              <p className="text-text-xs text-on-surface-variant truncate">{device.subtitle}</p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={device.isOn}
            aria-label="Toggle AC power"
            onClick={() => toggleDevicePower(device.id)}
            className={`w-13 h-7 rounded-full p-1 transition-colors shrink-0 ${
              device.isOn ? 'bg-amplitude-blue' : 'bg-surface-container-highest'
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
                device.isOn ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </section>

        {/* Circular SVG Thermostat Dial Card */}
        <section className="rounded-xl bg-surface-container border border-outline p-5 flex flex-col items-center">
          <div className="relative w-[220px] h-[220px] flex items-center justify-center">
            <svg viewBox="0 0 220 220" className="w-full h-full">
              <circle
                cx="110"
                cy="110"
                r={radius}
                fill="none"
                stroke="var(--color-chart-baseline)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${totalArcLen} ${circumference}`}
                transform="rotate(135 110 110)"
              />
              {device.isOn && (
                <circle
                  cx="110"
                  cy="110"
                  r={radius}
                  fill="none"
                  stroke="var(--color-chart-primary)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${activeArcLen} ${circumference}`}
                  transform="rotate(135 110 110)"
                  style={{ transition: 'stroke-dasharray 220ms ease' }}
                />
              )}
              {device.isOn && (
                <circle
                  cx={notchX}
                  cy={notchY}
                  r="7"
                  fill="var(--color-chart-notch)"
                  stroke="var(--color-surface)"
                  strokeWidth="2.5"
                />
              )}
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-eyebrow-s text-on-surface-variant">Target</span>
              <span className="text-display-metric text-on-surface tabular-nums mt-0.5">
                {formatTempValue(targetTemp, unit, 1)}°
              </span>
              <span
                className={`mt-1 text-text-xs font-semibold ${
                  device.isOn ? 'text-accent-text' : 'text-on-surface-variant'
                }`}
              >
                {device.isOn ? 'Maintaining' : 'Standby'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6 mt-2">
            <Button
              variant="secondary"
              iconOnly
              onClick={() => setAcTemperature(device.id, targetTemp - 0.5)}
              aria-label="Decrease target temperature by 0.5 degrees"
              className="w-11 h-11"
            >
              <span className="material-symbols-outlined text-[20px]">remove</span>
            </Button>
            <div className="text-center min-w-[76px]">
              <div className="text-text-xs font-semibold text-on-surface">0.5° Step</div>
              <div className="text-text-xs text-on-surface-variant tabular-nums">
                {device.powerWatts}W draw
              </div>
            </div>
            <Button
              variant="secondary"
              iconOnly
              onClick={() => setAcTemperature(device.id, targetTemp + 0.5)}
              aria-label="Increase target temperature by 0.5 degrees"
              className="w-11 h-11"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
            </Button>
          </div>

          <div className="w-full mt-5 pt-4 border-t border-outline grid grid-cols-3 gap-2 text-center">
            <div className="p-2">
              <div className="text-text-xs text-on-surface-variant">Current room</div>
              <div className="text-text-s font-semibold text-on-surface mt-0.5 tabular-nums">
                {formatTemp(currentTemp, unit, 1)}
              </div>
            </div>
            <div className="p-2 border-x border-outline">
              <div className="text-text-xs text-on-surface-variant">Humidity</div>
              <div className="text-text-s font-semibold text-on-surface mt-0.5 tabular-nums">
                {humidity}%
              </div>
            </div>
            <div className="p-2">
              <div className="text-text-xs text-on-surface-variant">Outdoor</div>
              <div className="text-text-s font-semibold text-on-surface mt-0.5 tabular-nums">
                {formatTemp(31, unit, 0)}
              </div>
            </div>
          </div>
        </section>

        {/* Operational Mode 5-Col Grid */}
        <section className="rounded-xl bg-surface-container border border-outline p-4 space-y-4">
          <div>
            <h3 className="text-eyebrow-s text-on-surface-variant mb-2.5">Operational mode</h3>
            <div className="grid grid-cols-5 gap-2">
              {AC_MODES.map((m) => {
                const selected = device.acMode === m.id && device.isOn;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setAcMode(device.id, m.id)}
                    className={`flex flex-col items-center justify-center gap-1 py-2.5 rounded-lg border text-text-xs font-semibold transition-colors ${
                      selected
                        ? 'bg-amplitude-blue border-amplitude-blue text-white'
                        : 'bg-surface border-outline text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{m.icon}</span>
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-eyebrow-s text-on-surface-variant mb-2.5">Fan speed</h3>
            <div className="grid grid-cols-4 gap-2">
              {FAN_SPEEDS.map((f) => {
                const selected = (device.fanSpeed || 'auto') === f.id;
                return (
                  <Button
                    key={f.id}
                    variant={selected ? 'primary' : 'secondary'}
                    onClick={() => setAcFanSpeed(device.id, f.id)}
                  >
                    {f.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </section>

        {/* 24-Hour Usage SVG Chart */}
        <section className="rounded-xl bg-surface-container border border-outline p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-text-s font-semibold text-on-surface">24-hour power usage</h3>
              <p className="text-text-xs text-on-surface-variant tabular-nums">
                Compressor duty cycle · {device.weeklyKwh} kWh this week
              </p>
            </div>
            <span className="text-text-xs font-semibold text-accent-text tabular-nums">
              {(device.powerWatts / 1000).toFixed(2)} kW now
            </span>
          </div>
          <svg viewBox="0 0 320 90" className="w-full h-24">
            <defs>
              <linearGradient id="acUsageGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" style={{ stopColor: 'var(--color-chart-primary)', stopOpacity: 0.25 }} />
                <stop offset="100%" style={{ stopColor: 'var(--color-chart-primary)', stopOpacity: 0 }} />
              </linearGradient>
            </defs>
            <line
              x1="0"
              y1="22"
              x2="320"
              y2="22"
              stroke="var(--color-outline)"
              strokeDasharray="3 3"
            />
            <line
              x1="0"
              y1="54"
              x2="320"
              y2="54"
              stroke="var(--color-outline)"
              strokeDasharray="3 3"
            />
            <path
              d="M 0 68 C 35 66, 55 58, 90 48 C 125 38, 155 24, 195 28 C 235 32, 265 44, 320 34 L 320 88 L 0 88 Z"
              fill="url(#acUsageGrad)"
            />
            <path
              d="M 0 68 C 35 66, 55 58, 90 48 C 125 38, 155 24, 195 28 C 235 32, 265 44, 320 34"
              fill="none"
              stroke="var(--color-chart-primary)"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
          <div className="flex justify-between text-text-xxs text-on-surface-variant mt-1 tabular-nums">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>Now</span>
          </div>
        </section>

        {/* Technical Specifications List */}
        <section className="rounded-xl bg-surface-container border border-outline p-4">
          <h3 className="text-eyebrow-s text-on-surface-variant mb-2">Technical specifications</h3>
          <div className="divide-y divide-outline text-text-xs">
            {[
              { label: 'Last seen', value: device.lastSeen },
              { label: 'Connection', value: device.protocol },
              { label: 'IP address', value: device.ipAddress },
              { label: 'Firmware', value: device.firmware },
              { label: 'MAC address', value: device.macAddress },
            ].map((row) => (
              <div key={row.label} className="py-2.5 flex items-center justify-between">
                <span className="text-on-surface-variant">{row.label}</span>
                <span className="font-medium text-on-surface tabular-nums">{row.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Rename & Remove Device Actions */}
        <section className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            fullWidth
            className="h-10"
            onClick={() => {
              setNameDraft(device.name);
              setRenameOpen(true);
            }}
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            <span>Rename device</span>
          </Button>
          <Button
            variant="secondary"
            isDanger
            fullWidth
            className="h-10"
            onClick={() => setRemoveConfirmOpen(true)}
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
            <span>Remove device</span>
          </Button>
        </section>
      </div>

      {/* Inline Rename Modal */}
      {renameOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setRenameOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-surface-container border border-outline p-5 shadow-2xl font-gellix"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-text-m font-semibold text-on-surface mb-3">Rename device</h3>
            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <input
                type="text"
                autoFocus
                required
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                className="w-full h-10 px-3.5 rounded-lg bg-surface border border-outline text-text-s font-normal text-on-surface focus:outline-none focus:border-accent-text"
              />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setRenameOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save name
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={removeConfirmOpen}
        title={`Remove ${device.name}?`}
        description="This removes the device from your residence inventory and stops active telemetry."
        confirmLabel="Remove device"
        tone="danger"
        icon="delete_forever"
        onConfirm={handleRemoveConfirm}
        onCancel={() => setRemoveConfirmOpen(false)}
      />
    </AppShell>
  );
};
