'use client';

export type JarvisReportCommandPanelProps = {
  readonly reportScope?: string;
  readonly reportType?: string;
  readonly sourceState?: 'not_checked' | 'checked' | 'partial' | 'blocked';
  readonly verifiedFactsCount?: number;
  readonly unresolvedMattersCount?: number;
  readonly riskLevel?: 'low' | 'watch' | 'high' | 'blocked';
  readonly responsibleOwner?: string;
  readonly nextCommand?: string;
  readonly evidenceRef?: string | null;
  readonly runtimeProof?: string | null;
};

export function JarvisReportCommandPanel(props: JarvisReportCommandPanelProps) {
  const rows = [
    ['Report scope', props.reportScope ?? 'not_selected'],
    ['Report type', props.reportType ?? 'not_selected'],
    ['Source state', props.sourceState ?? 'not_checked'],
    ['Verified facts', String(props.verifiedFactsCount ?? 0)],
    ['Unresolved matters', String(props.unresolvedMattersCount ?? 0)],
    ['Risk level', props.riskLevel ?? 'watch'],
    ['Responsible owner', props.responsibleOwner ?? 'unassigned'],
    ['Next command', props.nextCommand ?? 'not_set'],
    ['Evidence reference', props.evidenceRef ?? 'not_captured'],
    ['Runtime proof', props.runtimeProof ?? 'Runtime proof not captured yet.']
  ] as const;

  return (
    <section aria-label="Jarvis Report Command Panel" data-jarvis-panel="report-command">
      <header>
        <p>REPORT COMMAND FORM</p>
        <h2>Verified Facts — Risks — Next Command</h2>
      </header>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label} data-jarvis-report-row={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p>
        Commander, this panel must not treat report text as execution proof. Verified facts, unresolved matters,
        risk exposure, responsible owner, recommended next command, and evidence state must remain visible.
      </p>
    </section>
  );
}

export default JarvisReportCommandPanel;
