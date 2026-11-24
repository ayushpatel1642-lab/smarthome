import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { AppShell } from '../../components/navigation/AppShell';
import { useHome } from '../../context/HomeContext';

export const SecurityAlertPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, dismissSecurityAlert, setSecurityMode } = useHome();

  const [countdown, setCountdown] = useState(15);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [disarmConfirmOpen, setDisarmConfirmOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleDismiss = async () => {
    await dismissSecurityAlert();
    navigate('/security');
  };

  const handleDisarm = async () => {
    await dismissSecurityAlert();
    await setSecurityMode('disarmed');
    setDisarmConfirmOpen(false);
    navigate('/security');
  };

  const frontDoor = state.devices.find((d) => d.name.toLowerCase().includes('door'));
  const windowSensor = state.devices.find((d) => d.deviceType === 'window_sensor');
  const smartLock = state.devices.find((d) => d.deviceType === 'lock');

  return (
    <AppShell
      headerMode="stack"
      title="Security incident"
      subtitle="Simulated alert response"
      backTo="/security"
      hideBottomNav
      rightSlot={<span className="text-eyebrow-s text-error">Alert active</span>}
    >
      <div className="space-y-4 pb-8 font-gellix">
        {/* Top Critical Alert Banner (Red used intentionally for critical incident only) */}
        <section className="rounded-xl bg-error text-white p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">warning</span>
            </div>
            <div>
              <div className="text-text-xs font-semibold opacity-95 tabular-nums">
                Live simulation · Escalation timer {countdown}s
              </div>
              <h1 className="text-title-xs font-semibold mt-0.5">Motion detected in Hall</h1>
              <p className="text-text-xs opacity-90 mt-0.5">
                Zone 02 radar sensor triggered while perimeter armed (Simulation mode).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setCameraModalOpen(true)}
              className="h-9 rounded-lg bg-white text-error text-text-xs font-semibold flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">videocam</span>
              <span>View feed</span>
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="h-9 rounded-lg bg-black/25 hover:bg-black/35 text-white text-text-xs font-semibold"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={() => setEmergencyModalOpen(true)}
              className="h-9 rounded-lg bg-white/20 hover:bg-white/30 text-white text-text-xs font-semibold truncate px-2"
            >
              Emergency info
            </button>
          </div>
        </section>

        {/* Hero Status Alert Card */}
        <section className="rounded-xl bg-surface-container border border-error/50 p-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-eyebrow-s text-error">Zone 02 triggered</div>
            <div className="text-text-m font-semibold text-on-surface mt-0.5">
              Perimeter alarm engaged (Simulated)
            </div>
            <p className="text-text-xs font-normal text-on-surface-variant mt-0.5">
              Verify feed or disarm system to return sensors to normal state.
            </p>
          </div>
          <Button variant="primary" isDanger onClick={() => setDisarmConfirmOpen(true)}>
            Disarm
          </Button>
        </section>

        {/* 2x2 Sensor Grid */}
        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-surface-container border border-outline p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="material-symbols-outlined text-[20px] text-accent-text">
                sensor_door
              </span>
              <span className="text-text-xs font-semibold text-accent-text">
                {frontDoor?.sensorStatus || 'Closed'}
              </span>
            </div>
            <div className="text-text-xs font-semibold text-on-surface">Front Door</div>
            <div className="text-text-xs text-on-surface-variant">Zone 01 · Nominal</div>
          </div>

          <div className="rounded-xl bg-surface-container border border-outline p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="material-symbols-outlined text-[20px] text-accent-text">
                sensor_window
              </span>
              <span className="text-text-xs font-semibold text-accent-text">
                {windowSensor?.sensorStatus || 'Closed'}
              </span>
            </div>
            <div className="text-text-xs font-semibold text-on-surface">Window</div>
            <div className="text-text-xs text-on-surface-variant">Bedroom · Nominal</div>
          </div>

          <div className="rounded-xl bg-error-container border border-error p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="material-symbols-outlined text-[20px] text-error">sensors</span>
              <span className="text-text-xs font-semibold text-error">Triggered</span>
            </div>
            <div className="text-text-xs font-semibold text-on-surface">Hall Motion</div>
            <div className="text-text-xs text-error font-medium">Zone 02 · Motion active</div>
          </div>

          <div className="rounded-xl bg-surface-container border border-outline p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="material-symbols-outlined text-[20px] text-accent-text">lock</span>
              <span className="text-text-xs font-semibold text-accent-text">
                {smartLock?.isLocked === false ? 'Unlocked' : 'Locked'}
              </span>
            </div>
            <div className="text-text-xs font-semibold text-on-surface">Smart Lock</div>
            <div className="text-text-xs text-on-surface-variant">Deadbolt secured</div>
          </div>
        </section>

        {/* Incident Capture Telemetry Viewport */}
        <section className="rounded-xl bg-surface-container border border-outline overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between border-b border-outline">
            <span className="text-text-xs font-semibold text-on-surface">
              CAM-02 · Hallway West (Simulated feed)
            </span>
            <Button variant="tertiary" size="small" onClick={() => setCameraModalOpen(true)}>
              <span>Expand</span>
              <span className="material-symbols-outlined text-[15px]">open_in_full</span>
            </Button>
          </div>

          <div className="relative h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 400 180" className="w-full h-full">
              <rect width="400" height="180" fill="var(--color-surface-container-lowest)" />
              <g stroke="var(--color-chart-primary)" strokeOpacity="0.25" strokeWidth="1" fill="none">
                <line x1="0" y1="0" x2="140" y2="55" />
                <line x1="400" y1="0" x2="260" y2="55" />
                <line x1="0" y1="180" x2="140" y2="128" />
                <line x1="400" y1="180" x2="260" y2="128" />
                <rect x="140" y="55" width="120" height="73" />
                <line x1="65" y1="25" x2="65" y2="155" />
                <line x1="335" y1="25" x2="335" y2="155" />
              </g>
              <g stroke="var(--color-chart-alert)" strokeWidth="1.5" fill="var(--color-chart-alert)" fillOpacity="0.08">
                <rect x="168" y="64" width="64" height="62" strokeDasharray="5 3" />
              </g>
              <text x="172" y="58" fill="var(--color-chart-alert)" fontSize="9" fontWeight="600">
                MOTION 96%
              </text>
              <text x="12" y="20" fill="var(--color-text-muted)" fontSize="9">
                IR-NIGHT · 1080P · SIMULATED TELEMETRY
              </text>
              <text x="12" y="168" fill="var(--color-chart-primary)" fontSize="9">
                OAKRIDGE · ZONE 02 · RADAR LOCK
              </text>
            </svg>
          </div>
        </section>

        {/* Critical Event Log Card */}
        <section className="rounded-xl bg-surface-container border border-outline p-4 space-y-2.5">
          <h2 className="text-text-s font-semibold text-on-surface">Incident timeline</h2>
          <div className="p-3 rounded-lg bg-error-container border border-error/40 flex items-start gap-3">
            <span className="material-symbols-outlined text-[18px] text-error mt-0.5">error</span>
            <div className="flex-1 text-text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-error">Critical alert</span>
                <span className="text-text-xxs text-on-surface-variant">Just now</span>
              </div>
              <p className="text-on-surface font-medium mt-0.5">
                Hallway radar motion sensor exceeded threshold while system armed.
              </p>
            </div>
          </div>
          {state.securityEvents.slice(0, 3).map((ev) => (
            <div
              key={ev.id}
              className="py-2 border-t border-outline flex items-center justify-between text-text-xs"
            >
              <span className="text-on-surface truncate pr-2">{ev.title}</span>
              <span className="text-text-xxs text-on-surface-variant shrink-0 tabular-nums">
                {ev.timeLabel}
              </span>
            </div>
          ))}
        </section>
      </div>

      {/* Expanded Camera Modal */}
      {cameraModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setCameraModalOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-xl bg-surface-container border border-outline overflow-hidden shadow-2xl font-gellix"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 flex items-center justify-between border-b border-outline">
              <span className="text-text-xs font-semibold text-on-surface">
                CAM-02 · Hallway West (Simulated night vision)
              </span>
              <Button
                variant="tertiary-alt"
                size="small"
                iconOnly
                onClick={() => setCameraModalOpen(false)}
                aria-label="Close camera modal"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </Button>
            </div>
            <div className="p-4">
              <svg viewBox="0 0 400 220" className="w-full rounded-lg bg-gray-100">
                <g stroke="var(--color-chart-primary)" strokeOpacity="0.25" strokeWidth="1" fill="none">
                  <line x1="0" y1="0" x2="135" y2="65" />
                  <line x1="400" y1="0" x2="265" y2="65" />
                  <line x1="0" y1="220" x2="135" y2="155" />
                  <line x1="400" y1="220" x2="265" y2="155" />
                  <rect x="135" y="65" width="130" height="90" />
                </g>
                <rect
                  x="166"
                  y="78"
                  width="68"
                  height="74"
                  stroke="var(--color-chart-alert)"
                  strokeWidth="2"
                  strokeDasharray="6 3"
                  fill="var(--color-chart-alert)"
                  fillOpacity="0.1"
                />
                <text x="166" y="70" fill="var(--color-chart-alert)" fontSize="10" fontWeight="600">
                  ZONE 02 MOTION TARGET
                </text>
                <text x="14" y="205" fill="var(--color-text-muted)" fontSize="10">
                  SIMULATED HARDWARE FEED — NO PHYSICAL CAMERA CONNECTED
                </text>
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Safe Emergency Contact Workflow Modal */}
      {emergencyModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setEmergencyModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-surface-container border border-outline p-5 shadow-2xl space-y-4 font-gellix"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-error/10 text-error flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">contact_emergency</span>
              </div>
              <div>
                <h3 className="text-text-m font-semibold text-on-surface">
                  Emergency contact workflow
                </h3>
                <p className="text-text-xs font-normal text-on-surface-variant mt-1 leading-relaxed">
                  Aware Home runs in simulation mode and does{' '}
                  <strong className="text-on-surface font-semibold">not</strong> place emergency
                  calls or dispatch responders.
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-outline text-text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Local emergency services</span>
                <span className="font-semibold text-on-surface">Dial manually on phone</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Residence address</span>
                <span className="font-semibold text-on-surface">{state.profile.residenceName}</span>
              </div>
            </div>
            <Button variant="primary" fullWidth onClick={() => setEmergencyModalOpen(false)}>
              Understood
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={disarmConfirmOpen}
        title="Disarm & clear alert?"
        description="This clears the simulated hallway alert and disarms the perimeter system."
        confirmLabel="Disarm system"
        tone="danger"
        icon="gpp_off"
        onConfirm={handleDisarm}
        onCancel={() => setDisarmConfirmOpen(false)}
      />
    </AppShell>
  );
};
