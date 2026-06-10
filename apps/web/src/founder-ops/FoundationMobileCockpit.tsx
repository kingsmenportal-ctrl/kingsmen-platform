const cards = [
  "Today's Commands",
  "Urgent Candidates",
  "Queue Pressure",
  "Document Pipeline",
  "Route Source Review",
  "Finance Review",
  "Comms Escalation",
  "Incidents",
  "MAP Handoffs",
  "Phoenix Fallbacks",
  "System Health",
  "Capacity Cap"
];

export function FounderMobileCockpit() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone Cockpit</p>
      <h2 className="text-2xl font-bold text-slate-950">Founder view for daily control</h2>
      <p className="mt-2 text-sm text-slate-600">
        Each mobile card must show cause, reason, risk, next action, and fix path before the founder acts.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {cards.map((card) => (
          <div key={card} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
            {card}
          </div>
        ))}
      </div>
    </section>
  );
}