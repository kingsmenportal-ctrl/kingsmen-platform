'use client';

export type JarvisEvidenceMissingPanelProps = {
  readonly matter?: string;
  readonly claim?: string;
  readonly presentEvidence?: string;
  readonly missingEvidence?: string;
  readonly verificationStatus?: 'unverified' | 'verified' | 'blocked_missing_evidence';
  readonly proofCommand?: string;
  readonly evidenceRef?: string | null;
  readonly runtimeProof?: string | null;
};

export function JarvisEvidenceMissingPanel(props: JarvisEvidenceMissingPanelProps) {
  const rows = [
    ['Matter', props.matter ?? 'not_selected'],
    ['Claim', props.claim ?? 'not_selected'],
    ['Present evidence', props.presentEvidence ?? 'not_listed'],
    ['Missing evidence', props.missingEvidence ?? 'not_listed'],
    ['Verification status', props.verificationStatus ?? 'unverified'],
    ['Next proof command', props.proofCommand ?? 'not_set'],
    ['Evidence reference', props.evidenceRef ?? 'not_captured'],
    ['Runtime proof', props.runtimeProof ?? 'Runtime proof not captured yet.']
  ] as const;

  return (
    <section aria-label="Jarvis Evidence Missing Panel" data-jarvis-panel="evidence-missing">
      <header>
        <p>EVIDENCE MISSING</p>
        <h2>Verification Hold — Required Proof</h2>
      </header>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label} data-jarvis-evidence-row={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p>
        Commander, this panel must not treat incomplete evidence as verified. Present evidence,
        missing proof, verification status, next proof command, and runtime proof must remain visible.
      </p>
    </section>
  );
}

export default JarvisEvidenceMissingPanel;
