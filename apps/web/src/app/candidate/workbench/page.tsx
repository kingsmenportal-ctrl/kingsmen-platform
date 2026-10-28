"const gates = [
  ["01", "Higher education", "Universities, universities of technology and CAO programme choices.", "HIGHER_EDUCATION"],
  ["02", "TVET & college", "NC(V), NATED, Report 191 and college progression.", "TVET"],
  ["03", "SETA & learnerships", "Skills programmes, learnerships and occupational training.", "SETA_LEARNERSHIP"],
  ["04", "Internships", "Workplace experience and graduate-entry pathways.", "INTERNSHIP"],
  ["05", "Apprenticeships", "Trade and occupational learning routes.", "APPRENTICESHIP"],
  ["06", "Employment", "Job applications, CV preparation and follow-up.", "EMPLOYMENT"],
] as const;

const tasks = [
  { number: "01", title: "Master application", detail: "Maintain one reusable profile and plan multiple provider targets.", href: "/candidate/master-application", action: "Open master application", status: "CANDIDATE WORKSPACE" },
  { number: "02", title: "Identity review", detail: "Request authorised linking to an existing candidate record. Email alone is not proof of identity.", href: "/candidate/identity-review", action: "Manage identity review", status: "HUMAN REVIEW" },
  { number: "03", title: "Private Document Vault", detail: "Manage candidate documents through authenticated, owner-checked operations.", href: "/candidate/documents", action: "Open document vault", status: "PRIVATE DOCUMENTS" },
  { number: "04", title: "Preparation & tracking", detail: "Review preparation steps and distinguish a planned application from provider submission.", href: "/candidate/applications/preparation", action: "Review application tracking", status: "EVIDENCE-LED" },
  { number: "05", title: "Outcomes", detail: "View outcomes only when the workflow has supporting evidence.", href: "/candidate/outcomes", action: "View outcomes", status: "EVIDENCE REQUIRED" },
  { number: "06", title: "Destiny Map", detail: "Start with your current stage and identify a suitable route to investigate.", href: "/free-destiny-map", action: "Explore my route", status: "FREE STARTING POINT" },
] as const;

export default function CandidateWorkbenchPage() {
  return (
    <main className="min-h-screen bg-[#071426] text-[#f4f0e6]">
      <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-300/20 pb-6">
          <a href="/candidate" className="flex items-center gap-3" aria-label="Kingsmen candidate home">
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-amber-300/50 bg-[#102747] text-lg font-black text-amber-300">K</span>
            <span><span className="block text-xs font-black uppercase tracking-[0.24em] text-amber-300">KINGSMEN ONE</span><span className="block text-sm text-slate-300">Application workbench</span></span>
          </a>
          <nav aria-label="Candidate navigation" className="flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-200">
            <a className="hover:text-amber-300" href="/candidate">Candidate home</a>
            <a className="hover:text-amber-300" href="/candidate/documents">Documents</a>
            <a className="hover:text-amber-300" href="/candidate/support">Support</a>
            <a className="rounded-xl border border-amber-300/50 px-4 py-2 text-amber-200 hover:bg-amber-300/10" href="/candidate/login?next=%2Fcandidate%2Fmaster-application">Sign in</a>
          </nav>
        </header>

        <section className="grid gap-8 py-12 lg:grid-cols-[1.3fr_0.7fr] lg:items-end lg:py-16">
          <div>
            <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.24em] text-amber-300">One profile · six pathways · evidence-led progress</p>
            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">Your application journey, in one place.</h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">Maintain a reusable candidate profile, plan opportunities across education and work, organise private documents and track next steps without confusing preparation with official provider submission.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="/candidate/master-application" className="rounded-xl bg-amber-300 px-5 py-3 text-sm font-extrabold text-[#101b2a] hover:bg-amber-200">Open master application →</a>
              <a href="/candidate/identity-review" className="rounded-xl border border-slate-500/70 px-5 py-3 text-sm font-bold text-white hover:border-amber-300/60">Identity review</a>
            </div>
          </div>
          <aside className="rounded-3xl border border-amber-300/25 bg-gradient-to-br from-[#112b4d] to-[#0a192d] p-6 sm:p-7">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-amber-300">Account and evidence boundary</p>
            <h2 className="mt-3 text-2xl font-bold text-white">Secure by default.</h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
              <li><span className="mr-2 text-amber-300">✓</span>Use your existing account; do not create duplicates to bypass identity review.</li>
              <li><span className="mr-2 text-amber-300">✓</span>A saved plan is not a provider submission receipt.</li>
              <li><span className="mr-2 text-amber-300">✓</span>Provider decisions remain with the provider.</li>
            </ul>
          </aside>
        </section>

        <section aria-labelledby="tasks-heading" className="py-6">
          <div className="mb-5"><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-amber-300">Your next actions</p><h2 id="tasks-heading" className="mt-2 text-2xl font-bold text-white sm:text-3xl">Candidate workspace</h2></div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tasks.map((task) => (
              <article key={task.number} className="flex h-full flex-col rounded-2xl border border-slate-700 bg-[#0b1d33] p-5 transition hover:border-amber-300/50">
                <p className="text-[10px] font-extrabold tracking-[0.18em] text-amber-300">{task.status}</p>
                <h3 className="mt-3 text-xl font-bold text-white">{task.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-slate-300">{task.detail}</p>
                <a href={task.href} className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-amber-200 hover:text-amber-100">{task.action} <span aria-hidden="true">→</span></a>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="pathways-heading" className="py-12">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-amber-300">National scope · South Africa</p>
          <h2 id="pathways-heading" className="mt-2 text-2xl font-bold text-white sm:text-3xl">Six pathways. One managed journey.</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {gates.map(([number, label, detail, code]) => (
              <article key={code} data-gate={code} className="rounded-2xl border border-slate-700/90 bg-[#0a1a2e] p-5">
                <p className="text-xs font-black tracking-[0.18em] text-amber-300">{number}</p><h3 className="mt-2 text-lg font-bold text-white">{label}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="cao-heading" className="mb-8 rounded-3xl border border-amber-300/20 bg-[#0a1a2e] p-6 sm:p-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-amber-300">Application model</p>
          <h2 id="cao-heading" className="mt-2 text-2xl font-bold text-white">One parent application. Multiple programme choices.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">For processes such as CAO where one application contains several programme choices, Kingsmen should track one managed parent application with programme choices as child records. Every opportunity still requires current source evidence, eligibility checks and its own provider requirements.</p>
          <p className="mt-4 text-xs leading-5 text-slate-400">This workbench is a navigation surface, not proof of saved progress. Protected actions require an authenticated session; official submissions and outcomes are not fabricated by the browser.</p>
        </section>
      </div>
    </main>
  );
}
