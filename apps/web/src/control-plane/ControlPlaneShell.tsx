export function ControlPlaneShell() {
  const surfaces = [
    "Command Center",
    "Candidate Queue",
    "Application Queue",
    "Document Queue",
    "Route Queue",
    "Approval Queue",
    "Kill Switches",
    "Capacity Guard",
    "Worker Health",
    "Manual Fallback Center",
    "Phoenix Recovery Center",
    "Reports Center"
  ];

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <section className="mx-auto max-w-7xl rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">N08 Control Plane</p>
        <h1 className="mt-3 text-4xl font-black">Kingsmen Founder Command House</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-300">
          Founder/operator side. It issues audited backend commands and never mutates candidate state directly from the UI.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {surfaces.map((surface) => (
            <article key={surface} className="rounded-2xl border border-white/10 bg-slate-900 p-4">
              <h2 className="font-semibold">{surface}</h2>
              <p className="mt-2 text-sm text-slate-400">Policy-backed control-plane surface.</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}