import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { AppShell } from '../../components/navigation/AppShell';
import { useHome } from '../../context/HomeContext';

type RuleFilter = 'all' | 'manual' | 'ai';

export const AutomationPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    state,
    toggleAutomation,
    deleteAutomation,
    testAutomationRule,
    applyRecommendation,
    dismissRecommendation,
    requestGeminiRecommendation,
    generatingAi,
  } = useHome();

  const [filter, setFilter] = useState<RuleFilter>('all');
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const activeCount = state.automations.filter((a) => a.enabled).length;
  const routineSuggestion =
    state.recommendations.find((r) => r.status === 'active' && r.category === 'routine') ||
    state.recommendations.find((r) => r.status === 'active');

  const filteredRules = useMemo(() => {
    if (filter === 'all') return state.automations;
    return state.automations.filter((a) => a.source === filter);
  }, [state.automations, filter]);

  return (
    <AppShell
      title="Automation"
      subtitle={`${activeCount} active rule${activeCount === 1 ? '' : 's'}`}
      rightSlot={
        <Button variant="primary" size="small" onClick={() => navigate('/rule-builder')}>
          <span className="material-symbols-outlined text-[15px]">add</span>
          <span>New rule</span>
        </Button>
      }
    >
      <div className="space-y-5 font-gellix">
        {/* Top Heading */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-title-xs font-semibold text-on-surface">Automation rules</h1>
            <p className="text-text-xs text-on-surface-variant mt-0.5 tabular-nums">
              {activeCount} active of {state.automations.length} configured routines
            </p>
          </div>
          <Button
            variant="secondary"
            size="small"
            isLoading={generatingAi}
            onClick={requestGeminiRecommendation}
          >
            <span>{generatingAi ? 'Scanning' : 'Detect routine'}</span>
          </Button>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          {[
            { id: 'all' as const, label: 'All' },
            { id: 'manual' as const, label: 'Manual' },
            { id: 'ai' as const, label: 'Learned by AI' },
          ].map((c) => (
            <Button
              key={c.id}
              variant={filter === c.id ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setFilter(c.id)}
            >
              {c.label}
            </Button>
          ))}
        </div>

        {/* Detected Routine AI Suggestion Card */}
        {routineSuggestion && (
          <section className="rounded-xl bg-surface-container border border-accent-text/40 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 text-eyebrow-s">
              <span className="text-accent-text">Detected routine</span>
              <span className="text-on-surface-variant font-normal">New suggestion</span>
            </div>

            <div>
              <h2 className="text-text-m font-semibold text-on-surface">
                {routineSuggestion.title}
              </h2>
              <p className="text-text-xs font-normal text-on-surface-variant mt-1 leading-relaxed">
                {routineSuggestion.description}
              </p>
              <div className="mt-2 text-text-xs font-semibold text-accent-text tabular-nums">
                {routineSuggestion.savingsLabel} · {routineSuggestion.confidence}% pattern match
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="primary"
                size="small"
                onClick={() => applyRecommendation(routineSuggestion)}
              >
                Accept
              </Button>
              <Button
                variant="secondary"
                size="small"
                onClick={() =>
                  navigate('/rule-builder', {
                    state: { draftFromRecommendation: routineSuggestion },
                  })
                }
              >
                Edit
              </Button>
              <Button
                variant="tertiary-alt"
                size="small"
                onClick={() => dismissRecommendation(routineSuggestion.id)}
                className="ml-auto"
              >
                Ignore
              </Button>
            </div>
          </section>
        )}

        {/* Active Automations List */}
        <section className="space-y-3">
          {filteredRules.length === 0 ? (
            <div className="rounded-xl bg-surface-container border border-outline p-8 text-center">
              <span className="material-symbols-outlined text-[32px] text-on-surface-variant mb-2">
                bolt
              </span>
              <p className="text-text-s font-semibold text-on-surface">No automation rules found</p>
              <Button
                variant="primary"
                className="mt-3"
                onClick={() => navigate('/rule-builder')}
              >
                Create first rule
              </Button>
            </div>
          ) : (
            filteredRules.map((rule) => (
              <div
                key={rule.id}
                className={`rounded-xl bg-surface-container border border-outline p-4 space-y-3 transition-opacity ${
                  rule.enabled ? '' : 'opacity-70'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-high text-accent-text flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">
                        {rule.triggerIcon || 'bolt'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-text-s font-semibold text-on-surface truncate">
                          {rule.name}
                        </h3>
                        <span className="text-text-xs text-accent-text font-medium">
                          · {rule.source === 'ai' ? 'AI learned' : 'Manual'}
                        </span>
                      </div>
                      <p className="text-text-xs font-normal text-on-surface-variant mt-0.5 leading-relaxed">
                        {rule.description}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={rule.enabled}
                    aria-label={`Toggle ${rule.name}`}
                    onClick={() => toggleAutomation(rule.id)}
                    className={`w-12 h-7 rounded-full p-1 transition-colors shrink-0 ${
                      rule.enabled ? 'bg-amplitude-blue' : 'bg-surface-container-highest'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        rule.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="pt-3 border-t border-outline flex flex-wrap items-center justify-between gap-2 text-text-xs text-on-surface-variant">
                  <div className="flex flex-wrap items-center gap-2 tabular-nums">
                    <span>
                      {rule.startTime} – {rule.endTime}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{rule.lastTriggered}</span>
                    {rule.savingsText && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-accent-text font-semibold">{rule.savingsText}</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => testAutomationRule(rule)}
                    >
                      Run test
                    </Button>
                    <Button
                      variant="secondary"
                      size="small"
                      iconOnly
                      onClick={() => navigate(`/rule-builder/${rule.id}`)}
                      aria-label={`Edit ${rule.name}`}
                    >
                      <span className="material-symbols-outlined text-[15px]">edit</span>
                    </Button>
                    <Button
                      variant="secondary"
                      size="small"
                      iconOnly
                      isDanger
                      onClick={() => setDeleteTargetId(rule.id)}
                      aria-label={`Delete ${rule.name}`}
                    >
                      <span className="material-symbols-outlined text-[15px]">delete</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>
      </div>

      <ConfirmDialog
        open={deleteTargetId !== null}
        title="Delete automation rule?"
        description="This rule will be permanently removed and will no longer run automatically."
        confirmLabel="Delete rule"
        tone="danger"
        icon="delete"
        onConfirm={async () => {
          if (deleteTargetId !== null) await deleteAutomation(deleteTargetId);
          setDeleteTargetId(null);
        }}
        onCancel={() => setDeleteTargetId(null)}
      />
    </AppShell>
  );
};
