import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { AppShell } from '../../components/navigation/AppShell';
import { useHome } from '../../context/HomeContext';
import { formatTemp } from '../../utils/format';

const HOURLY_LOAD = [
  0.4, 0.35, 0.3, 0.28, 0.32, 0.55, 0.9, 1.15, 0.85, 0.72, 0.68, 0.82,
  1.1, 1.25, 1.32, 1.4, 1.35, 1.55, 1.72, 1.48, 1.22, 0.95, 0.75, 0.58,
];

export const DesktopDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    state,
    activeLightsCount,
    totalLightsCount,
    onlineDevicesCount,
    totalInstantWatts,
    todayKwh,
    primaryAc,
    indoorTemp,
    indoorHumidity,
    setAcTemperature,
    setHouseMode,
    setSecurityMode,
    turnOffAllLights,
    lockAllDoors,
    applyRecommendation,
    dismissRecommendation,
    clearSecurityLog,
  } = useHome();

  const [disarmConfirmOpen, setDisarmConfirmOpen] = useState(false);
  const [clearLogConfirmOpen, setClearLogConfirmOpen] = useState(false);

  const unit = state.profile.tempUnit;
  const activeRec = state.recommendations.find((r) => r.status === 'active');
  const isArmed = state.profile.securityMode !== 'disarmed';

  return (
    <AppShell
      title="Command Center"
      subtitle={`${state.profile.residenceName} · Sector A`}
      showDesktopLink={false}
      maxWidthClass="max-w-7xl"
      rightSlot={
        <span className="hidden md:inline-flex items-center gap-1.5 text-text-xs text-on-surface-variant capitalize">
          Mode · <strong className="text-on-surface font-semibold">{state.profile.houseMode}</strong>
        </span>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 font-gellix">
        {/* Column 1 (4 cols): Indoor Climate + Perimeter Security */}
        <div className="lg:col-span-4 space-y-5">
          <section className="rounded-xl bg-surface-container border border-outline p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-eyebrow-s text-accent-text">Indoor climate</div>
                <div className="text-display-metric-sm text-on-surface tabular-nums mt-1">
                  {formatTemp(indoorTemp, unit, 1)}
                </div>
              </div>
              <Button
                variant="secondary"
                size="small"
                onClick={() => navigate(primaryAc ? `/device-detail/${primaryAc.id}` : '/devices')}
              >
                Inspect AC
              </Button>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-outline">
              <Button
                variant="secondary"
                iconOnly
                onClick={() =>
                  primaryAc && setAcTemperature(primaryAc.id, (primaryAc.targetTemp ?? 24) - 0.5)
                }
                aria-label="Decrease target temperature"
              >
                <span className="material-symbols-outlined text-[18px]">remove</span>
              </Button>
              <div className="text-center">
                <div className="text-text-xs font-semibold text-on-surface tabular-nums">
                  Target {formatTemp(primaryAc?.targetTemp ?? 24, unit, 1)}
                </div>
                <div className="text-text-xxs text-on-surface-variant tabular-nums">
                  {indoorHumidity}% RH · 0.5° Step
                </div>
              </div>
              <Button
                variant="secondary"
                iconOnly
                onClick={() =>
                  primaryAc && setAcTemperature(primaryAc.id, (primaryAc.targetTemp ?? 24) + 0.5)
                }
                aria-label="Increase target temperature"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
              </Button>
            </div>
          </section>

          <section className="rounded-xl bg-surface-container border border-outline p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-eyebrow-s text-accent-text">Perimeter security</div>
                <div className="text-title-xs font-semibold text-on-surface capitalize mt-0.5">
                  {state.profile.securityAlertActive
                    ? 'Alert active'
                    : isArmed
                      ? `Armed (${state.profile.securityMode})`
                      : 'Disarmed'}
                </div>
              </div>
              <span
                className={`text-eyebrow-s ${
                  state.profile.securityAlertActive
                    ? 'text-error'
                    : isArmed
                      ? 'text-accent-text'
                      : 'text-on-surface-variant'
                }`}
              >
                {state.profile.securityAlertActive ? 'Breach' : isArmed ? 'Nominal' : 'Passive'}
              </span>
            </div>

            <div className="divide-y divide-outline text-text-xs">
              {state.devices
                .filter((d) => d.category === 'security')
                .slice(0, 4)
                .map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-2.5">
                    <span className="font-medium text-on-surface truncate pr-2">{s.name}</span>
                    <span
                      className={`font-semibold ${
                        s.sensorStatus === 'Motion' || s.sensorStatus === 'Unlocked'
                          ? 'text-error'
                          : 'text-accent-text'
                      }`}
                    >
                      {s.sensorStatus || (s.isLocked ? 'Locked' : 'Clear')}
                    </span>
                  </div>
                ))}
            </div>

            <div className="flex gap-2">
              {isArmed ? (
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setDisarmConfirmOpen(true)}
                >
                  Disarm system
                </Button>
              ) : (
                <Button variant="primary" fullWidth onClick={() => setSecurityMode('home')}>
                  Arm perimeter
                </Button>
              )}
              <Button
                variant="tertiary"
                onClick={() =>
                  navigate(state.profile.securityAlertActive ? '/security/alert' : '/security')
                }
              >
                Details
              </Button>
            </div>
          </section>
        </div>

        {/* Column 2 (5 cols): Daily Energy Load 24h Histogram + Aware Assist + 2x2 Quick Actions */}
        <div className="lg:col-span-5 space-y-5">
          <section className="rounded-xl bg-surface-container border border-outline p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-eyebrow-s text-accent-text">Daily energy load (24h)</div>
                <div className="flex items-baseline gap-2.5 mt-1">
                  <span className="text-title-s font-semibold text-on-surface tabular-nums">
                    {todayKwh.toFixed(1)} kWh
                  </span>
                  <span className="text-text-xs font-semibold text-accent-text tabular-nums">
                    {(totalInstantWatts / 1000).toFixed(2)} kW live
                  </span>
                </div>
              </div>
              <Button variant="tertiary" size="small" onClick={() => navigate('/energy')}>
                Analytics
              </Button>
            </div>

            <div className="h-32 flex items-end gap-1 pt-2">
              {HOURLY_LOAD.map((val, idx) => {
                const heightPct = Math.max(12, Math.round((val / 1.8) * 100));
                const isPeak = idx >= 18 && idx <= 21;
                return (
                  <div
                    key={idx}
                    title={`${String(idx).padStart(2, '0')}:00 — ${val.toFixed(2)} kW`}
                    className={`flex-1 rounded-t-sm transition-colors ${
                      isPeak ? 'bg-error' : 'bg-amplitude-blue hover:bg-blue-on-black'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-text-xxs text-on-surface-variant tabular-nums">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00 Peak</span>
              <span>23:00</span>
            </div>
          </section>

          <section className="rounded-xl bg-surface-container border border-outline p-5 space-y-3">
            <div className="text-eyebrow-s text-accent-text">Aware Assist recommendation</div>
            {activeRec ? (
              <>
                <div className="text-text-m font-semibold text-on-surface">{activeRec.title}</div>
                <p className="text-text-xs font-normal text-on-surface-variant leading-relaxed">
                  {activeRec.description}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-outline">
                  <span className="text-text-xs font-semibold text-accent-text">
                    {activeRec.savingsLabel}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => dismissRecommendation(activeRec.id)}
                    >
                      Dismiss
                    </Button>
                    <Button
                      variant="primary"
                      size="small"
                      onClick={() => applyRecommendation(activeRec)}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-text-xs text-on-surface-variant">
                All current Aware Assist recommendations have been handled.
              </p>
            )}
          </section>

          <section className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={turnOffAllLights}
              className="p-3.5 rounded-xl bg-surface-container border border-outline hover:border-accent-text text-left flex items-center gap-3 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px] text-accent-text">
                light_off
              </span>
              <div>
                <div className="text-text-xs font-semibold text-on-surface">All Lights Off</div>
                <div className="text-text-xxs font-normal text-on-surface-variant tabular-nums">
                  {activeLightsCount} active now
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={lockAllDoors}
              className="p-3.5 rounded-xl bg-surface-container border border-outline hover:border-accent-text text-left flex items-center gap-3 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px] text-accent-text">lock</span>
              <div>
                <div className="text-text-xs font-semibold text-on-surface">Lock All Doors</div>
                <div className="text-text-xxs font-normal text-on-surface-variant">
                  Secure entryways
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setHouseMode('away')}
              className="p-3.5 rounded-xl bg-surface-container border border-outline hover:border-accent-text text-left flex items-center gap-3 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px] text-accent-text">
                directions_walk
              </span>
              <div>
                <div className="text-text-xs font-semibold text-on-surface">Away Eco Profile</div>
                <div className="text-text-xxs font-normal text-on-surface-variant">
                  Arm · 27°C AC
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setHouseMode('night')}
              className="p-3.5 rounded-xl bg-surface-container border border-outline hover:border-accent-text text-left flex items-center gap-3 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px] text-accent-text">
                bedtime
              </span>
              <div>
                <div className="text-text-xs font-semibold text-on-surface">Night Profile</div>
                <div className="text-text-xxs font-normal text-on-surface-variant">
                  Dim 20% · Arm Home
                </div>
              </div>
            </button>
          </section>
        </div>

        {/* Column 3 (3 cols): Active Subsystems + Recent Events */}
        <div className="lg:col-span-3 space-y-5">
          <section className="rounded-xl bg-surface-container border border-outline p-5 space-y-3">
            <h2 className="text-eyebrow-s text-on-surface-variant">Active subsystems</h2>
            <div className="divide-y divide-outline text-text-xs">
              <button
                type="button"
                onClick={() => navigate('/devices?category=lighting')}
                className="w-full py-2.5 flex items-center justify-between hover:text-accent-text transition-colors"
              >
                <span className="flex items-center gap-2 font-medium text-on-surface">
                  <span className="material-symbols-outlined text-[18px] text-accent-text">
                    lightbulb
                  </span>
                  Lighting
                </span>
                <span className="font-semibold text-on-surface tabular-nums">
                  {activeLightsCount}/{totalLightsCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigate(primaryAc ? `/device-detail/${primaryAc.id}` : '/devices')}
                className="w-full py-2.5 flex items-center justify-between hover:text-accent-text transition-colors"
              >
                <span className="flex items-center gap-2 font-medium text-on-surface">
                  <span className="material-symbols-outlined text-[18px] text-accent-text">
                    ac_unit
                  </span>
                  Climate
                </span>
                <span className="font-semibold text-accent-text capitalize">
                  {primaryAc?.isOn ? primaryAc.acMode : 'Off'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/devices')}
                className="w-full py-2.5 flex items-center justify-between hover:text-accent-text transition-colors"
              >
                <span className="flex items-center gap-2 font-medium text-on-surface">
                  <span className="material-symbols-outlined text-[18px] text-accent-text">
                    hub
                  </span>
                  Sim Mesh
                </span>
                <span className="font-semibold text-on-surface tabular-nums">
                  {onlineDevicesCount}/{state.devices.length}
                </span>
              </button>
            </div>
          </section>

          <section className="rounded-xl bg-surface-container border border-outline p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-eyebrow-s text-on-surface-variant">Recent events</h2>
              {state.securityEvents.length > 0 && (
                <Button
                  variant="tertiary-alt"
                  size="small"
                  isDanger
                  onClick={() => setClearLogConfirmOpen(true)}
                >
                  Clear log
                </Button>
              )}
            </div>

            {state.securityEvents.length === 0 ? (
              <p className="text-text-xs text-on-surface-variant py-6 text-center">
                Event log empty.
              </p>
            ) : (
              <div className="divide-y divide-outline">
                {state.securityEvents.slice(0, 6).map((ev) => (
                  <div key={ev.id} className="py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2 text-text-xs">
                      <span className="font-semibold text-on-surface truncate">{ev.title}</span>
                      <span className="text-text-xxs text-on-surface-variant shrink-0 tabular-nums">
                        {ev.timeLabel}
                      </span>
                    </div>
                    <p className="text-text-xs font-normal text-on-surface-variant truncate mt-0.5">
                      {ev.detail}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={disarmConfirmOpen}
        title="Disarm perimeter security?"
        description="Sensors will switch to passive logging mode until re-armed."
        confirmLabel="Disarm"
        tone="warning"
        icon="lock_open"
        onConfirm={async () => {
          await setSecurityMode('disarmed');
          setDisarmConfirmOpen(false);
        }}
        onCancel={() => setDisarmConfirmOpen(false)}
      />

      <ConfirmDialog
        open={clearLogConfirmOpen}
        title="Clear all event logs?"
        description="This removes all recorded security and automation events from the activity feed."
        confirmLabel="Clear log"
        tone="danger"
        icon="delete_sweep"
        onConfirm={async () => {
          await clearSecurityLog();
          setClearLogConfirmOpen(false);
        }}
        onCancel={() => setClearLogConfirmOpen(false)}
      />
    </AppShell>
  );
};
