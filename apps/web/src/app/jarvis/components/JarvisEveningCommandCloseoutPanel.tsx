'use client';

export type JarvisEveningCommandCloseoutPanelProps = {
  readonly date?: string;
  readonly time?: string;
  readonly overallStatus?: 'Green' | 'Amber' | 'Red' | 'requires_review';
  readonly completedToday?: string;
  readonly unresolvedMatters?: string;
  readonly risksCarriedForward?: string;
  readonly tomorrowQueue?: string;
  readonly recommendation?: string;
  readonly closeoutDecision?: 'may_close_stable' | 'requires_attention_before_closeout' | 'blocked';
  readonly runtimeProof?: string | null;
};

export function JarvisEveningCommandCloseoutPanel(props: JarvisEveningCommandCloseoutPanelProps) {
  const rows = [
    ['Date', props.date ?? 'requires_review'],
    ['Time', props.time ?? 'requires_review'],
    ['Overall status', props.overallStatus ?? 'requires_review'],
    ['Completed today', props.completedToday ?? 'not_listed'],
    ['Unresolved matters', props.unresolvedMatters ?? 'not_listed'],
    ['Risks carried forward', props.risksCarriedForward ?? 'not_listed'],
    ['Tomorrow command queue', props.tomorrowQueue ?? 'not_set'],
    ['My recommendation', props.recommendation ?? 'not_set'],
    ['Closeout decision', props.closeoutDecision ?? 'requires_attention_before_closeout'],
    ['Runtime proof', props.runtimeProof ?? 'Runtime proof not captured yet.']
  ] as const;

  return (
    <section aria-label="Jarvis Evening Command Closeout Panel" data-jarvis-panel="evening-command-closeout">
      <header>
        <p>EVENING COMMAND CLOSEOUT</p>
        <h2>Completed Work — Risks Carried Forward — Tomorrow Queue</h2>
      </header>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label} data-jarvis-evening-row={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p>
        Commander, this panel must not invent completed work or hide unresolved matters. Completed work,
        unresolved matters, risks carried forward, tomorrow’s queue, recommendation, closeout decision,
        and proof state must remain visible.
      </p>
    </section>
  );
}

export default JarvisEveningCommandCloseoutPanel;
