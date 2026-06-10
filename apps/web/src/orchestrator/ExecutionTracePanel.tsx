export function ExecutionTracePanel() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Execution Trace</p>
      <h2 className="text-2xl font-bold text-slate-950">Reason, evidence, fix path</h2>
      <p className="mt-2 text-sm text-slate-600">
        Every run records dispatch, worker result, accepted or rejected state transition, retry, handoff, failure reason, and fix path.
      </p>
    </section>
  );
}