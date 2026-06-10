import React from "react";

export interface WorkbenchRouteCard {
  workbenchRef: string;
  programmeName: string;
  routeType: string;
  workbenchStatus: string;
  routeReadinessStatus: string;
  documentReadinessStatus: string;
  sourceConfidenceBand: string;
  portalHealthStatus: string;
  mapFallbackRequired: boolean;
  nextAction: string;
}

export interface ApplicationWorkbenchPanelProps {
  candidateName: string;
  routes: WorkbenchRouteCard[];
}

export function ApplicationWorkbenchPanel(props: ApplicationWorkbenchPanelProps) {
  return (
    <section aria-label="Kingsmen application workbench" className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-white">
      <p className="text-sm uppercase tracking-wide text-slate-400">Application Workbench</p>
      <h2 className="mt-2 text-xl font-semibold">{props.candidateName} routes</h2>
      <p className="mt-2 text-sm text-slate-300">
        Routes stay available nationally. Execution waits for source confidence, document readiness, and portal health.
      </p>

      <div className="mt-5 space-y-3">
        {props.routes.map((route) => (
          <article key={route.workbenchRef} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold">{route.programmeName}</h3>
                <p className="mt-1 text-xs text-slate-400">{route.routeType}</p>
              </div>
              <span className="rounded-full border border-slate-700 px-3 py-1 text-xs">{route.workbenchStatus}</span>
            </div>

            <dl className="mt-4 grid gap-2 text-sm md:grid-cols-2">
              <div><dt className="text-slate-500">Route readiness</dt><dd>{route.routeReadinessStatus}</dd></div>
              <div><dt className="text-slate-500">Document readiness</dt><dd>{route.documentReadinessStatus}</dd></div>
              <div><dt className="text-slate-500">Source band</dt><dd>{route.sourceConfidenceBand}</dd></div>
              <div><dt className="text-slate-500">Portal health</dt><dd>{route.portalHealthStatus}</dd></div>
            </dl>

            {route.mapFallbackRequired ? (
              <p className="mt-3 rounded-xl border border-amber-700 bg-amber-950/40 p-3 text-sm text-amber-100">
                MAP fallback required.
              </p>
            ) : null}

            <p className="mt-3 text-sm text-slate-300">Next: {route.nextAction}</p>
          </article>
        ))}
      </div>
    </section>
  );
}