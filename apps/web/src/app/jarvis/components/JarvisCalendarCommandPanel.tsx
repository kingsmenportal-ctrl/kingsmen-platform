'use client';

export type JarvisCalendarCommandPanelProps = {
  readonly dateScope?: string;
  readonly timezone?: string;
  readonly action?: string;
  readonly eventState?: 'not_searched' | 'searched' | 'read' | 'conflict_found' | 'open_window_found' | 'blocked';
  readonly writeState?: 'not_requested' | 'approval_required' | 'created_confirmed' | 'updated_confirmed' | 'deleted_confirmed' | 'blocked';
  readonly evidenceRef?: string | null;
  readonly runtimeProof?: string | null;
};

export function JarvisCalendarCommandPanel(props: JarvisCalendarCommandPanelProps) {
  const rows = [
    ['Date scope', props.dateScope ?? 'not_selected'],
    ['Timezone', props.timezone ?? 'not_selected'],
    ['Action', props.action ?? 'not_selected'],
    ['Event state', props.eventState ?? 'not_searched'],
    ['Write state', props.writeState ?? 'not_requested'],
    ['Evidence reference', props.evidenceRef ?? 'not_captured'],
    ['Runtime proof', props.runtimeProof ?? 'Runtime proof not captured yet.']
  ] as const;

  return (
    <section aria-label="Jarvis Calendar Command Panel" data-jarvis-panel="calendar-command">
      <header>
        <p>CALENDAR TIME COMMAND</p>
        <h2>Schedule Position — Open Command Windows</h2>
      </header>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label} data-jarvis-calendar-row={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p>
        Commander, this panel must not treat schedule suggestions as created events, calendar search as full
        event inspection, or availability claims as fact without calendar evidence and runtime confirmation.
      </p>
    </section>
  );
}

export default JarvisCalendarCommandPanel;
