export function DeadLetterQueuePanel() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Connector DLQ</p>
      <h2 className="text-2xl font-bold text-slate-950">Failure with cause, reason, fix path, evidence</h2>
      <p className="mt-2 text-sm text-slate-600">Failed connector events are never swallowed. They are retried, routed to DLQ, or escalated with evidence.</p>
    </section>
  );
}