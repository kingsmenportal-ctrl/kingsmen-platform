'use client';

export type JarvisRepairModePanelProps = {
  readonly fault?: string;
  readonly affectedScope?: string;
  readonly sourceState?: 'not_checked' | 'checked' | 'partial' | 'blocked';
  readonly preservedMaterial?: string;
  readonly correctedPath?: string;
  readonly validationState?: 'not_run' | 'passed' | 'failed' | 'blocked';
  readonly nextCommand?: string;
  readonly runtimeProof?: string | null;
};

export function JarvisRepairModePanel(props: JarvisRepairModePanelProps) {
  const rows = [
    ['Fault', props.fault ?? 'not_isolated'],
    ['Affected scope', props.affectedScope ?? 'not_selected'],
    ['Source state', props.sourceState ?? 'not_checked'],
    ['Preserved material', props.preservedMaterial ?? 'not_recorded'],
    ['Corrected path', props.correctedPath ?? 'not_recorded'],
    ['Validation state', props.validationState ?? 'not_run'],
    ['Next command', props.nextCommand ?? 'not_set'],
    ['Runtime proof', props.runtimeProof ?? 'Runtime proof not captured yet.']
  ] as const;

  return (
    <section aria-label="Jarvis Repair Mode Panel" data-jarvis-panel="repair-mode">
      <header>
        <p>REPAIR MODE</p>
        <h2>Fault Isolation — Preservation — Restoration</h2>
      </header>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label} data-jarvis-repair-row={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p>
        Commander, this panel must not treat patch text as repair success. The fault, preserved material,
        corrected path, validation state, and next corrective command must remain visible.
      </p>
    </section>
  );
}

export default JarvisRepairModePanel;
