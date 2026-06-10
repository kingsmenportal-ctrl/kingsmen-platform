export function IncidentPanel() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Incident Runtime</p>
      <h2 className="text-2xl font-bold text-slate-950">Cause, reason, fix path, evidence</h2>
      <p className="mt-2 text-sm text-slate-600">
        Incidents are not just red labels. Every incident carries severity, status, owner, timeline, action list, evidence references, and closure discipline.
      </p>
    </section>
  );
}