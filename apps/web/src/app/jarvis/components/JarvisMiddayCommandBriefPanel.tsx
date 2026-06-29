'use client';

export type JarvisMiddayCommandBriefPanelProps = {
  readonly morningBaseline?: string;
  readonly progressSinceMorning?: string;
  readonly completedWork?: string;
  readonly delayedMatters?: string;
  readonly blockedItems?: string;
  readonly risingRisks?: string;
  readonly commandStatus?: 'Green' | 'Amber' | 'Red' | 'requires_review';
  readonly afternoonCommand?: string;
  readonly runtimeProof?: string | null;
};

export function JarvisMiddayCommandBriefPanel(props: JarvisMiddayCommandBriefPanelProps) {
  const rows = [
    ['Morning baseline', props.morningBaseline ?? 'requires_review'],
    ['Progress since morning', props.progressSinceMorning ?? 'requires_review'],
    ['Completed work', props.completedWork ?? 'not_listed'],
    ['Delayed matters', props.delayedMatters ?? 'not_listed'],
    ['Blocked items', props.blockedItems ?? 'not_listed'],
    ['Rising risks', props.risingRisks ?? 'not_checked'],
    ['Command status', props.commandStatus ?? 'requires_review'],
    ['Recommended afternoon command', props.afternoonCommand ?? 'not_set'],
    ['Runtime proof', props.runtimeProof ?? 'Runtime proof not captured yet.']
  ] as const;

  return (
    <section aria-label="Jarvis Midday Command Brief Panel" data-jarvis-panel="midday-command-brief">
      <header>
        <p>MIDDAY COMMAND BRIEF</p>
        <h2>Progress — Delays — Afternoon Command</h2>
      </header>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label} data-jarvis-midday-row={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p>
        Commander, this panel must not invent progress. Morning baseline, progress, completed work,
        delays, blocked items, rising risks, afternoon command, and proof state must remain visible.
      </p>
    </section>
  );
}

export default JarvisMiddayCommandBriefPanel;
