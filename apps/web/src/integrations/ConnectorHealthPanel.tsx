export function ConnectorHealthPanel() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Connector Health</p>
      <h2 className="text-2xl font-bold text-slate-950">Provider visibility before damage</h2>
      <p className="mt-2 text-sm text-slate-600">Health snapshots watch backlog, latency, failures, unsigned webhooks, and blocked external portals before they harm candidates.</p>
    </section>
  );
}