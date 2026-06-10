export function DispatchQueuePanel() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dispatch Queue</p>
      <h2 className="text-2xl font-bold text-slate-950">Priority lanes with retry discipline</h2>
      <p className="mt-2 text-sm text-slate-600">
        LOW, NORMAL, HIGH, URGENT, and FOUNDER_OVERRIDE lanes control throughput and order only. They do not reduce any candidate sector access.
      </p>
    </section>
  );
}