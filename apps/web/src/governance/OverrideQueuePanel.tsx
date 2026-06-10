export function OverrideQueuePanel() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Human Override Queue</p>
      <h2 className="text-2xl font-bold text-slate-950">No silent override</h2>
      <p className="mt-2 text-sm text-slate-600">
        Overrides require a reason, risk summary, evidence, visible status, and operator review. AI cannot silently bypass policy.
      </p>
    </section>
  );
}