'use client';

export type JarvisPowerShellCreatorPanelProps = {
  readonly windowsPath?: string;
  readonly repoPath?: string;
  readonly action?: string;
  readonly validationCommand?: string | null;
  readonly runtimeProof?: string | null;
};

export function JarvisPowerShellCreatorPanel(props: JarvisPowerShellCreatorPanelProps) {
  const rows = [
    ['Windows path', props.windowsPath ?? 'not_selected'],
    ['Repo path', props.repoPath ?? 'not_selected'],
    ['Action', props.action ?? 'not_selected'],
    ['Validation command', props.validationCommand ?? 'not_captured'],
    ['Local execution proof', props.runtimeProof ?? 'Runtime proof not captured yet.']
  ] as const;

  return (
    <section aria-label="Jarvis PowerShell Creator Panel" data-jarvis-panel="powershell-creator">
      <header>
        <p>POWERSHELL CREATOR</p>
        <h2>Windows Build Scribe — Not Doctrine or Truth</h2>
      </header>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label} data-jarvis-powershell-row={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p>
        Commander, this panel tracks local command readiness only. Script text is not execution proof;
        terminal output, validator output, and GitHub traceability are required before success is claimed.
      </p>
    </section>
  );
}

export default JarvisPowerShellCreatorPanel;
