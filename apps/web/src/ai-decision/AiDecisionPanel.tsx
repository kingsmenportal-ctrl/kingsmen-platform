export function AiDecisionPanel() {
  const rules = [
    "AI recommends only",
    "Evidence required",
    "Human review for high-risk decisions",
    "No official submission by AI",
    "No refund or fraud decision by AI",
    "No silent learning"
  ];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">N11 AI Decision / Matching Engine</p>
      <h2 className="mt-2 text-3xl font-black text-slate-950">Recommendation engine with hard boundaries</h2>
      <p className="mt-3 max-w-3xl text-sm text-slate-600">
        Kingsmen AI ranks, explains, and prepares route recommendations. The backend state machine and human/operator review control hard decisions.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rules.map((rule) => (
          <article key={rule} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-semibold text-slate-950">{rule}</h3>
            <p className="mt-2 text-xs text-slate-500">Doctrine enforced by N11 validator.</p>
          </article>
        ))}
      </div>
    </section>
  );
}