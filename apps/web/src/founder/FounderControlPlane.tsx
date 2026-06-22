import type { FounderControlPlaneViewModel } from "./founder-control-plane-client";

function statusLabel(status: string) {
  return status.replaceAll("_", " ").toLowerCase();
}

export function FounderControlPlane({ model }: { model: FounderControlPlaneViewModel }) {
  return (
    <main className="mx-auto max-w-7xl p-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Founder Control Plane</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">Kingsmen + Jarvis operating status</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
              This screen shows the whole Kingsmen system, not only PayFast: N00-N20 modules, Jarvis routing, OpenClaw/operator queues, finance, documents, communications, opportunities, incidents, and launch blockers.
            </p>
          </div>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            <p className="font-bold">Public launch blocked</p>
            <p className="mt-1">Production ready: {String(model.productionReady)}</p>
            <p>Public launch allowed: {String(model.publicLaunchAllowed)}</p>
          </div>
        </div>

        {model.error ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {model.error}
          </div>
        ) : null}
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase text-slate-500">Modules</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{model.totals.modules}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase text-slate-500">Staging proof required</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{model.totals.stagingProofRequired}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase text-slate-500">Provider proof required</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{model.totals.providerProofRequired}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase text-slate-500">Blockers</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{model.totals.blockers}</p>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-bold text-slate-950">Authority doctrine</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">Backend authority: {String(model.authority.backendIsAuthority)}</div>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">PostgreSQL truth: {String(model.authority.postgresIsTruth)}</div>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">Jarvis role: {model.authority.jarvisRole}</div>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">OpenClaw role: {model.authority.openclawRole}</div>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">Airtable mirror only: {String(model.authority.airtableMirrorOnly)}</div>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">n8n thin relay only: {String(model.authority.n8nThinRelayOnly)}</div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-2">
        {model.queues.map((queue) => (
          <article key={queue.queue} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-950">{queue.queue}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{queue.purpose}</p>
              </div>
              <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase text-slate-700">
                {statusLabel(queue.status)}
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-600"><span className="font-semibold text-slate-900">Owner:</span> {queue.owner}</p>
            <p className="mt-2 text-sm text-slate-600"><span className="font-semibold text-slate-900">Next:</span> {queue.nextAction}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-bold text-slate-950">N00-N20 module status</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {model.modules.map((module) => (
            <article key={module.moduleCode} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{module.moduleCode}</p>
                  <h3 className="mt-1 font-bold text-slate-950">{module.name}</h3>
                </div>
                <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase text-slate-700">
                  {statusLabel(module.proofStatus)}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-600"><span className="font-semibold text-slate-900">Owner:</span> {module.owner}</p>
              <p className="mt-2 break-all text-sm text-slate-600"><span className="font-semibold text-slate-900">Validator:</span> {module.validatorCommand}</p>
              <p className="mt-2 break-all text-xs text-slate-500">Report: {module.reportPath}</p>
              {module.blockers.length ? (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {module.blockers.slice(0, 3).map((blocker) => <li key={blocker}>{blocker}</li>)}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-950">Launch blockers</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700">
            {model.launchBlockers.slice(0, 16).map((blocker) => <li key={blocker}>{blocker}</li>)}
          </ul>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-950">Validator commands</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {model.validatorCommands.map((command) => (
              <li key={command} className="rounded-xl bg-slate-50 p-3 font-mono text-xs">{command}</li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
