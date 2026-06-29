'use client';

export type JarvisMorningCommandBriefPanelProps = {
  readonly date?: string;
  readonly time?: string;
  readonly location?: string;
  readonly weather?: string;
  readonly calendar?: string;
  readonly commandStatus?: 'Green' | 'Amber' | 'Red' | 'requires_review';
  readonly kingsmenPosition?: string;
  readonly attentionMatters?: string;
  readonly recommendedFirstCommand?: string;
  readonly runtimeProof?: string | null;
};

export function JarvisMorningCommandBriefPanel(props: JarvisMorningCommandBriefPanelProps) {
  const rows = [
    ['Date', props.date ?? 'requires_review'],
    ['Time', props.time ?? 'requires_review'],
    ['Location', props.location ?? 'requires_review'],
    ['Weather', props.weather ?? 'requires_review'],
    ['Calendar', props.calendar ?? 'requires_review'],
    ['Command status', props.commandStatus ?? 'requires_review'],
    ['Kingsmen position', props.kingsmenPosition ?? 'requires_review'],
    ['Matters requiring attention', props.attentionMatters ?? 'not_listed'],
    ['Recommended first command', props.recommendedFirstCommand ?? 'not_set'],
    ['Runtime proof', props.runtimeProof ?? 'Runtime proof not captured yet.']
  ] as const;

  return (
    <section aria-label="Jarvis Morning Command Brief Panel" data-jarvis-panel="morning-command-brief">
      <header>
        <p>MORNING COMMAND BRIEF</p>
        <h2>Welcome — Kingsmen Position — First Command</h2>
      </header>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label} data-jarvis-morning-row={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p>
        Commander, this panel must not invent current fields. Morning context, Kingsmen position,
        matters requiring attention, recommended first command, and proof state must remain visible.
      </p>
    </section>
  );
}

export default JarvisMorningCommandBriefPanel;
