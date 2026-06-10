const modules = [
  "N00 Doctrine",
  "N01 Runtime",
  "N02 Backend",
  "N03 PostgreSQL",
  "N04 Candidate",
  "N05 Documents",
  "N06 Routes",
  "N07 Airtable",
  "N08 Control Plane",
  "N09 Communications",
  "N10 Finance",
  "N11 AI Decision",
  "N12 Governance",
  "N13 Observability",
  "N14 Integrations",
  "N15 Opportunity",
  "N16 Orchestrator",
  "N17 Founder Ops",
  "N18 Public Website",
  "N19 Mobile",
  "N20 Final Lock"
];

export function ModuleMapPanel() {
  return (
    <section className="rounded-3xl border border-white/10 bg-white p-5 text-slate-950">
      <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Module map</p>
      <h2 className="mt-2 text-2xl font-black">N00-N20 assembled as one system</h2>
      <div className="mt-5 grid gap-2 md:grid-cols-4">
        {modules.map((module) => (
          <div key={module} className="rounded-xl border border-slate-200 p-3 text-sm font-semibold">
            {module}
          </div>
        ))}
      </div>
    </section>
  );
}