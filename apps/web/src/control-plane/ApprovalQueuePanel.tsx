export function ApprovalQueuePanel() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Approval Queue</p>
      <h2 className="text-2xl font-bold text-slate-950">Human Boundary</h2>
      <p className="mt-2 text-sm text-slate-600">
        Sensitive profile corrections, manual submissions, Phoenix reroutes, refunds, source overrides, document overrides, worker restarts, and kill-switch changes require human approval.
      </p>
    </section>
  );
}