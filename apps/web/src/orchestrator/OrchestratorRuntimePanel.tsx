export function OrchestratorRuntimePanel() {
  const laws = [
    "Backend controls state",
    "n8n remains thin",
    "Worker result required",
    "Same-state workers cannot advance state",
    "Manual fallback for blocked portals",
    "Priority changes order, not dignity"
  ];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">N16 Orchestrator</p>
      <h2 className="mt-2 text-3xl font-black text-slate-950">Execution Runtime</h2>
      <p className="mt-3 max-w-3xl text-sm text-slate-600">
        The backend orchestrator binds commands, worker dispatch, workflow results, retries, approvals, MAP fallback, Phoenix fallback, and state guards into one controlled execution lane.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {laws.map((law) => (
          <article key={law} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-semibold text-slate-950">{law}</h3>
            <p className="mt-2 text-xs text-slate-500">Validated by N16 execution doctrine.</p>
          </article>
        ))}
      </div>
    </section>
  );
}