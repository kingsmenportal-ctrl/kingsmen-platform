'use client';

export type JarvisSignatureClosingPanelProps = {
  readonly selectedClosing?: string;
  readonly responseState?: 'complete' | 'requires_review';
  readonly evidenceState?: 'visible' | 'requires_review';
  readonly nextCommandState?: 'visible' | 'not_required' | 'requires_review';
  readonly runtimeState?: string | null;
};

export function JarvisSignatureClosingPanel(props: JarvisSignatureClosingPanelProps) {
  const rows = [
    ['Selected closing', props.selectedClosing ?? 'not_selected'],
    ['Response state', props.responseState ?? 'requires_review'],
    ['Evidence state', props.evidenceState ?? 'requires_review'],
    ['Next command state', props.nextCommandState ?? 'requires_review'],
    ['Runtime state', props.runtimeState ?? 'Runtime proof not captured yet.']
  ] as const;

  return (
    <section aria-label="Jarvis Signature Closing Panel" data-jarvis-panel="signature-closing">
      <header>
        <p>SIGNATURE CLOSING</p>
        <h2>Final Tone — Doctrine Integrity</h2>
      </header>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label} data-jarvis-signature-row={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p>
        Commander, the final line is selected only after the response state, evidence state,
        and next command state remain visible.
      </p>
    </section>
  );
}

export default JarvisSignatureClosingPanel;
