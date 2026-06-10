import React from "react";

export interface RouteReadinessPanelProps {
  status: string;
  blockers: string[];
  warnings: string[];
  nextActions: string[];
}

export function RouteReadinessPanel(props: RouteReadinessPanelProps) {
  return (
    <section aria-label="Route readiness" className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-white">
      <p className="text-sm uppercase tracking-wide text-slate-400">Route Readiness</p>
      <h2 className="mt-2 text-xl font-semibold">{props.status}</h2>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h3 className="font-semibold">Blockers</h3>
          <p className="mt-2 text-sm text-slate-300">{props.blockers.length ? props.blockers.join(", ") : "None"}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h3 className="font-semibold">Warnings</h3>
          <p className="mt-2 text-sm text-slate-300">{props.warnings.length ? props.warnings.join(", ") : "None"}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h3 className="font-semibold">Next actions</h3>
          <p className="mt-2 text-sm text-slate-300">{props.nextActions.length ? props.nextActions.join(", ") : "Review route"}</p>
        </div>
      </div>
    </section>
  );
}