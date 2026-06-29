'use client';

export type JarvisInspectionCommandPanelProps = {
  readonly affectedLayer?: string;
  readonly sourceState?: 'not_checked' | 'checked' | 'partial' | 'blocked';
  readonly doctrineAlignment?: 'unproven' | 'aligned' | 'misaligned' | 'blocked';
  readonly weaknessState?: 'none' | 'found' | 'uncertain' | 'blocked';
  readonly severity?: 'none' | 'low' | 'watch' | 'high' | 'blocked';
  readonly correctionPath?: string;
  readonly approvalRequired?: boolean;
  readonly evidenceRef?: string | null;
  readonly runtimeProof?: string | null;
};

export function JarvisInspectionCommandPanel(props: JarvisInspectionCommandPanelProps) {
  const rows = [
    ['Affected layer', props.affectedLayer ?? 'not_selected'],
    ['Source state', props.sourceState ?? 'not_checked'],
    ['Doctrine alignment', props.doctrineAlignment ?? 'unproven'],
    ['Weakness state', props.weaknessState ?? 'uncertain'],
    ['Severity', props.severity ?? 'watch'],
    ['Correction path', props.correctionPath ?? 'not_set'],
    ['Approval required', props.approvalRequired ? 'yes' : 'not_flagged'],
    ['Evidence reference', props.evidenceRef ?? 'not_captured'],
    ['Runtime proof', props.runtimeProof ?? 'Runtime proof not captured yet.']
  ] as const;

  return (
    <section aria-label="Jarvis Inspection Command Panel" data-jarvis-panel="inspection-command">
      <header>
        <p>INSPECTION MODE</p>
        <h2>Layer Review — Doctrine Alignment — Clean Correction Path</h2>
      </header>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label} data-jarvis-inspection-row={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p>
        Commander, this panel must not treat inspection as repair. Source inspection, doctrine alignment,
        visible weakness, severity, correction path, and proof state must remain separate.
      </p>
    </section>
  );
}

export default JarvisInspectionCommandPanel;
