export function CapacityWatchPanel() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Oracle Lite Capacity</p>
      <h2 className="text-2xl font-bold text-slate-950">Cap limits volume, not capability</h2>
      <p className="mt-2 text-sm text-slate-600">
        Capacity watch tracks active candidates, queue pressure, DB pressure, memory, storage, and workflow failure rate before growth-cap increases are allowed.
      </p>
    </section>
  );
}