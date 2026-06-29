'use client';

export type JarvisSystemStablePanelProps = {
  readonly matter?: string;
  readonly stabilityEvidence?: string;
  readonly openRisks?: string;
  readonly monitoringState?: 'not_checked' | 'active' | 'partial' | 'blocked';
  readonly interventionDecision?: 'none_required' | 'watch' | 'required' | 'blocked';
  readonly controlledProgress?: string;
  readonly nextReviewCommand?: string;
  readonly runtimeProof?: string | null;
};

export function JarvisSystemStablePanel(props: JarvisSystemStablePanelProps) {
  const rows = [
    ['Matter', props.matter ?? 'not_selected'],
    ['Stability evidence', props.stabilityEvidence ?? 'not_listed'],
    ['Open risks', props.openRisks ?? 'not_listed'],
    ['Monitoring state', props.monitoringState ?? 'not_checked'],
    ['Intervention decision', props.interventionDecision ?? 'none_required'],
    ['Controlled progress', props.controlledProgress ?? 'not_set'],
    ['Next review command', props.nextReviewCommand ?? 'not_set'],
    ['Runtime proof', props.runtimeProof ?? 'Runtime proof not captured yet.']
  ] as const;

  return (
    <section aria-label="Jarvis System Stable Panel" data-jarvis-panel="system-stable">
      <header>
        <p>SYSTEM STABLE</p>
        <h2>Observation — Controlled Progress</h2>
      </header>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label} data-jarvis-stable-row={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p>
        Commander, this panel must not invent urgency when the position is stable. Stability evidence,
        open risks, monitoring state, controlled progress, and runtime proof must remain visible.
      </p>
    </section>
  );
}

export default JarvisSystemStablePanel;
