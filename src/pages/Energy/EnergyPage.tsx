import React, { useMemo, useState } from 'react';
import { Button } from '../../components/common/Button';
import { AppShell } from '../../components/navigation/AppShell';
import { useHome } from '../../context/HomeContext';
import type { EnergyPeriod } from '../../types/home';

export const EnergyPage: React.FC = () => {
  const {
    state,
    totalInstantWatts,
    applyRecommendation,
    requestGeminiRecommendation,
    generatingAi,
  } = useHome();

  const [period, setPeriod] = useState<EnergyPeriod>('week');
  const [selectedBarIdx, setSelectedBarIdx] = useState<number | null>(null);

  const periodPoints = useMemo(() => {
    const basePoints = state.energyLogs
      .filter((e) => e.period === period)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    if (basePoints.length === 0) return basePoints;
    const liveDeltaKwh = ((totalInstantWatts - 1018) / 1000) * (period === 'day' ? 1.5 : 2.5);
    return basePoints.map((pt, idx) =>
      idx === basePoints.length - 1
        ? {
            ...pt,
            actualKwh: Math.max(0.2, Math.round((pt.actualKwh + liveDeltaKwh) * 10) / 10),
          }
        : pt
    );
  }, [state.energyLogs, period, totalInstantWatts]);

  const metrics = useMemo(() => {
    const totalActual = periodPoints.reduce((s, p) => s + p.actualKwh, 0);
    const totalBaseline = periodPoints.reduce((s, p) => s + p.baselineKwh, 0);
    const savedPct =
      totalBaseline > 0
        ? Math.max(0, Math.round(((totalBaseline - totalActual) / totalBaseline) * 100))
        : 15;
    const avgTariff = state.profile.tariffBase * 0.65 + state.profile.tariffPeak * 0.35;
    const estSpend = Math.round(totalActual * avgTariff);
    const maxVal = Math.max(...periodPoints.map((p) => Math.max(p.actualKwh, p.baselineKwh)), 1);
    return { totalActual, totalBaseline, savedPct, estSpend, maxVal };
  }, [periodPoints, state.profile.tariffBase, state.profile.tariffPeak]);

  const rankedDevices = useMemo(() => {
    const sorted = [...state.devices]
      .filter((d) => d.weeklyKwh > 0)
      .sort((a, b) => b.weeklyKwh - a.weeklyKwh)
      .slice(0, 5);
    const maxKwh = sorted[0]?.weeklyKwh || 1;
    const scale = period === 'day' ? 1 / 7 : period === 'month' ? 4 : 1;
    return sorted.map((d) => ({
      ...d,
      scaledKwh: Math.round(d.weeklyKwh * scale * 10) / 10,
      pct: Math.round((d.weeklyKwh / maxKwh) * 100),
    }));
  }, [state.devices, period]);

  // Amplitude chart tokens via CSS variables (secondary palette used only for chart segments, never text)
  const categoryBreakdown = useMemo(() => {
    const totals = { climate: 0, lighting: 0, appliance: 0, security: 0 };
    for (const d of state.devices) {
      totals[d.category] = (totals[d.category] || 0) + d.weeklyKwh;
    }
    const grand = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
    return [
      {
        key: 'climate',
        label: 'Climate',
        colorVar: 'var(--color-chart-cat-1)',
        pct: Math.round((totals.climate / grand) * 100),
      },
      {
        key: 'appliance',
        label: 'Appliances',
        colorVar: 'var(--color-chart-cat-2)',
        pct: Math.round((totals.appliance / grand) * 100),
      },
      {
        key: 'lighting',
        label: 'Lighting',
        colorVar: 'var(--color-chart-cat-3)',
        pct: Math.round((totals.lighting / grand) * 100),
      },
      {
        key: 'security',
        label: 'Security',
        colorVar: 'var(--color-chart-cat-4)',
        pct: Math.max(4, Math.round((totals.security / grand) * 100)),
      },
    ];
  }, [state.devices]);

  const energyRecommendations = state.recommendations
    .filter((r) => r.status === 'active')
    .slice(0, 2);

  return (
    <AppShell
      title="Energy"
      subtitle={`Live load ${(totalInstantWatts / 1000).toFixed(2)} kW`}
    >
      <div className="space-y-5 font-gellix">
        {/* Period Segmented Filter */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-surface-container-low border border-outline">
          {(['day', 'week', 'month'] as EnergyPeriod[]).map((p) => {
            const active = period === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setPeriod(p);
                  setSelectedBarIdx(null);
                }}
                className={`py-2 rounded-lg text-text-xs font-semibold capitalize transition-colors ${
                  active
                    ? 'bg-amplitude-blue text-white'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Hero Metric Card */}
        <section className="rounded-xl bg-surface-container border border-outline p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-eyebrow-s text-accent-text capitalize">
                {period} consumption
              </span>
              <div className="flex items-baseline gap-2.5 mt-1">
                <span className="text-display-metric-sm text-on-surface tabular-nums">
                  {metrics.totalActual.toFixed(1)} kWh
                </span>
                <span className="text-text-xs font-semibold text-accent-text tabular-nums">
                  {metrics.savedPct}% saved
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-text-xs text-on-surface-variant">Est. spend</div>
              <div className="text-title-xs font-semibold text-on-surface tabular-nums">
                ₹{metrics.estSpend}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-outline flex flex-wrap items-center justify-between gap-2 text-text-xs">
            <span className="text-on-surface-variant tabular-nums">
              Live draw{' '}
              <strong className="text-on-surface font-semibold">
                {(totalInstantWatts / 1000).toFixed(2)} kW
              </strong>{' '}
              · Off-peak share <strong className="text-on-surface font-semibold">68%</strong>
            </span>
            <span className="text-accent-text font-semibold tabular-nums">
              ₹{state.profile.tariffBase.toFixed(1)} base rate
            </span>
          </div>
        </section>

        {/* Consumption Bar Chart */}
        <section className="rounded-xl bg-surface-container border border-outline p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-text-s font-semibold text-on-surface">Actual vs baseline</h2>
              <p className="text-text-xs text-on-surface-variant tabular-nums">
                {selectedBarIdx !== null && periodPoints[selectedBarIdx]
                  ? `${periodPoints[selectedBarIdx].label}: ${periodPoints[selectedBarIdx].actualKwh} kWh actual vs ${periodPoints[selectedBarIdx].baselineKwh} kWh typical`
                  : 'Select any bar to inspect consumption'}
              </p>
            </div>
            <div className="flex items-center gap-3 text-text-xxs text-on-surface-variant shrink-0">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-amplitude-blue" />
                Actual
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-surface-container-highest" />
                Baseline
              </span>
            </div>
          </div>

          <div className="h-44 flex items-end justify-between gap-2 pt-4">
            {periodPoints.map((pt, idx) => {
              const actualH = Math.max(8, Math.round((pt.actualKwh / metrics.maxVal) * 124));
              const baseH = Math.max(8, Math.round((pt.baselineKwh / metrics.maxVal) * 124));
              const isSelected = selectedBarIdx === idx;
              return (
                <button
                  key={pt.id}
                  type="button"
                  onClick={() => setSelectedBarIdx(idx)}
                  className="flex-1 flex flex-col items-center gap-1.5 group focus:outline-none"
                >
                  <div className="w-full flex items-end justify-center gap-1 h-[132px]">
                    <div
                      className="w-2.5 sm:w-3 rounded-t bg-surface-container-highest transition-all"
                      style={{ height: `${baseH}px` }}
                    />
                    <div
                      className={`w-2.5 sm:w-3 rounded-t transition-all ${
                        isSelected
                          ? 'bg-lilac'
                          : 'bg-amplitude-blue group-hover:bg-blue-on-black'
                      }`}
                      style={{ height: `${actualH}px` }}
                    />
                  </div>
                  <span
                    className={`text-text-xxs ${
                      isSelected ? 'text-accent-text' : 'text-on-surface-variant'
                    }`}
                  >
                    {pt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Consumption by Category Donut + Legend */}
        <section className="rounded-xl bg-surface-container border border-outline p-4">
          <h2 className="text-text-s font-semibold text-on-surface mb-4">
            Consumption by category
          </h2>
          <div className="flex items-center gap-6">
            <div className="relative w-28 h-28 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {(() => {
                  const r = 38;
                  const circ = 2 * Math.PI * r;
                  let offset = 0;
                  return categoryBreakdown.map((item) => {
                    const segLen = (item.pct / 100) * circ;
                    const el = (
                      <circle
                        key={item.key}
                        cx="50"
                        cy="50"
                        r={r}
                        fill="none"
                        stroke={item.colorVar}
                        strokeWidth="12"
                        strokeDasharray={`${Math.max(4, segLen - 2)} ${circ}`}
                        strokeDashoffset={-offset}
                      />
                    );
                    offset += segLen;
                    return el;
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-text-xs font-semibold text-on-surface tabular-nums">
                  {categoryBreakdown[0]?.pct}%
                </span>
                <span className="text-text-xxs font-normal text-on-surface-variant">Climate</span>
              </div>
            </div>

            <div className="flex-1 space-y-2.5">
              {categoryBreakdown.map((item) => (
                <div key={item.key} className="flex items-center justify-between text-text-xs">
                  <span className="flex items-center gap-2 text-on-surface">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.colorVar }}
                    />
                    {item.label}
                  </span>
                  <span className="font-semibold text-on-surface tabular-nums">{item.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Device Power Ranking */}
        <section className="rounded-xl bg-surface-container border border-outline p-4 space-y-3">
          <h2 className="text-text-s font-semibold text-on-surface">Device power ranking</h2>
          <div className="space-y-3">
            {rankedDevices.map((d) => (
              <div key={d.id} className="space-y-1">
                <div className="flex items-center justify-between text-text-xs">
                  <span className="font-medium text-on-surface truncate pr-2">{d.name}</span>
                  <span className="text-on-surface-variant tabular-nums shrink-0">
                    {d.scaledKwh} kWh ({d.isOn ? `${d.powerWatts}W` : 'Off'})
                  </span>
                </div>
                <div className="h-2 rounded-full bg-surface-container-highest overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amplitude-blue transition-all"
                    style={{ width: `${d.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AI Tariff Optimization Cards */}
        <section className="rounded-xl bg-surface-container border border-outline p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-eyebrow-s text-accent-text">AI tariff optimization</div>
              <p className="text-text-xs text-on-surface-variant">
                Shift heavy loads to off-peak hours
              </p>
            </div>
            <Button
              variant="secondary"
              size="small"
              isLoading={generatingAi}
              onClick={requestGeminiRecommendation}
            >
              {generatingAi ? 'Analyzing' : 'Analyze'}
            </Button>
          </div>

          {energyRecommendations.length === 0 ? (
            <p className="text-text-xs text-on-surface-variant">
              All optimizations applied. Select Analyze for a fresh tariff review.
            </p>
          ) : (
            <div className="divide-y divide-outline">
              {energyRecommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="py-3 first:pt-1 last:pb-0 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-text-xs font-semibold text-on-surface">{rec.title}</div>
                    <p className="text-text-xs font-normal text-on-surface-variant mt-0.5 leading-relaxed">
                      {rec.description}
                    </p>
                    <span className="inline-block mt-1 text-text-xs font-semibold text-accent-text">
                      {rec.savingsLabel}
                    </span>
                  </div>
                  <Button
                    variant="primary"
                    size="small"
                    onClick={() => applyRecommendation(rec)}
                  >
                    Apply
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Tomorrow's Schedule 24h Tariff Ribbon */}
        <section className="rounded-xl bg-surface-container border border-outline p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-text-s font-semibold text-on-surface">
              Tomorrow&apos;s tariff schedule
            </h2>
            <span className="text-text-xs text-on-surface-variant">24h grid matrix</span>
          </div>

          <div className="h-2.5 rounded-full overflow-hidden flex">
            <div className="w-[33%] bg-amplitude-blue" title="Off-Peak 00:00-08:00" />
            <div className="w-[42%] bg-lilac" title="Mid 08:00-18:00" />
            <div className="w-[17%] bg-error" title="Peak 18:00-22:00" />
            <div className="w-[8%] bg-amplitude-blue" title="Off-Peak 22:00-24:00" />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-text-xs text-on-surface-variant tabular-nums">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amplitude-blue" />
              Off-Peak ₹{state.profile.tariffBase.toFixed(1)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-lilac" />
              Mid ₹{((state.profile.tariffBase + state.profile.tariffPeak) / 2).toFixed(1)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-error" />
              Peak ₹{state.profile.tariffPeak.toFixed(1)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-outline">
            {[
              { name: 'AC Master', window: '17:30 Pre-cool', badge: 'Eco shift' },
              { name: 'Boiler', window: '05:30 – 06:30', badge: 'Off-peak' },
              { name: 'Lighting', window: '19:00 Adaptive', badge: 'Auto dim' },
            ].map((b) => (
              <div key={b.name} className="p-2">
                <div className="text-text-xs font-semibold text-on-surface">{b.name}</div>
                <div className="text-text-xxs font-normal text-on-surface-variant mt-0.5 tabular-nums">
                  {b.window}
                </div>
                <div className="mt-1 text-text-xxs font-semibold text-accent-text">{b.badge}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
};
