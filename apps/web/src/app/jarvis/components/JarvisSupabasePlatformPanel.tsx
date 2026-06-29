'use client';

export type JarvisSupabasePlatformPanelProps = {
  readonly projectConnection?: 'not_proven' | 'configured' | 'passed' | 'failed';
  readonly databaseBoundary?: 'required' | 'configured' | 'passed' | 'failed';
  readonly accessBoundary?: 'required' | 'configured' | 'passed' | 'failed';
  readonly storageBoundary?: 'required' | 'configured' | 'passed' | 'failed';
  readonly runtimeProof?: string | null;
};

export function JarvisSupabasePlatformPanel(props: JarvisSupabasePlatformPanelProps) {
  const rows = [
    ['Platform role', 'Support layer — not doctrine'],
    ['Project connection', props.projectConnection ?? 'not_proven'],
    ['PostgreSQL boundary', props.databaseBoundary ?? 'required'],
    ['Access boundary', props.accessBoundary ?? 'required'],
    ['Storage boundary', props.storageBoundary ?? 'required'],
    ['Runtime proof', props.runtimeProof ?? 'Runtime proof not captured yet.']
  ] as const;

  return (
    <section aria-label="Jarvis Supabase Platform Panel" data-jarvis-panel="supabase-platform">
      <header>
        <p>SUPABASE PLATFORM SUPPORT</p>
        <h2>Governed Infrastructure — Not Final Authority</h2>
      </header>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label} data-jarvis-supabase-row={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p>
        Commander, this panel may display platform readiness only. PostgreSQL truth, backend policy,
        audit, evidence, and disciplined access remain in control.
      </p>
    </section>
  );
}

export default JarvisSupabasePlatformPanel;
