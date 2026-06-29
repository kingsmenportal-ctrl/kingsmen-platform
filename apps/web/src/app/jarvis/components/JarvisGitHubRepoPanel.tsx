'use client';

export type JarvisGitHubRepoPanelProps = {
  readonly repository?: string;
  readonly path?: string;
  readonly operation?: 'read' | 'create' | 'update' | 'delete' | 'search' | 'commit_check' | 'ci_check';
  readonly commitSha?: string | null;
  readonly runtimeProof?: string | null;
};

export function JarvisGitHubRepoPanel(props: JarvisGitHubRepoPanelProps) {
  const rows = [
    ['Repository', props.repository ?? 'not_selected'],
    ['Path', props.path ?? 'not_selected'],
    ['Operation', props.operation ?? 'read'],
    ['Commit SHA', props.commitSha ?? 'not_captured'],
    ['Repo proof', 'Commit/file proof only'],
    ['Runtime proof', props.runtimeProof ?? 'Runtime proof not captured yet.']
  ] as const;

  return (
    <section aria-label="Jarvis GitHub Repository Panel" data-jarvis-panel="github-repo">
      <header>
        <p>GITHUB REPOSITORY EVIDENCE</p>
        <h2>Change Control — Not Runtime Truth</h2>
      </header>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label} data-jarvis-github-row={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p>
        Commander, this panel proves repository state only. Build, CI, deployment, database, portal, payment,
        and production success require separate runtime evidence.
      </p>
    </section>
  );
}

export default JarvisGitHubRepoPanel;
