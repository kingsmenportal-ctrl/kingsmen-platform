export function CommandCenterPanel() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Command Center</p>
      <h2 className="text-2xl font-bold text-slate-950">Backend Command Bus</h2>
      <p className="mt-2 text-sm text-slate-600">
        Commands are audited, approved when needed, and executed by the backend command bus. The control plane does not silently override state.
      </p>
    </section>
  );
}