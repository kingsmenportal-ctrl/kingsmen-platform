import { ApplicationWorkbenchPanel } from "@/application-workbench/ApplicationWorkbenchPanel";
import { RouteReadinessPanel } from "@/application-workbench/RouteReadinessPanel";

const pathways = [
  ["higher_education", "Higher Education"],
  ["tvet", "TVET"],
  ["seta_learnership", "SETA programmes & learnerships"],
  ["internship", "Internships"],
  ["apprenticeship", "Apprenticeships"],
  ["employment", "Employment"],
] as const;

export default function CandidateWorkbenchPage() {
  return (
    <main className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-8 text-slate-100 sm:px-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-400">Candidate portal</p>
        <h1 className="text-3xl font-semibold tracking-tight">Application Workbench</h1>
        <p className="max-w-3xl text-sm leading-6 text-slate-300">
          One candidate profile and one unified application journey across all six pathways.
          Package level changes priority service and capacity, not access to the opportunity catalogue.
        </p>
      </header>

      <section aria-label="Six application pathways" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {pathways.map(([code, label]) => (
          <article key={code} data-gate={code} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">Pathway</p>
            <h2 className="mt-2 font-semibold">{label}</h2>
            <p className="mt-2 text-sm leading-5 text-slate-400">
              Catalogue access is not limited by plan. Route-specific readiness requires current source and eligibility evidence.
            </p>
          </article>
        ))}
      </section>

      <section aria-label="Workbench connection status" className="rounded-2xl border border-amber-700/60 bg-amber-950/30 p-5">
        <h2 className="font-semibold text-amber-100">Live candidate route records are not connected</h2>
        <p className="mt-2 text-sm leading-6 text-amber-50/90">
          No authenticated route records were loaded. This page will not invent opportunities, readiness scores,
          source verification, payment status, submissions, or outcomes.
        </p>
      </section>

      <ApplicationWorkbenchPanel candidateName="Candidate" routes={[]} />
      <RouteReadinessPanel
        status="Not assessed — candidate session and route evidence unavailable"
        blockers={["Authenticated candidate route data is not connected"]}
        warnings={["Do not treat catalogue entries as verified open opportunities"]}
        nextActions={["Connect the authenticated profile and route API", "Load verified source, eligibility, deadline, and document evidence"]}
      />

      <section aria-label="CAO parent child rule" className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
        <h2 className="text-lg font-semibold">CAO: one parent application</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          A CAO journey is one Kingsmen parent application. Programme preferences are child choices and must not be
          counted as separate Kingsmen applications. No CAO application is created or submitted by this page.
        </p>
      </section>

      <p className="text-xs leading-5 text-slate-500">
        Kingsmen can assist with preparation and routing, but cannot guarantee admission, funding, placement, or employment.
        Provider receipt and provider decisions require separate evidence.
      </p>
    </main>
  );
}
