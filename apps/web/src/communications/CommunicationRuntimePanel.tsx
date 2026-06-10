export function CommunicationRuntimePanel() {
  const cards = [
    "Email Primary Outbox",
    "Portal Inbox",
    "Inbound Intake",
    "Urgent WhatsApp Approval",
    "SMS Backup",
    "Quiet Hours",
    "Rate Limits",
    "Message Evidence Ledger"
  ];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">N09 Communications Runtime</p>
      <h2 className="mt-2 text-3xl font-black text-slate-950">Email-first candidate communication</h2>
      <p className="mt-3 max-w-3xl text-sm text-slate-600">
        Email is primary. WhatsApp is urgent-only. SMS is backup-only. Every message is evidence-backed and cannot silently change application state.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <article key={card} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-semibold text-slate-950">{card}</h3>
            <p className="mt-2 text-xs text-slate-500">Policy-backed runtime surface.</p>
          </article>
        ))}
      </div>
    </section>
  );
}