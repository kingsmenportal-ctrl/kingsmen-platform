'use client';

export type JarvisCommandCompletePanelProps = {
  readonly commandName?: string;
  readonly resultStatus?: 'completed' | 'partially_completed' | 'blocked' | 'unproven';
  readonly verifiedOutput?: string;
  readonly remainingMatter?: string;
  readonly risk?: string;
  readonly nextCommand?: string;
  readonly evidenceRef?: string | null;
  readonly runtimeProof?: string | null;
};

export function JarvisCommandCompletePanel(props: JarvisCommandCompletePanelProps) {
  const rows = [
    ['Command', props.commandName ?? 'not_selected'],
    ['Result', props.resultStatus ?? 'unproven'],
    ['Verified output', props.verifiedOutput ?? 'not_verified'],
    ['Remaining matter', props.remainingMatter ?? 'not_stated'],
    ['Risk', props.risk ?? 'not_stated'],
    ['Recommended next command', props.nextCommand ?? 'not_set'],
    ['Evidence reference', props.evidenceRef ?? 'not_captured'],
    ['Runtime proof', props.runtimeProof ?? 'Runtime proof not captured yet.']
  ] as const;

  return (
    <section aria-label="Jarvis Command Complete Panel" data-jarvis-panel="command-complete">
      <header>
        <p>COMMAND COMPLETE</p>
        <h2>Verified Output — Remaining Matter — Next Command</h2>
      </header>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label} data-jarvis-complete-row={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p>
        Commander, this panel must not treat “done” as proof. Result status, verified output,
        remaining matter, risk, next command, evidence reference, and runtime proof must remain visible.
      </p>
    </section>
  );
}

export default JarvisCommandCompletePanel;
