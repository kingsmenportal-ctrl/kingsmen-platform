'use client';

export type JarvisEmailCommunicationPanelProps = {
  readonly mailboxScope?: string;
  readonly action?: string;
  readonly threadState?: 'not_read' | 'read' | 'summarized' | 'blocked';
  readonly draftState?: 'none' | 'prepared' | 'saved' | 'blocked';
  readonly sendState?: 'not_requested' | 'approval_required' | 'sent_confirmed' | 'blocked';
  readonly evidenceRef?: string | null;
  readonly runtimeProof?: string | null;
};

export function JarvisEmailCommunicationPanel(props: JarvisEmailCommunicationPanelProps) {
  const rows = [
    ['Mailbox scope', props.mailboxScope ?? 'not_selected'],
    ['Action', props.action ?? 'not_selected'],
    ['Thread state', props.threadState ?? 'not_read'],
    ['Draft state', props.draftState ?? 'none'],
    ['Send state', props.sendState ?? 'not_requested'],
    ['Evidence reference', props.evidenceRef ?? 'not_captured'],
    ['Runtime proof', props.runtimeProof ?? 'Runtime proof not captured yet.']
  ] as const;

  return (
    <section aria-label="Jarvis Email Communication Panel" data-jarvis-panel="email-communication">
      <header>
        <p>EMAIL COMMUNICATION CONTROL</p>
        <h2>Primary Tracked Channel — Permissioned Actions</h2>
      </header>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label} data-jarvis-email-row={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p>
        Commander, this panel must not treat drafts as sent mail, mailbox search as thread evidence,
        or correspondence as official truth without message, thread, and evidence confirmation.
      </p>
    </section>
  );
}

export default JarvisEmailCommunicationPanel;
