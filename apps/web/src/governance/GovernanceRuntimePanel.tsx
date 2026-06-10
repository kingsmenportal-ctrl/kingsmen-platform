export function GovernanceRuntimePanel() {
  const doctrine = [
    "Backend state machine controls flow",
    "AI recommends only",
    "No silent override",
    "POPIA lawful basis required",
    "Source confidence required",
    "Growth cap increase needs outcome-quality evidence"
  ];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">N12 Governance / Policy Runtime</p>
      <h2 className="mt-2 text-3xl font-black text-slate-950">Policy gates before dangerous actions</h2>
      <p className="mt-3 max-w-3xl text-sm text-slate-600">
        Kingsmen governance controls submissions, refunds, privacy, source confidence, human override, communication exceptions, Phoenix fallback, and growth-cap changes.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {doctrine.map((item) => (
          <article key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-semibold text-slate-950">{item}</h3>
            <p className="mt-2 text-xs text-slate-500">Validated by the N12 governance policy runtime.</p>
          </article>
        ))}
      </div>
    </section>
  );
}