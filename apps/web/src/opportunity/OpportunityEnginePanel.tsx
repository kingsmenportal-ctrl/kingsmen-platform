export function OpportunityEnginePanel() {
  const rules = [
    "No fake deadlines",
    "No fake links",
    "No fake availability",
    "Source confidence required",
    "Stale sources go to review",
    "Private college verification required"
  ];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">N15 Opportunity Engine</p>
      <h2 className="mt-2 text-3xl font-black text-slate-950">Verified external source intelligence</h2>
      <p className="mt-3 max-w-3xl text-sm text-slate-600">
        Kingsmen tracks opportunities across universities, TVETs, SETA/QCTO, learnerships, bursaries, accommodation, employers, NSFAS, CAO, and private colleges without inventing facts.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rules.map((rule) => (
          <article key={rule} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-semibold text-slate-950">{rule}</h3>
            <p className="mt-2 text-xs text-slate-500">Validated by N15 source intelligence doctrine.</p>
          </article>
        ))}
      </div>
    </section>
  );
}