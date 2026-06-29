'use client';

export type JarvisStrategyCommandPanelProps = {
  readonly objective?: string;
  readonly sourceState?: 'not_checked' | 'checked' | 'partial' | 'blocked';
  readonly operationalValue?: 'unassessed' | 'low' | 'medium' | 'high';
  readonly nationalScope?: 'unassessed' | 'local' | 'provincial' | 'national';
  readonly revenueProtection?: 'unassessed' | 'low' | 'watch' | 'high';
  readonly candidateSafety?: 'unassessed' | 'safe' | 'watch' | 'risk';
  readonly compliance?: 'unassessed' | 'aligned' | 'watch' | 'blocked';
  readonly capacity?: 'unassessed' | 'fit' | 'strained' | 'blocked';
  readonly commandControl?: 'unassessed' | 'clear' | 'watch' | 'blocked';
  readonly nextCommand?: string;
  readonly runtimeProof?: string | null;
};

export function JarvisStrategyCommandPanel(props: JarvisStrategyCommandPanelProps) {
  const rows = [
    ['Objective', props.objective ?? 'not_selected'],
    ['Source state', props.sourceState ?? 'not_checked'],
    ['Operational value', props.operationalValue ?? 'unassessed'],
    ['National scope', props.nationalScope ?? 'unassessed'],
    ['Revenue protection', props.revenueProtection ?? 'unassessed'],
    ['Candidate safety', props.candidateSafety ?? 'unassessed'],
    ['Compliance', props.compliance ?? 'unassessed'],
    ['Capacity', props.capacity ?? 'unassessed'],
    ['Command control', props.commandControl ?? 'unassessed'],
    ['Next command', props.nextCommand ?? 'not_set'],
    ['Runtime proof', props.runtimeProof ?? 'Runtime proof not captured yet.']
  ] as const;

  return (
    <section aria-label="Jarvis Strategy Command Panel" data-jarvis-panel="strategy-command">
      <header>
        <p>STRATEGY COMMAND MODE</p>
        <h2>Operational Value — National Scope — Command Control</h2>
      </header>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label} data-jarvis-strategy-row={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p>
        Commander, this panel must not treat strategy text as execution proof. New layers require necessity,
        validator proof, Oracle Lite realism, candidate safety, compliance, capacity, and command-control alignment.
      </p>
    </section>
  );
}

export default JarvisStrategyCommandPanel;
