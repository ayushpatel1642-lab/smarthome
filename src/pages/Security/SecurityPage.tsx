import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { AppShell } from '../../components/navigation/AppShell';
import { useHome } from '../../context/HomeContext';
import type { SecurityMode } from '../../types/home';

type SeverityFilter = 'all' | 'info' | 'warning' | 'critical';

export const SecurityPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, setSecurityMode, triggerSecurityAlert, toggleLock } = useHome();

  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [disarmConfirmOpen, setDisarmConfirmOpen] = useState(false);

  const securityMode = state.profile.securityMode;
  const isArmed = securityMode !== 'disarmed';

  const monitoredZones = useMemo(() => {
    const frontDoor = state.devices.find((d) => d.name.toLowerCase().includes('door'));
    const windowSensor = state.devices.find((d) => d.deviceType === 'window_sensor');
    const hallMotion = state.devices.find((d) => d.deviceType === 'motion_sensor');
    const smartLock = state.devices.find((d) => d.deviceType === 'lock');
    return [
      {
        label: 'Front Door',
        device: frontDoor,
        status: frontDoor?.sensorStatus || 'Closed',
        icon: 'sensor_door',
        ok: (frontDoor?.sensorStatus || 'Closed') === 'Closed',
      },
      {
        label: 'Window',
        device: windowSensor,
        status: windowSensor?.sensorStatus || 'Closed',
        icon: 'sensor_window',
        ok: (windowSensor?.sensorStatus || 'Closed') === 'Closed',
      },
      {
        label: 'Hall Motion',
        device: hallMotion,
        status: hallMotion?.sensorStatus || 'Clear',
        icon: 'sensors',
        ok: (hallMotion?.sensorStatus || 'Clear') === 'Clear',
      },
      {
        label: 'Smart Lock',
        device: smartLock,
        status: smartLock?.isLocked === false ? 'Unlocked' : 'Locked',
        icon: smartLock?.isLocked === false ? 'lock_open' : 'lock',
        ok: smartLock?.isLocked !== false,
      },
    ];
  }, [state.devices]);

  const filteredEvents = useMemo(() => {
    if (severityFilter === 'all') return state.securityEvents;
    return state.securityEvents.filter((e) => e.severity === severityFilter);
  }, [state.securityEvents, severityFilter]);

  const handleModeClick = (mode: SecurityMode) => {
    if (mode === 'disarmed' && isArmed) {
      setDisarmConfirmOpen(true);
      return;
    }
    setSecurityMode(mode);
  };

  const handleSimulateBreach = async () => {
    await triggerSecurityAlert();
    navigate('/security/alert');
  };

  return (
    <AppShell
      title="Security"
      subtitle="Perimeter monitoring active · All nodes nominal"
      rightSlot={
        <span
          className={`text-eyebrow-s ${
            state.profile.securityAlertActive
              ? 'text-error'
              : isArmed
                ? 'text-accent-text'
                : 'text-on-surface-variant'
          }`}
        >
          {state.profile.securityAlertActive ? 'Alert active' : isArmed ? 'Secure' : 'Disarmed'}
        </span>
      }
    >
      <div className="space-y-5 font-gellix">
        {/* Alert Banner if already active */}
        {state.profile.securityAlertActive && (
          <button
            type="button"
            onClick={() => navigate('/security/alert')}
            className="w-full rounded-xl bg-error text-white p-4 flex items-center justify-between gap-3 text-left"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[22px]">warning</span>
              <div>
                <div className="text-text-s font-semibold">
                  Active breach alert — Motion in Hall
                </div>
                <div className="text-text-xs opacity-90">
                  Select to open live incident response view
                </div>
              </div>
            </div>
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        )}

        {/* 3-Tab Security Mode Selector */}
        <section className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-surface-container-low border border-outline">
          {(
            [
              { id: 'home', label: 'Home', icon: 'home' },
              { id: 'away', label: 'Away', icon: 'directions_walk' },
              { id: 'disarmed', label: 'Disarmed', icon: 'lock_open' },
            ] as { id: SecurityMode; label: string; icon: string }[]
          ).map((m) => {
            const active = securityMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleModeClick(m.id)}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-amplitude-blue text-white'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{m.icon}</span>
                <span>{m.label}</span>
              </button>
            );
          })}
        </section>

        {/* Hero Status Card */}
        <section className="rounded-xl bg-surface-container border border-outline p-5 space-y-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-surface-container-high border border-outline text-accent-text flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[26px]">
                {isArmed ? 'verified_user' : 'shield'}
              </span>
            </div>
            <div>
              <div className="text-eyebrow-s text-accent-text">Perimeter status</div>
              <h1 className="text-title-xs font-semibold text-on-surface mt-0.5 capitalize">
                {isArmed ? `Armed: ${securityMode}` : 'System disarmed'}
              </h1>
              <p className="text-text-xs font-normal text-on-surface-variant mt-0.5">
                {isArmed
                  ? 'Entry doors, windows & motion zones actively monitored'
                  : 'Sensors in passive logging mode'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-outline">
            {isArmed ? (
              <Button
                variant="secondary"
                onClick={() => setDisarmConfirmOpen(true)}
                className="flex-1 min-w-[140px] h-9"
              >
                Disarm system
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => setSecurityMode('home')}
                className="flex-1 min-w-[140px] h-9"
              >
                Arm perimeter (Home)
              </Button>
            )}
            <Button
              variant="secondary"
              isDanger
              onClick={handleSimulateBreach}
              className="h-9"
            >
              <span className="material-symbols-outlined text-[16px]">notification_important</span>
              <span>Simulate breach alert</span>
            </Button>
          </div>
        </section>

        {/* 2x2 Monitored Zones Grid */}
        <section>
          <h2 className="text-eyebrow-s text-on-surface-variant mb-2.5">Monitored zones</h2>
          <div className="grid grid-cols-2 gap-3">
            {monitoredZones.map((z) => (
              <div
                key={z.label}
                className="rounded-xl bg-surface-container border border-outline p-4 flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      z.ok ? 'text-accent-text' : 'text-error'
                    }`}
                  >
                    {z.icon}
                  </span>
                  <span
                    className={`text-text-xs font-semibold ${
                      z.ok ? 'text-accent-text' : 'text-error'
                    }`}
                  >
                    {z.status}
                  </span>
                </div>
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <div className="text-text-s font-semibold text-on-surface">{z.label}</div>
                    <div className="text-text-xs text-on-surface-variant tabular-nums">
                      {z.device?.roomName || 'Perimeter'} · {z.device?.battery ?? 95}%
                    </div>
                  </div>
                  {z.device?.deviceType === 'lock' && (
                    <Button
                      variant="tertiary"
                      size="small"
                      onClick={() => toggleLock(z.device!.id)}
                    >
                      {z.device.isLocked ? 'Unlock' : 'Lock'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Security Event Log with Severity Filter */}
        <section className="rounded-xl bg-surface-container border border-outline p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-text-s font-semibold text-on-surface">Security event log</h2>
            <div className="flex items-center gap-1">
              {(['all', 'info', 'warning', 'critical'] as SeverityFilter[]).map((s) => (
                <Button
                  key={s}
                  variant={severityFilter === s ? 'primary' : 'secondary'}
                  size="small"
                  onClick={() => setSeverityFilter(s)}
                  className="capitalize"
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>

          {filteredEvents.length === 0 ? (
            <p className="text-text-xs text-on-surface-variant py-6 text-center">
              No security events match this severity filter.
            </p>
          ) : (
            <div className="divide-y divide-outline">
              {filteredEvents.map((ev) => (
                <div key={ev.id} className="py-3 first:pt-1 last:pb-1 flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      ev.severity === 'critical'
                        ? 'bg-error/10 text-error'
                        : 'bg-surface-container-high text-accent-text'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{ev.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-text-xs font-semibold text-on-surface truncate">
                        {ev.title}
                      </span>
                      <span className="text-text-xxs text-on-surface-variant shrink-0 tabular-nums">
                        {ev.timeLabel}
                      </span>
                    </div>
                    <p className="text-text-xs font-normal text-on-surface-variant mt-0.5">
                      {ev.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={disarmConfirmOpen}
        title="Disarm perimeter security?"
        description="Entry contact sensors and motion radar alerts will switch to passive logging until re-armed."
        confirmLabel="Disarm system"
        tone="warning"
        icon="lock_open"
        onConfirm={async () => {
          await setSecurityMode('disarmed');
          setDisarmConfirmOpen(false);
        }}
        onCancel={() => setDisarmConfirmOpen(false)}
      />
    </AppShell>
  );
};
