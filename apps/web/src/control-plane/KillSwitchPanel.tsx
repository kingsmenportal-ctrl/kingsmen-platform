export function KillSwitchPanel() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kill Switches</p>
      <h2 className="text-2xl font-bold text-slate-950">Operational Stop Controls</h2>
      <p className="mt-2 text-sm text-slate-600">
        Kill switches pause risky scopes without corrupting candidate state. Every switch change requires reason and audit trail.
      </p>
    </section>
  );
}