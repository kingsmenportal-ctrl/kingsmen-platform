export function FounderDecisionLogPanel() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Decision Log</p>
      <h2 className="text-2xl font-bold text-slate-950">No silent override</h2>
      <p className="mt-2 text-sm text-slate-600">
        Every approval, rejection, pause, resume, priority change, escalation, MAP request, Phoenix fallback, review request, or no-action decision records reason and evidence.
      </p>
    </section>
  );
}