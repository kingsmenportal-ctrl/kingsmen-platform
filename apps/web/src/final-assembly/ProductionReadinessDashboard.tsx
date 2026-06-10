const checks = [
  ["Repo lock", "Passed", "N00-N20 materialized and validator-backed."],
  ["Database apply", "Manual review", "Run migrations only against the intended database."],
  ["Secrets", "Closed", "Wire outside git before live."],
  ["PayFast", "Pending", "Sandbox checkout and ITN evidence required."],
  ["Backup", "Pending", "Restore drill required before live candidate data."],
  ["RLS", "Pending", "Production security review required before public access."]
];

export function ProductionReadinessDashboard() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-7xl px-4 py-8">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">N20 Final Assembly</p>
        <h1 className="mt-3 text-4xl font-black">Kingsmen release lock and production readiness</h1>
        <p className="mt-4 max-w-3xl text-slate-300">
          N20 does not pretend the platform is live. It locks the repo-materialized system,
          exposes what is ready, and keeps dangerous launch gates closed until evidence exists.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {checks.map(([title, status, body]) => (
            <article key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{status}</p>
              <h2 className="mt-2 text-lg font-bold">{title}</h2>
              <p className="mt-2 text-sm text-slate-300">{body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}