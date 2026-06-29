'use client';

export type JarvisPostgreSQLTruthVaultPanelProps = {
  readonly databaseConnection?: 'not_proven' | 'configured' | 'passed' | 'failed';
  readonly migrationStatus?: 'not_applied' | 'repo_only' | 'applied_unverified' | 'applied_verified' | 'failed';
  readonly rlsStatus?: 'required' | 'configured' | 'passed' | 'failed';
  readonly auditStatus?: 'required' | 'configured' | 'passed' | 'failed';
  readonly readModelStatus?: 'required' | 'available' | 'passed' | 'failed';
  readonly runtimeProof?: string | null;
};

export function JarvisPostgreSQLTruthVaultPanel(props: JarvisPostgreSQLTruthVaultPanelProps) {
  const databaseConnection = props.databaseConnection ?? 'not_proven';
  const migrationStatus = props.migrationStatus ?? 'repo_only';
  const rlsStatus = props.rlsStatus ?? 'required';
  const auditStatus = props.auditStatus ?? 'required';
  const readModelStatus = props.readModelStatus ?? 'required';
  const runtimeProof = props.runtimeProof ?? 'Runtime proof not captured yet.';

  const rows = [
    ['Authority', 'PostgreSQL Truth Vault'],
    ['Airtable boundary', 'Mirror only — not truth'],
    ['n8n boundary', 'Thin worker only — not brain'],
    ['Raw private rows', 'Blocked by default'],
    ['Database connection', databaseConnection],
    ['Migration status', migrationStatus],
    ['RLS status', rlsStatus],
    ['Audit status', auditStatus],
    ['Read model status', readModelStatus],
    ['Runtime proof', runtimeProof]
  ] as const;

  return (
    <section aria-label="Jarvis PostgreSQL Truth Vault Panel" data-jarvis-panel="postgresql-truth-vault">
      <header>
        <p>POSTGRESQL TRUTH VAULT</p>
        <h2>Authority Layer — Governed Database State</h2>
      </header>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label} data-jarvis-truth-row={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p>
        Commander, this panel must only show HUD-safe read models. It must not expose raw private candidate,
        payment, document, or official-status rows where a summary is sufficient.
      </p>
    </section>
  );
}

export default JarvisPostgreSQLTruthVaultPanel;
