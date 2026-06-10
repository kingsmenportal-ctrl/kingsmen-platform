export function UrgentEscalationPanel() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Urgent Escalation</p>
      <h2 className="text-2xl font-bold text-slate-950">WhatsApp is urgent-only</h2>
      <p className="mt-2 text-sm text-slate-600">
        WhatsApp requires urgency, reason, evidence, and approval. Routine reminders stay on email and portal.
      </p>
    </section>
  );
}