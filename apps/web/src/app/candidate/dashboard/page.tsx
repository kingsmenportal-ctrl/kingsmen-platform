const pathways = [
  ["higher_education", "Higher Education", "Universities and degree programmes"],
  ["tvet", "TVET", "Technical and vocational college routes"],
  ["seta_learnership", "SETA programmes & learnerships", "Skills programmes and learnership opportunities"],
  ["internship", "Internships", "Workplace experience opportunities"],
  ["apprenticeship", "Apprenticeships", "Trade training and artisan pathways"],
  ["employment", "Employment", "Jobs and employer application routes"]
] as const;

const workspaceLinks = [
  {
    href: "/candidate/workbench",
    title: "Application workbench",
    description: "Review pathway readiness and manage your application journey.",
    action: "Open workbench"
  },
  {
    href: "/candidate/opportunity-matches",
    title: "Opportunity matches",
    description: "Explore matching routes. An item is not an open opportunity until its source and current opening evidence are verified.",
    action: "View matches"
  },
  {
    href: "/candidate/saved-opportunities",
    title: "Saved opportunities",
    description: "Return to opportunities you have saved.",
    action: "View saved"
  },
  {
    href: "/candidate/documents",
    title: "Document vault",
    description: "Access the document area for application supporting files.",
    action: "Open documents"
  },
  {
    href: "/personal-job-desk/application-tracker",
    title: "Application tracker",
    description: "Review application tracking information and reported progress.",
    action: "Track applications"
  }
] as const;

export default function CandidateDashboardPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">KINGSMEN PORTAL</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Your opportunity command centre</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200 sm:text-base">
          One profile and one application workbench across all six pathways. Your package affects managed service capacity, not which pathways you can discover.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a className="inline-flex min-h-11 items-center justify-center rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-slate-950" href="/candidate/workbench">
            Open application workbench
          </a>
          <a className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-500 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-white" href="/candidate/opportunity-matches">
            Explore opportunities
          </a>
        </div>
      </header>

      <section className="mt-8" aria-labelledby="pathways-heading">
        <div className="mb-4">
          <h2 id="pathways-heading" className="text-xl font-bold text-slate-900">All six pathways</h2>
          <p className="mt-1 text-sm text-slate-600">Pathway access is universal. Current openings and eligibility still require evidence-based verification.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pathways.map(([code, label, description]) => (
            <article key={code} data-gate={code} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500" />
                <div>
                  <h3 className="font-semibold text-slate-900">{label}</h3>
                  <p className="mt-2 text-sm leading-5 text-slate-600">{description}</p>
                  <p className="mt-3 text-xs font-medium text-slate-500">Available for discovery</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-9" aria-labelledby="workspace-heading">
        <h2 id="workspace-heading" className="text-xl font-bold text-slate-900">Your workspace</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {workspaceLinks.map((item) => (
            <article key={item.href} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-5 text-slate-600">{item.description}</p>
              <a className="mt-4 inline-flex min-h-10 items-center self-start rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:border-slate-500 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500" href={item.href}>
                {item.action} <span aria-hidden="true" className="ml-2">→</span>
              </a>
            </article>
          ))}
        </div>
      </section>

      <aside className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5" aria-labelledby="status-boundary-heading">
        <h2 id="status-boundary-heading" className="font-semibold text-slate-900">Application status and safety</h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          This dashboard is navigation and guidance; it does not claim that a profile has been saved, an opportunity is currently open, a provider has received an application, or a payment has settled. Provider receipt and outcomes require provider-origin evidence. No admission, funding, placement, employment, or success is guaranteed.
        </p>
      </aside>
    </main>
  );
}
