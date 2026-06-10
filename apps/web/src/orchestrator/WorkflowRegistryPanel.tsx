const workers = [
  "W00", "W01", "W02", "W03", "W04", "W05", "W06", "W07", "W08", "W09",
  "W10", "W11", "W12", "W13", "W14", "W15", "W16", "W17", "W24"
];

export function WorkflowRegistryPanel() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Worker Registry</p>
      <h2 className="text-2xl font-bold text-slate-950">19 controlled workflows</h2>
      <p className="mt-2 text-sm text-slate-600">
        Each worker has a target state, same-state boundary, approval rule, and dispatch discipline.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {workers.map((worker) => (
          <span key={worker} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
            {worker}
          </span>
        ))}
      </div>
    </section>
  );
}