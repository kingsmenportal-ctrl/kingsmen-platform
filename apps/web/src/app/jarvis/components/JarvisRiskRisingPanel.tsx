'use client';

export type JarvisRiskRisingPanelProps = {
  readonly matter?: string;
  readonly currentCondition?: string;
  readonly riskCause?: string;
  readonly severity?: 'watch' | 'rising' | 'high' | 'critical_unproven' | 'blocked';
  readonly operationalCost?: string;
  readonly intervention?: string;
  readonly owner?: string;
  readonly nextCommand?: string;
  readonly evidenceRef?: string | null;
  readonly runtimeProof?: string | null;
};

export function JarvisRiskRisingPanel(props: JarvisRiskRisingPanelProps) {
  const rows = [
    ['Matter', props.matter ?? 'not_selected'],
    ['Current condition', props.currentCondition ?? 'not_stated'],
    ['Risk cause', props.riskCause ?? 'not_identified'],
    ['Severity', props.severity ?? 'rising'],
    ['Operational cost', props.operationalCost ?? 'not_estimated'],
    ['Recommended intervention', props.intervention ?? 'not_set'],
    ['Owner', props.owner ?? 'unassigned'],
    ['Next command', props.nextCommand ?? 'not_set'],
    ['Evidence reference', props.evidenceRef ?? 'not_captured'],
    ['Runtime proof', props.runtimeProof ?? 'Runtime proof not captured yet.']
  ] as const;

  return (
    <section aria-label="Jarvis Risk Rising Panel" data-jarvis-panel="risk-rising">
      <header>
        <p>RISK RISING</p>
        <h2>Early Intervention — Before Operational Cost Increases</h2>
      </header>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label} data-jarvis-risk-row={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p>
        Commander, this panel must not hide rising risk as stable or label it critical without proof.
        Cause, operational cost, intervention, owner, next command, and proof state must remain visible.
      </p>
    </section>
  );
}

export default JarvisRiskRisingPanel;
