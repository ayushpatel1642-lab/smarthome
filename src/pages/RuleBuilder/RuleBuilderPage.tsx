import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { AppShell } from '../../components/navigation/AppShell';
import { useHome } from '../../context/HomeContext';
import type { AiRecommendation, RuleAction, RuleCondition, RulePriority } from '../../types/home';

const TRIGGERS = [
  { type: 'presence', label: 'Presence — Everyone Leaves', icon: 'directions_walk', zone: 'Whole Residence Geofence' },
  { type: 'schedule', label: 'Time Schedule — Evening Peak', icon: 'schedule', zone: 'All Tariff Zones' },
  { type: 'motion', label: 'Motion Sensor — Hallway Radar', icon: 'sensors', zone: 'Hallway & Entry' },
  { type: 'temperature', label: 'Temperature Ambient > 27°C', icon: 'thermostat', zone: 'Living Room' },
  { type: 'tariff', label: 'Grid Energy Tariff — Off-Peak Window', icon: 'bolt', zone: 'Utility Meter' },
];

const CONDITION_PRESETS: Omit<RuleCondition, 'id'>[] = [
  {
    label: 'Perimeter Doors Closed',
    detail: 'All entry contact sensors report Closed',
    icon: 'sensor_door',
    metric: 'doors',
    operator: '==',
    value: 'closed',
  },
  {
    label: 'Outdoor Temp Above 28°C',
    detail: 'Weather sensor indicates warm afternoon',
    icon: 'wb_sunny',
    metric: 'outdoor_temp',
    operator: '>',
    value: '28C',
  },
  {
    label: 'Tariff Window Off-Peak',
    detail: 'Grid rate below ₹5.00/kWh',
    icon: 'electric_meter',
    metric: 'tariff',
    operator: '<',
    value: '5.0',
  },
];

const ACTION_PRESETS: Omit<RuleAction, 'id'>[] = [
  {
    label: 'Arm Security to Away',
    detail: 'Engage perimeter sensors & lock deadbolts',
    icon: 'shield',
    endIcon: 'lock',
    actionType: 'arm_security',
    payload: { mode: 'away' },
  },
  {
    label: 'Set Smart AC to 26.5°C Eco',
    detail: 'Reduce compressor peak draw',
    icon: 'ac_unit',
    endIcon: 'eco',
    actionType: 'set_temp',
    payload: { temp: 26.5 },
  },
  {
    label: 'Switch Off All Lights',
    detail: 'Power down all active lighting fixtures',
    icon: 'light_off',
    endIcon: 'power_settings_new',
    actionType: 'lights_off',
    payload: { all: true },
  },
  {
    label: 'Lock All Entry Doors',
    detail: 'Engage smart locks across entryways',
    icon: 'lock',
    endIcon: 'verified_user',
    actionType: 'lock_doors',
    payload: { locked: true },
  },
];

const DAYS = [
  { key: 'Mon', short: 'M' },
  { key: 'Tue', short: 'T' },
  { key: 'Wed', short: 'W' },
  { key: 'Thu', short: 'T' },
  { key: 'Fri', short: 'F' },
  { key: 'Sat', short: 'S' },
  { key: 'Sun', short: 'S' },
];

export const RuleBuilderPage: React.FC = () => {
  const { ruleId } = useParams<{ ruleId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { state, saveAutomation, testAutomationRule, showToast } = useHome();

  const existing = ruleId ? state.automations.find((a) => String(a.id) === ruleId) : undefined;
  const draft = !existing
    ? ((location.state as { draftFromRecommendation?: AiRecommendation } | null)
        ?.draftFromRecommendation ?? undefined)
    : undefined;

  const initialTriggerFromDraft = (() => {
    if (!draft) return 'presence';
    if (draft.category === 'energy') return 'tariff';
    if (draft.category === 'climate') return 'temperature';
    return 'schedule';
  })();

  const initialActionsFromDraft = (): RuleAction[] => {
    if (!draft) {
      return [
        { id: 'a-1', ...ACTION_PRESETS[0] },
        { id: 'a-2', ...ACTION_PRESETS[1] },
      ];
    }
    const payloadType = String(draft.actionPayload?.type ?? '');
    if (
      draft.category === 'climate' ||
      draft.category === 'energy' ||
      payloadType.includes('ac') ||
      payloadType.includes('temp') ||
      draft.actionPayload?.targetTemp !== undefined
    ) {
      const targetTemp = Number(draft.actionPayload?.targetTemp ?? draft.actionPayload?.temp ?? 25);
      return [
        {
          id: 'a-draft-1',
          label: `Set Smart AC to ${targetTemp}°C Eco`,
          detail: draft.description,
          icon: 'ac_unit',
          endIcon: 'eco',
          actionType: 'set_temp',
          payload: { temp: targetTemp },
        },
      ];
    }
    if (payloadType.includes('night') || payloadType.includes('security')) {
      return [
        { id: 'a-draft-1', ...ACTION_PRESETS[0] },
        { id: 'a-draft-2', ...ACTION_PRESETS[2] },
      ];
    }
    return [
      { id: 'a-draft-1', ...ACTION_PRESETS[1] },
      { id: 'a-draft-2', ...ACTION_PRESETS[2] },
    ];
  };

  const [name, setName] = useState(existing?.name || draft?.title || 'Away Eco & Perimeter Lock');
  const [triggerType, setTriggerType] = useState(existing?.triggerType || initialTriggerFromDraft);
  const [conditions, setConditions] = useState<RuleCondition[]>(
    existing?.conditions?.length
      ? existing.conditions
      : [{ id: 'c-1', ...CONDITION_PRESETS[0] }]
  );
  const [actions, setActions] = useState<RuleAction[]>(
    existing?.actions?.length ? existing.actions : initialActionsFromDraft()
  );
  const [days, setDays] = useState<string[]>(
    existing?.days?.length ? existing.days : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  );
  const [startTime, setStartTime] = useState(
    existing?.startTime || (draft?.category === 'energy' ? '18:00' : '08:00')
  );
  const [endTime, setEndTime] = useState(existing?.endTime || '22:00');
  const [priority, setPriority] = useState<RulePriority>(existing?.priority || 'Normal');
  const [showCondPicker, setShowCondPicker] = useState(false);
  const [showActPicker, setShowActPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedTrigger = TRIGGERS.find((t) => t.type === triggerType) || TRIGGERS[0];

  const conflictingRule = state.automations.find(
    (r) =>
      r.id !== existing?.id &&
      r.enabled &&
      r.triggerType === triggerType &&
      r.priority === priority
  );

  const toggleDay = (dayKey: string) => {
    setDays((prev) =>
      prev.includes(dayKey) ? prev.filter((d) => d !== dayKey) : [...prev, dayKey]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('Enter a rule name.', 'warning');
      return;
    }
    if (actions.length === 0) {
      showToast('Add at least one THEN action before saving.', 'warning');
      return;
    }
    setSaving(true);
    const saved = await saveAutomation(
      {
        name: name.trim(),
        description: `${selectedTrigger.label} → ${actions.map((a) => a.label).join(', ')}`,
        source: existing?.source || (draft ? 'ai' : 'manual'),
        enabled: existing?.enabled ?? true,
        triggerType: selectedTrigger.type,
        triggerLabel: selectedTrigger.label,
        triggerIcon: selectedTrigger.icon,
        conditions,
        actions,
        days: days.length > 0 ? days : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        startTime,
        endTime,
        priority,
        zoneLabel: selectedTrigger.zone,
      },
      existing?.id
    );
    setSaving(false);
    if (saved) {
      navigate('/automation');
    }
  };

  return (
    <AppShell
      headerMode="stack"
      title={existing ? 'Edit rule' : 'Rule builder'}
      subtitle="IF / AND / THEN logic"
      backTo="/automation"
      hideBottomNav
      rightSlot={
        <Button
          variant="secondary"
          iconOnly
          onClick={() => navigate('/automation')}
          aria-label="Close rule builder"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </Button>
      }
    >
      <div className="space-y-4 pb-24 font-gellix">
        {/* Rule Name Input */}
        <section className="rounded-xl bg-surface-container border border-outline p-4">
          <label htmlFor="rule-name" className="block text-eyebrow-s text-on-surface-variant mb-2">
            Rule name
          </label>
          <input
            id="rule-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Night Eco Cooling"
            className="w-full h-10 px-3.5 rounded-lg bg-surface border border-outline text-text-s font-normal text-on-surface focus:outline-none focus:border-accent-text"
          />
        </section>

        {/* Block 1: IF (Trigger) */}
        <section className="rounded-xl bg-surface-container border border-outline p-4 space-y-3">
          <div className="flex items-center justify-between text-eyebrow-s">
            <span className="text-accent-text">IF (Trigger)</span>
            <span className="text-on-surface-variant font-normal">Event source</span>
          </div>

          <select
            value={triggerType}
            onChange={(e) => setTriggerType(e.target.value)}
            aria-label="Select trigger type"
            className="w-full h-10 px-3.5 rounded-lg bg-surface border border-outline text-text-s font-medium text-on-surface focus:outline-none focus:border-accent-text"
          >
            {TRIGGERS.map((t) => (
              <option key={t.type} value={t.type}>
                {t.label}
              </option>
            ))}
          </select>

          <div className="flex items-center justify-between pt-2 border-t border-outline text-text-xs">
            <span className="text-on-surface-variant">Target zone</span>
            <span className="font-semibold text-on-surface">{selectedTrigger.zone}</span>
          </div>
        </section>

        <div className="flex justify-center -my-1">
          <span className="material-symbols-outlined text-[18px] text-accent-text">
            arrow_downward
          </span>
        </div>

        {/* Block 2: AND (Condition) */}
        <section className="rounded-xl bg-surface-container border border-outline p-4 space-y-3">
          <div className="flex items-center justify-between text-eyebrow-s">
            <span className="text-accent-text">AND (Condition)</span>
            <span className="text-on-surface-variant font-normal">Optional guards</span>
          </div>

          <div className="divide-y divide-outline">
            {conditions.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="material-symbols-outlined text-[18px] text-accent-text">
                    {c.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="text-text-xs font-semibold text-on-surface truncate">
                      {c.label}
                    </div>
                    <div className="text-text-xs font-normal text-on-surface-variant truncate">
                      {c.detail}
                    </div>
                  </div>
                </div>
                <Button
                  variant="tertiary-alt"
                  size="small"
                  iconOnly
                  onClick={() => setConditions((prev) => prev.filter((item) => item.id !== c.id))}
                  aria-label={`Remove ${c.label}`}
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </Button>
              </div>
            ))}
          </div>

          {showCondPicker ? (
            <div className="p-2 rounded-lg bg-surface border border-outline space-y-1">
              {CONDITION_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setConditions((prev) => [...prev, { id: `c-${Date.now()}`, ...preset }]);
                    setShowCondPicker(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-container-high text-text-xs flex items-center gap-2.5"
                >
                  <span className="material-symbols-outlined text-[16px] text-accent-text">
                    {preset.icon}
                  </span>
                  <div>
                    <div className="font-semibold text-on-surface">{preset.label}</div>
                    <div className="text-on-surface-variant font-normal">{preset.detail}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowCondPicker(true)}
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Add another condition</span>
            </Button>
          )}
        </section>

        <div className="flex justify-center -my-1">
          <span className="material-symbols-outlined text-[18px] text-accent-text">
            arrow_downward
          </span>
        </div>

        {/* Block 3: THEN (Action) */}
        <section className="rounded-xl bg-surface-container border border-outline p-4 space-y-3">
          <div className="flex items-center justify-between text-eyebrow-s">
            <span className="text-accent-text">THEN (Action)</span>
            <span className="text-on-surface-variant font-normal tabular-nums">
              {actions.length} selected
            </span>
          </div>

          <div className="divide-y divide-outline">
            {actions.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="material-symbols-outlined text-[18px] text-accent-text">
                    {a.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="text-text-xs font-semibold text-on-surface truncate">
                      {a.label}
                    </div>
                    <div className="text-text-xs font-normal text-on-surface-variant truncate">
                      {a.detail}
                    </div>
                  </div>
                </div>
                <Button
                  variant="tertiary-alt"
                  size="small"
                  iconOnly
                  onClick={() => setActions((prev) => prev.filter((item) => item.id !== a.id))}
                  aria-label={`Remove ${a.label}`}
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </Button>
              </div>
            ))}
          </div>

          {showActPicker ? (
            <div className="p-2 rounded-lg bg-surface border border-outline space-y-1">
              {ACTION_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setActions((prev) => [...prev, { id: `a-${Date.now()}`, ...preset }]);
                    setShowActPicker(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-container-high text-text-xs flex items-center gap-2.5"
                >
                  <span className="material-symbols-outlined text-[16px] text-accent-text">
                    {preset.icon}
                  </span>
                  <div>
                    <div className="font-semibold text-on-surface">{preset.label}</div>
                    <div className="text-on-surface-variant font-normal">{preset.detail}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <Button variant="secondary" fullWidth onClick={() => setShowActPicker(true)}>
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Add action</span>
            </Button>
          )}
        </section>

        {/* Schedule & Active Days */}
        <section className="rounded-xl bg-surface-container border border-outline p-4 space-y-4">
          <h3 className="text-eyebrow-s text-on-surface-variant">Schedule & active days</h3>

          <div className="grid grid-cols-7 gap-1.5">
            {DAYS.map((d) => {
              const active = days.includes(d.key);
              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => toggleDay(d.key)}
                  aria-pressed={active}
                  className={`h-9 rounded-lg text-text-xs font-semibold border transition-colors ${
                    active
                      ? 'bg-amplitude-blue text-white border-amplitude-blue'
                      : 'bg-surface border-outline text-on-surface-variant'
                  }`}
                >
                  {d.short}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-eyebrow-s text-on-surface-variant mb-1">Start</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-surface border border-outline text-text-s text-on-surface tabular-nums"
              />
            </div>
            <div>
              <label className="block text-eyebrow-s text-on-surface-variant mb-1">End</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-surface border border-outline text-text-s text-on-surface tabular-nums"
              />
            </div>
          </div>
        </section>

        {/* Rule Execution Priority */}
        <section className="rounded-xl bg-surface-container border border-outline p-4 space-y-2.5">
          <h3 className="text-eyebrow-s text-on-surface-variant">Rule execution priority</h3>
          <div className="grid grid-cols-3 gap-2">
            {(['Low', 'Normal', 'High'] as RulePriority[]).map((p) => (
              <Button
                key={p}
                variant={priority === p ? 'primary' : 'secondary'}
                onClick={() => setPriority(p)}
              >
                {p}
              </Button>
            ))}
          </div>
        </section>

        {/* Conflict Guard Banner */}
        <section
          className={`rounded-xl bg-surface-container border p-4 flex items-start gap-3 ${
            conflictingRule ? 'border-error/60' : 'border-outline'
          }`}
        >
          <span
            className={`material-symbols-outlined text-[20px] shrink-0 mt-0.5 ${
              conflictingRule ? 'text-error' : 'text-accent-text'
            }`}
          >
            {conflictingRule ? 'warning' : 'verified'}
          </span>
          <div className="text-text-xs">
            <div className="font-semibold text-on-surface">
              {conflictingRule ? 'Priority overlap detected' : 'Conflict guard active'}
            </div>
            <p className="text-on-surface-variant font-normal mt-0.5 leading-relaxed">
              {conflictingRule
                ? `"${conflictingRule.name}" shares the same trigger and priority. Raise priority to High if this rule should take precedence.`
                : 'No scheduling overlap detected. Higher priority rules override lower priority actions when triggered simultaneously.'}
            </p>
          </div>
        </section>

        {/* Sticky Bottom Dock */}
        <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-surface/95 backdrop-blur-md border-t border-outline p-4">
          <div className="max-w-3xl mx-auto grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              fullWidth
              className="h-10"
              onClick={() =>
                testAutomationRule({ id: existing?.id, name: name || 'Untitled Rule', actions })
              }
            >
              <span className="material-symbols-outlined text-[18px] text-accent-text">
                play_arrow
              </span>
              <span>Test rule</span>
            </Button>
            <Button
              variant="primary"
              fullWidth
              isLoading={saving}
              onClick={handleSave}
              className="h-10 font-semibold"
            >
              <span>{saving ? 'Saving...' : 'Save rule'}</span>
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
};
