export function FounderCommandCenter() {
  const commands = [
    "Inspect candidate",
    "Set priority lane",
    "Pause / resume worker",
    "Approve MAP",
    "Request Phoenix fallback",
    "Escalate incident",
    "Request document review",
    "Request source review",
    "Request refund review"
  ];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">N17 Founder Control Plane</p>
      <h2 className="mt-2 text-3xl font-black text-slate-950">Command Ops Runtime</h2>
      <p className="mt-3 max-w-3xl text-sm text-slate-600">
        This is the founder/operator cockpit. It requests, approves, escalates, pauses, prioritizes, and reviews through governance and orchestrator boundaries. It is not a second backend.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {commands.map((command) => (
          <article key={command} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-semibold text-slate-950">{command}</h3>
            <p className="mt-2 text-xs text-slate-500">Routes through N12 governance, N16 orchestrator, N13 observability, or N08 read model.</p>
          </article>
        ))}
      </div>
    </section>
  );
}