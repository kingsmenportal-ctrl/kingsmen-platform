const pathways = [
  ["higher_education", "Higher Education", "University and other higher-education pathways."],
  ["tvet", "TVET", "Technical and vocational education opportunities."],
  ["seta_learnership", "SETA programmes & learnerships", "Work-integrated learning and learnership routes."],
  ["internship", "Internships", "Early-career and workplace learning opportunities."],
  ["apprenticeship", "Apprenticeships", "Trade and structured apprenticeship opportunities."],
  ["employment", "Employment", "Vacancies and career opportunities."]
] as const;

const actions = [
  { href: "/candidate/workbench", title: "Application workbench", description: "Save preparation progress and select a priority pathway." },
  { href: "/candidate/applications", title: "My application tracker", description: "Track saved applications and candidate-reported preparation/submission events." },
  { href: "/candidate/documents", title: "Private Document Vault", description: "Upload, reuse and track your private candidate documents." },
  { href: "/candidate/opportunity-matches", title: "Verified opportunities", description: "Review listings only when their publication gates are satisfied." }
];

export default function CandidateDashboardPage() {
  return <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Kingsmen Portal · South Africa</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">Candidate dashboard</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          One candidate account and reusable profile context across all six pathways. A package changes service intensity and usage allowances, not opportunity discovery. Your personal records remain restricted until an authorised identity reviewer verifies the link to your candidate record.
        </p>
        <nav aria-label="Candidate navigation" className="mt-5 flex flex-wrap gap-3">
          <a href="/candidate/login" className="rounded-xl bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950">Sign in / create account</a>
          <a href="/candidate/workbench" className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold">Open workbench</a>
          <a href="/candidate/documents" className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold">Document Vault</a>
          <a href="/candidate/opportunity-matches" className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold">Opportunity matches</a>
        </nav>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {actions.map((action) => <a key={action.href} href={action.href} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-cyan-700">
          <h2 className="text-lg font-bold">{action.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">{action.description}</p>
          <span className="mt-4 inline-block text-sm font-semibold text-cyan-300">Open module →</span>
        </a>)}
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><h2 className="text-2xl font-bold">One catalogue · Six pathways</h2><p className="mt-2 text-sm text-slate-400">These are discovery pathways, not six separate Kingsmen accounts or forms.</p></div>
          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">National scope</span>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {pathways.map(([code,label,description]) => <article key={code} data-gate={code} className="rounded-2xl border border-slate-800 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Pathway</p>
            <h3 className="mt-2 font-bold">{label}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
            <p className="mt-3 text-xs text-slate-500">Available for discovery; eligibility and opening status require evidence.</p>
          </article>)}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="font-bold">Truth and safety boundary</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">An opportunity directory is not proof of an open programme. Candidate-reported actions are distinct from provider-confirmed receipt and outcomes. Kingsmen AI offers decision support; it cannot promise admission, funding, accommodation or employment, and cannot independently mark a payment settled or an application submitted.</p>
      </section>
    </div>
  </main>;
}
