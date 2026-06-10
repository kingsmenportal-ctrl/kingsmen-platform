export function ObservabilityDashboard() {
  const cards = [
    { label: "System health", value: "GREEN / AMBER / RED", note: "No false green status" },
    { label: "Incidents", value: "Cause + reason + fix", note: "Evidence required before closure" },
    { label: "Capacity", value: "500 active cap", note: "Oracle Lite pressure watch" },
    { label: "Reports", value: "Morning / midday / evening", note: "Email-first founder visibility" }
  ];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">N13 Observability</p>
      <h2 className="mt-2 text-3xl font-black text-slate-950">Founder-grade visibility without false green</h2>
      <p className="mt-3 max-w-3xl text-sm text-slate-600">
        Kingsmen tracks health, incidents, workflows, reports, capacity, and delivery evidence so the founder sees the cause, reason, fix path, and operational risk.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">{card.label}</p>
            <h3 className="mt-2 font-bold text-slate-950">{card.value}</h3>
            <p className="mt-2 text-xs text-slate-500">{card.note}</p>
          </article>
        ))}
      </div>
    </section>
  );
}