import { CandidateSessionControl } from "../../../components/candidate/CandidateSessionControl";

const pathways = [
  ["higher_education", "Higher Education", "Universities, Universities of Technology and CAO programme choices."],
  ["tvet", "TVET", "Technical and vocational routes, college programmes and occupational learning."],
  ["seta_learnership", "SETA programmes & learnerships", "Skills programmes, learnerships and workplace learning."],
  ["internship", "Internships", "Structured work exposure and early-career experience."],
  ["apprenticeship", "Apprenticeships", "Trade training and practical artisan pathways."],
  ["employment", "Employment", "Job discovery, application preparation and work readiness."]
] as const;

const workspaceLinks = [
  {
    href: "/candidate/workbench",
    number: "01",
    title: "Application workbench",
    description: "Review readiness across the six pathways and prepare a route plan.",
    action: "Open workbench"
  },
  {
    href: "/candidate/opportunity-matches",
    number: "02",
    title: "Verified opportunity matches",
    description: "Load candidate-specific opportunities that pass official-source and current-opening gates.",
    action: "Load verified matches"
  },
  {
    href: "/candidate/saved-opportunities",
    number: "03",
    title: "Saved opportunities",
    description: "Open the saved-items workspace. Account-backed saved-item persistence is not yet confirmed.",
    action: "View saved items"
  },
  {
    href: "/candidate/documents",
    number: "04",
    title: "Private Document Vault",
    description: "Review upload requirements and the secure-storage boundary before handling files.",
    action: "Open documents"
  },
  {
    href: "/personal-job-desk/application-tracker",
    number: "05",
    title: "Application tracker",
    description: "Review reported progress. Provider receipt and outcomes require provider-origin evidence.",
    action: "Track progress"
  },
  {
    href: "/candidate/finance",
    number: "06",
    title: "Plans and finance",
    description: "Compare canonical service prices and understand payment-status rules.",
    action: "View plans and finance"
  }
] as const;

export const metadata = {
  title: "Candidate dashboard | Kingsmen Portal",
  description: "Kingsmen candidate workspace across six South African opportunity pathways."
};

export default function CandidateDashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-3 rounded focus:outline-none focus:ring-2 focus:ring-amber-300">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-amber-200 to-amber-500 text-lg font-black text-slate-950">K</span>
            <span><strong className="block text-sm tracking-[0.18em]">KINGSMEN</strong><span className="mt-1 block text-xs text-slate-300">CANDIDATE PORTAL</span></span>
          </a>
          <nav aria-label="Candidate navigation" className="flex flex-wrap items-center gap-4 text-sm text-slate-200">
            <a className="hover:text-amber-200" href="/free-destiny-map/">Free Destiny Map</a>
            <a className="hover:text-amber-200" href="/packages/">Packages</a>
            <a className="rounded-lg border border-slate-600 px-3 py-2 font-semibold hover:border-amber-300 hover:text-amber-200" href="/candidate/workbench">Application workbench</a>
            <CandidateSessionControl />
          </nav>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-6 text-white shadow-sm sm:p-9">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-amber-300">One profile · One journey</p>
              <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-5xl">Your opportunity command centre.</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">Plan study, skills, training and employment routes in one workspace. Every candidate can discover all six pathways; service plans determine priority application volume and managed-route capacity, not dignity or pathway access.</p>
            </div>
            <a href="/free-destiny-map/#intake" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-amber-300 px-5 py-3 text-sm font-extrabold text-slate-950 hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-slate-950">Update route intent <span aria-hidden="true" className="ml-2">↗</span></a>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Pathway discovery</p><p className="mt-2 text-2xl font-extrabold text-amber-300">6 of 6</p><p className="mt-1 text-xs text-slate-300">Available across every plan</p></div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Verified openings</p><p className="mt-2 text-lg font-extrabold text-white">Load live matches</p><p className="mt-1 text-xs text-slate-300">Shown only when evidence gates pass</p></div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Service status</p><p className="mt-2 text-lg font-extrabold text-white">Evidence-led</p><p className="mt-1 text-xs text-slate-300">No invented saved, submitted or paid states</p></div>
          </div>
        </section>

        <section className="mt-9" aria-labelledby="pathways-heading">
          <div className="mb-4"><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-700">Explore every route</p><h2 id="pathways-heading" className="mt-2 text-2xl font-extrabold tracking-tight">The six Kingsmen pathways</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Funding and accommodation support can complement relevant routes; they do not replace any of the six core pathways.</p></div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {pathways.map(([code, label, description], index) => (
              <a key={code} href="/free-destiny-map/#intake" data-gate={code} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500">
                <div className="flex items-start justify-between gap-4"><span className="text-xs font-extrabold tracking-[0.16em] text-amber-700">{String(index + 1).padStart(2, "0")} / PATHWAY</span><span aria-hidden="true" className="text-lg text-slate-400 transition group-hover:text-amber-700">↗</span></div>
                <h3 className="mt-4 font-bold text-slate-950">{label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                <p className="mt-4 text-xs font-semibold text-slate-500">Available for discovery</p>
              </a>
            ))}
          </div>
        </section>

        <section className="mt-10" aria-labelledby="workspace-heading">
          <div className="mb-4"><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-700">Your workspace</p><h2 id="workspace-heading" className="mt-2 text-2xl font-extrabold tracking-tight">Continue your journey</h2></div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {workspaceLinks.map((item) => (
              <article key={item.href} className="flex min-h-56 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-extrabold tracking-[0.16em] text-amber-700">WORKSPACE {item.number}</p>
                <h3 className="mt-3 text-lg font-bold text-slate-950">{item.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{item.description}</p>
                <a className="mt-5 inline-flex min-h-11 items-center self-start rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:border-slate-500 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500" href={item.href}>{item.action}<span aria-hidden="true" className="ml-2">→</span></a>
              </article>
            ))}
          </div>
        </section>

        <aside className="mt-9 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6" aria-labelledby="status-boundary-heading">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-amber-800">Status integrity</p>
          <h2 id="status-boundary-heading" className="mt-2 text-lg font-bold text-slate-950">Your progress should be based on evidence.</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">This dashboard is a navigation workspace. It does not itself prove that a profile has been saved, a programme is open, a provider has received an application, a payment has settled, or a document has been verified. Those states require authenticated backend records and appropriate provider or payment evidence. The dashboard does not claim that a profile has been saved. No admission, funding, placement, employment, or success is guaranteed.</p>
        </aside>

        <footer className="mt-8 flex flex-col gap-2 border-t border-slate-200 py-5 text-xs leading-5 text-slate-500 sm:flex-row sm:justify-between"><span>© Kingsmen Portal · South Africa</span><span>Private candidate information should only be handled through authenticated routes.</span></footer>
      </div>
    </main>
  );
}
