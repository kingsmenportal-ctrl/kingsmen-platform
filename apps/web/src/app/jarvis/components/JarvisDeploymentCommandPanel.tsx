'use client';

export type JarvisDeploymentCommandPanelProps = {
  readonly targetEnvironment?: string;
  readonly commitRef?: string;
  readonly validatorState?: 'not_run' | 'passed' | 'failed' | 'blocked';
  readonly buildState?: 'not_run' | 'passed' | 'failed' | 'blocked';
  readonly environmentState?: 'unchecked' | 'ready' | 'blocked';
  readonly databaseState?: 'unchecked' | 'ready' | 'blocked';
  readonly approvalState?: 'not_required' | 'required' | 'approved' | 'blocked';
  readonly runtimeProof?: string | null;
  readonly nextCommand?: string;
};

export function JarvisDeploymentCommandPanel(props: JarvisDeploymentCommandPanelProps) {
  const rows = [
    ['Target environment', props.targetEnvironment ?? 'not_selected'],
    ['Commit', props.commitRef ?? 'not_selected'],
    ['Validator state', props.validatorState ?? 'not_run'],
    ['Build state', props.buildState ?? 'not_run'],
    ['Environment state', props.environmentState ?? 'unchecked'],
    ['Database state', props.databaseState ?? 'unchecked'],
    ['Approval state', props.approvalState ?? 'required'],
    ['Runtime proof', props.runtimeProof ?? 'Runtime proof not captured yet.'],
    ['Next command', props.nextCommand ?? 'not_set']
  ] as const;

  return (
    <section aria-label="Jarvis Deployment Command Panel" data-jarvis-panel="deployment-command">
      <header>
        <p>DEPLOYMENT MODE</p>
        <h2>Practical — Testable — Oracle Lite Disciplined</h2>
      </header>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label} data-jarvis-deployment-row={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p>
        Commander, this panel must not treat repo files as release proof. Validators, build checks,
        environment readiness, database readiness, approval state, and runtime evidence must remain visible.
      </p>
    </section>
  );
}

export default JarvisDeploymentCommandPanel;
