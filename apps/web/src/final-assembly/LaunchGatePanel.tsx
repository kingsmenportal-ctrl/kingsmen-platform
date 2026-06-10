const gates = [
  ["Repo lock", "Open", "N00-N20 materialized."],
  ["Database apply", "Manual review", "Only with confirmed DATABASE_URL."],
  ["Secret wiring", "Closed", "No live secrets in git."],
  ["Payment live", "Closed", "PayFast sandbox evidence first."],
  ["Public launch", "Closed", "Requires DB, secrets, email, RLS, backup, incident readiness."],
  ["500 cap", "Manual review", "Operational active candidates, not concurrent browsers."]
];

export function LaunchGatePanel() {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900 p-5 text-white">
      <p className="text-sm uppercase tracking-[0.25em] text-amber-200">Launch gates</p>
      <h2 className="mt-2 text-2xl font-black">Launch stays controlled</h2>
      <div className="mt-5 divide-y divide-white/10">
        {gates.map(([gate, status, detail]) => (
          <div key={gate} className="grid gap-2 py-3 md:grid-cols-3">
            <span className="font-bold">{gate}</span>
            <span className="text-sm text-amber-200">{status}</span>
            <span className="text-sm text-slate-300">{detail}</span>
          </div>
        ))}
      </div>
    </section>
  );
}