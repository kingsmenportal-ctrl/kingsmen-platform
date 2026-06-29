'use client';

export type JarvisCorrectionCommandPanelProps = {
  readonly correctionText?: string;
  readonly affectedScope?: string;
  readonly correctedStandard?: string;
  readonly operatingRuleState?: 'not_updated' | 'updated' | 'blocked';
  readonly repairState?: 'not_required' | 'required' | 'completed' | 'not_proven' | 'blocked';
  readonly validationState?: 'not_required' | 'not_run' | 'passed' | 'failed' | 'blocked';
  readonly nextCommand?: string;
  readonly runtimeProof?: string | null;
};

export function JarvisCorrectionCommandPanel(props: JarvisCorrectionCommandPanelProps) {
  const rows = [
    ['Correction', props.correctionText ?? 'not_received'],
    ['Affected scope', props.affectedScope ?? 'not_selected'],
    ['Corrected standard', props.correctedStandard ?? 'not_defined'],
    ['Operating rule', props.operatingRuleState ?? 'not_updated'],
    ['Repair state', props.repairState ?? 'not_proven'],
    ['Validation state', props.validationState ?? 'not_run'],
    ['Next command', props.nextCommand ?? 'not_set'],
    ['Runtime proof', props.runtimeProof ?? 'Runtime proof not captured yet.']
  ] as const;

  return (
    <section aria-label="Jarvis Correction Command Panel" data-jarvis-panel="correction-command">
      <header>
        <p>CORRECTION MODE</p>
        <h2>Operating Rule Update — Corrected Kingsmen Standard</h2>
      </header>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label} data-jarvis-correction-row={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p>
        Commander, this panel must not treat apology as material repair. The corrected rule, affected scope,
        repair state, validation state, and next command must remain visible.
      </p>
    </section>
  );
}

export default JarvisCorrectionCommandPanel;
