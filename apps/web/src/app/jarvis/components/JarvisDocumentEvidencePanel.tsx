'use client';

export type JarvisDocumentEvidencePanelProps = {
  readonly documentScope?: string;
  readonly action?: string;
  readonly inspectionState?: 'not_found' | 'found' | 'opened' | 'inspected' | 'blocked';
  readonly readiness?: 'unproven' | 'ready' | 'missing_evidence' | 'weak_evidence' | 'blocked';
  readonly privacyRisk?: 'none' | 'limited' | 'high' | 'blocked';
  readonly evidenceRef?: string | null;
  readonly runtimeProof?: string | null;
};

export function JarvisDocumentEvidencePanel(props: JarvisDocumentEvidencePanelProps) {
  const rows = [
    ['Document scope', props.documentScope ?? 'not_selected'],
    ['Action', props.action ?? 'not_selected'],
    ['Inspection state', props.inspectionState ?? 'not_found'],
    ['Readiness', props.readiness ?? 'unproven'],
    ['Privacy risk', props.privacyRisk ?? 'limited'],
    ['Evidence reference', props.evidenceRef ?? 'not_captured'],
    ['Runtime proof', props.runtimeProof ?? 'Runtime proof not captured yet.']
  ] as const;

  return (
    <section aria-label="Jarvis Document Evidence Panel" data-jarvis-panel="document-evidence">
      <header>
        <p>DOCUMENT EVIDENCE READINESS</p>
        <h2>Missing / Weak Evidence — Execution Gate</h2>
      </header>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label} data-jarvis-document-row={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p>
        Commander, this panel must not treat file presence as readiness, document summaries as official truth,
        or private contents as safe to expose without necessity, approval, and evidence boundaries.
      </p>
    </section>
  );
}

export default JarvisDocumentEvidencePanel;
