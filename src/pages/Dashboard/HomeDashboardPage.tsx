import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { AppShell } from '../../components/navigation/AppShell';
import { useHome } from '../../context/HomeContext';
import type { HouseMode } from '../../types/home';
import { formatDateHeader, formatTemp, getGreeting } from '../../utils/format';

const HOUSE_MODES: { id: HouseMode; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'away', label: 'Away', icon: 'directions_walk' },
  { id: 'night', label: 'Night', icon: 'bedtime' },
  { id: 'auto', label: 'Auto', icon: 'auto_awesome' },
];

export const HomeDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    state,
    activeLightsCount,
    totalLightsCount,
    totalInstantWatts,
    todayKwh,
    primaryAc,
    indoorTemp,
    indoorHumidity,
    setHouseMode,
    setSecurityMode,
    turnOffAllLights,
    applyRecommendation,
    dismissRecommendation,
    requestGeminiRecommendation,
    generatingAi,
  } = useHome();

  const firstName = state.profile.displayName.split(' ')[0] || 'Ayush';
  const unit = state.profile.tempUnit;
  const activeSuggestion = state.recommendations.find((r) => r.status === 'active');
  const recentEvents = state.securityEvents.slice(0, 4);

  return (
    <AppShell title="Aware Home" subtitle={state.profile.residenceName} maxWidthClass="max-w-3xl">
      <div className="space-y-5 font-gellix">
        {/* Greeting Header */}
        <section className="flex items-end justify-between gap-3">
          <div>
            <p className="text-text-xs text-on-surface-variant">
              {formatDateHeader()} · {state.profile.residenceName}
            </p>
            <h1 className="text-title-s font-semibold tracking-tight text-on-surface mt-0.5">
              {getGreeting()}, {firstName}
            </h1>
          </div>
          {state.profile.securityAlertActive && (
            <Button
              variant="primary"
              isDanger
              size="small"
              onClick={() => navigate('/security/alert')}
            >
              <span className="material-symbols-outlined text-[15px]">warning</span>
              <span>Alert active</span>
            </Button>
          )}
        </section>

        {/* 4-Tab Mode Selector */}
        <section
          aria-label="House operating mode"
          className="grid grid-cols-4 gap-1 p-1 rounded-lg bg-surface-container-low border border-outline"
        >
          {HOUSE_MODES.map((m) => {
            const selected = state.profile.houseMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setHouseMode(m.id)}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-text-xs font-semibold transition-colors whitespace-nowrap ${
                  selected
                    ? 'bg-amplitude-blue text-white'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{m.icon}</span>
                <span>{m.label}</span>
              </button>
            );
          })}
        </section>

        {/* Indoor Climate Hero Card */}
        <section
          onClick={() => navigate(primaryAc ? `/device-detail/${primaryAc.id}` : '/devices')}
          className="cursor-pointer rounded-xl bg-surface-container border border-outline hover:border-accent-text p-5 transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-eyebrow-s">
                <span className="text-accent-text">Indoor climate</span>
                <span className="text-on-surface-variant font-normal">· Comfort target optimal</span>
              </div>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="text-display-metric text-on-surface tabular-nums">
                  {formatTemp(indoorTemp, unit, 1)}
                </span>
                <span className="text-text-xs text-on-surface-variant tabular-nums">
                  Outdoor {formatTemp(31, unit, 0)}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-surface-container-high border border-outline flex items-center justify-center text-accent-text shrink-0">
              <span className="material-symbols-outlined text-[22px]">thermostat</span>
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-outline flex flex-wrap items-center justify-between gap-2 text-text-xs">
            <div className="flex items-center gap-4 text-on-surface-variant">
              <span>
                Humidity <strong className="text-on-surface font-semibold tabular-nums">{indoorHumidity}%</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Occupancy{' '}
                <strong className="text-on-surface font-semibold">
                  {state.profile.houseMode === 'away' ? 'Empty' : 'Detected'}
                </strong>
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-accent-text font-semibold tabular-nums">
              <span>Target {formatTemp(primaryAc?.targetTemp ?? 24, unit, 1)}</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </span>
          </div>
        </section>

        {/* 3-Column Instrument Grid: Lighting, Climate, Security */}
        <section className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => navigate('/devices?category=lighting')}
            className="text-left rounded-xl bg-surface-container border border-outline hover:border-accent-text p-3.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px] text-accent-text mb-2.5">
              lightbulb
            </span>
            <div className="text-text-xs text-on-surface-variant">Lighting</div>
            <div className="text-text-s font-semibold text-on-surface mt-0.5 tabular-nums">
              {activeLightsCount}/{totalLightsCount} On
            </div>
            <div className="text-text-xxs font-normal text-on-surface-variant mt-0.5 truncate">
              {activeLightsCount > 0 ? 'Adaptive dim' : 'All standby'}
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate(primaryAc ? `/device-detail/${primaryAc.id}` : '/devices')}
            className="text-left rounded-xl bg-surface-container border border-outline hover:border-accent-text p-3.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px] text-accent-text mb-2.5">
              ac_unit
            </span>
            <div className="text-text-xs text-on-surface-variant">Climate</div>
            <div className="text-text-s font-semibold text-on-surface mt-0.5 capitalize">
              {primaryAc?.isOn ? primaryAc.acMode || 'Cool' : 'Standby'}
            </div>
            <div className="text-text-xxs font-normal text-on-surface-variant mt-0.5 truncate tabular-nums">
              {primaryAc?.isOn ? `Set ${formatTemp(primaryAc.targetTemp ?? 24, unit, 1)}` : 'AC Off'}
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              navigate(state.profile.securityAlertActive ? '/security/alert' : '/security')
            }
            className={`text-left rounded-xl border p-3.5 transition-colors ${
              state.profile.securityAlertActive
                ? 'bg-error-container border-error/60'
                : 'bg-surface-container border-outline hover:border-accent-text'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] mb-2.5 ${
                state.profile.securityAlertActive ? 'text-error' : 'text-accent-text'
              }`}
            >
              {state.profile.securityAlertActive ? 'gpp_maybe' : 'verified_user'}
            </span>
            <div className="text-text-xs text-on-surface-variant">Security</div>
            <div className="text-text-s font-semibold text-on-surface mt-0.5 capitalize">
              {state.profile.securityAlertActive
                ? 'Alert'
                : state.profile.securityMode === 'disarmed'
                  ? 'Disarmed'
                  : `Armed ${state.profile.securityMode}`}
            </div>
            <div className="text-text-xxs font-normal text-on-surface-variant mt-0.5 truncate">
              {state.profile.securityAlertActive ? 'Hall motion' : 'All zones clear'}
            </div>
          </button>
        </section>

        {/* Energy Consumption Sparkline Card */}
        <section
          onClick={() => navigate('/energy')}
          className="cursor-pointer rounded-xl bg-surface-container border border-outline hover:border-accent-text p-4 transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-eyebrow-s text-accent-text">Energy consumption today</span>
              <div className="flex items-baseline gap-2.5 mt-1">
                <span className="text-title-xs font-semibold text-on-surface tabular-nums">
                  {todayKwh.toFixed(1)} kWh
                </span>
                <span className="text-text-xs font-semibold text-accent-text tabular-nums">
                  -12% vs typical
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-text-s font-semibold text-on-surface tabular-nums">
                {(totalInstantWatts / 1000).toFixed(2)} kW
              </div>
              <div className="text-text-xs text-on-surface-variant">Live load</div>
            </div>
          </div>

          <div className="mt-3 h-16 w-full relative">
            <svg viewBox="0 0 320 64" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="dashSparkFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" style={{ stopColor: 'var(--color-chart-primary)', stopOpacity: 0.22 }} />
                  <stop offset="100%" style={{ stopColor: 'var(--color-chart-primary)', stopOpacity: 0 }} />
                </linearGradient>
              </defs>
              <path
                d="M 0 50 C 40 46, 65 36, 100 38 C 135 40, 165 22, 200 26 C 235 30, 265 18, 305 16 L 305 64 L 0 64 Z"
                fill="url(#dashSparkFill)"
              />
              <path
                d="M 0 50 C 40 46, 65 36, 100 38 C 135 40, 165 22, 200 26 C 235 30, 265 18, 305 16"
                fill="none"
                stroke="var(--color-chart-primary)"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <circle cx="305" cy="16" r="4" fill="var(--color-chart-primary)" />
            </svg>
          </div>
        </section>

        {/* Aware Assist AI Suggestion Card */}
        <section className="rounded-xl bg-surface-container border border-outline p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-eyebrow-s text-accent-text">Aware Assist</div>
              <div className="text-text-xs text-on-surface-variant mt-0.5">
                Context-aware schedule recommendation
              </div>
            </div>
            <Button
              variant="secondary"
              size="small"
              isLoading={generatingAi}
              onClick={requestGeminiRecommendation}
            >
              <span>{generatingAi ? 'Analyzing' : 'Refresh'}</span>
            </Button>
          </div>

          {activeSuggestion ? (
            <>
              <h3 className="text-text-m font-semibold text-on-surface mt-3">
                {activeSuggestion.title}
              </h3>
              <p className="text-text-xs font-normal text-on-surface-variant mt-1 leading-relaxed">
                {activeSuggestion.description}
              </p>
              <div className="mt-3.5 pt-3 border-t border-outline flex flex-wrap items-center justify-between gap-2">
                <span className="text-text-xs font-semibold text-accent-text tabular-nums">
                  {activeSuggestion.savingsLabel} · {activeSuggestion.confidence}% confidence
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => dismissRecommendation(activeSuggestion.id)}
                  >
                    Dismiss
                  </Button>
                  <Button
                    variant="primary"
                    size="small"
                    onClick={() => applyRecommendation(activeSuggestion)}
                  >
                    Apply schedule
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <p className="mt-3 text-text-xs text-on-surface-variant">
              All active recommendations handled. Select Refresh to run a new analysis.
            </p>
          )}
        </section>

        {/* 4-Column Quick Controls */}
        <section>
          <h2 className="text-eyebrow-s text-on-surface-variant mb-2.5">Quick controls</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={turnOffAllLights}
              className="flex items-center sm:flex-col sm:items-start gap-2.5 p-3.5 rounded-xl bg-surface-container border border-outline hover:border-accent-text transition-colors"
            >
              <span className="material-symbols-outlined text-[20px] text-accent-text">
                light_off
              </span>
              <span className="text-text-xs font-semibold text-on-surface">All Lights Off</span>
            </button>
            <button
              type="button"
              onClick={() => setHouseMode('away')}
              className="flex items-center sm:flex-col sm:items-start gap-2.5 p-3.5 rounded-xl bg-surface-container border border-outline hover:border-accent-text transition-colors"
            >
              <span className="material-symbols-outlined text-[20px] text-accent-text">
                directions_walk
              </span>
              <span className="text-text-xs font-semibold text-on-surface">Away Mode</span>
            </button>
            <button
              type="button"
              onClick={() => setHouseMode('night')}
              className="flex items-center sm:flex-col sm:items-start gap-2.5 p-3.5 rounded-xl bg-surface-container border border-outline hover:border-accent-text transition-colors"
            >
              <span className="material-symbols-outlined text-[20px] text-accent-text">
                bedtime
              </span>
              <span className="text-text-xs font-semibold text-on-surface">Night Mode</span>
            </button>
            <button
              type="button"
              onClick={() => setSecurityMode('away')}
              className="flex items-center sm:flex-col sm:items-start gap-2.5 p-3.5 rounded-xl bg-surface-container border border-outline hover:border-accent-text transition-colors"
            >
              <span className="material-symbols-outlined text-[20px] text-accent-text">shield</span>
              <span className="text-text-xs font-semibold text-on-surface">Arm System</span>
            </button>
          </div>
        </section>

        {/* Recent Activity Feed */}
        <section className="rounded-xl bg-surface-container border border-outline p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-text-s font-semibold text-on-surface">Recent activity</h2>
            <Button variant="tertiary" size="small" onClick={() => navigate('/security')}>
              View log
            </Button>
          </div>
          {recentEvents.length === 0 ? (
            <p className="text-text-xs text-on-surface-variant py-3 text-center">
              No recent activity recorded.
            </p>
          ) : (
            <div className="divide-y divide-outline">
              {recentEvents.map((ev) => (
                <div key={ev.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      ev.severity === 'critical'
                        ? 'bg-error/10 text-error'
                        : 'bg-surface-container-high text-accent-text'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[17px]">{ev.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-text-xs font-semibold text-on-surface truncate">
                      {ev.title}
                    </div>
                    <div className="text-text-xs font-normal text-on-surface-variant truncate">
                      {ev.detail}
                    </div>
                  </div>
                  <span className="text-text-xs text-on-surface-variant shrink-0 tabular-nums">
                    {ev.timeLabel}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
};
