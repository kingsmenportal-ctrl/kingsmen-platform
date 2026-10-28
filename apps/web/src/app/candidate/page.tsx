const pathways = [
  { number: "01", title: "Higher education", detail: "Universities, universities of technology and CAO programme choices." },
  { number: "02", title: "TVET & college", detail: "College routes, qualifications and progression options." },
  { number: "03", title: "SETA & learnerships", detail: "Skills programmes, learnerships and funded training routes." },
  { number: "04", title: "Internships & apprenticeships", detail: "Workplace learning and occupational experience." },
  { number: "05", title: "Employment", detail: "Job-search preparation, applications and follow-up." },
  { number: "06", title: "Funding & support", detail: "NSFAS guidance, bursaries, scholarships and relevant support." },
];

const workspaces = [
  { title: "Free Destiny Map", detail: "Describe your current stage and explore a starting route.", href: "/free-destiny-map", action: "Start route discovery", tag: "FREE STARTING POINT" },
  { title: "Private Document Vault", detail: "Upload and manage documents linked to your candidate work. Sign-in and server checks are required.", href: "/candidate/documents", action: "Open document vault", tag: "PRIVATE WORKSPACE" },
  { title: "Candidate support", detail: "Find the manual-assistance path for portal blockers, deadline risk and source uncertainty.", href: "/candidate/support", action: "Open support centre", tag: "EMAIL-FIRST" },
];

export default function CandidatePortalPage() {
  return (
    <main className="min-h-screen bg-[#071426] text-[#f4f0e6]">
      <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-300/20 pb-6">
          <a href="/" className="flex items-center gap-3" aria-label="Kingsmen home">
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-amber-300/50 bg-[#102747] text-lg font-black text-amber-300">K</span>
            <span>
              <span className="block text-xs font-bold uppercase tracking-[0.24em] text-amber-300">KINGSMEN ONE</span>
              <span className="block text-sm text-slate-300">Candidate workspace</span>
            </span>
          </a>
          <nav className="flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-200" aria-label="Main navigation">
            <a className="hover:text-amber-300" href="/free-destiny-map">Destiny Map</a>
            <a className="hover:text-amber-300" href="/candidate/documents">Documents</a>
            <a className="hover:text-amber-300" href="/candidate/support">Support</a>
            <a className="rounded-xl border border-amber-300/50 px-4 py-2 text-amber-200 hover:bg-amber-300/10" href="/jarvis">Jarvis</a>
          </nav>
        </header>

        <section className="grid gap-8 py-12 lg:grid-cols-[1.35fr_0.65fr] lg:items-end lg:py-16">
          <div>
            <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.24em] text-amber-300">One platform · six pathways · evidence-led progress</p>
            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">Your next step deserves a clear route.</h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">Kingsmen brings education, skills development, funding guidance and employment pathways into one candidate workspace—so your preparation, documents and follow-up can be managed with clearer evidence and fewer disconnected steps.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="/free-destiny-map" className="rounded-xl bg-amber-300 px-5 py-3 text-sm font-extrabold text-[#101b2a] shadow-lg shadow-amber-950/20 hover:bg-amber-200">Start Free Destiny Map <span aria-hidden="true">→</span></a>
              <a href="/candidate/documents" className="rounded-xl border border-slate-500/70 px-5 py-3 text-sm font-bold text-white hover:border-amber-300/60">Open Document Vault</a>
            </div>
          </div>
          <aside className="rounded-3xl border border-amber-300/25 bg-gradient-to-br from-[#112b4d] to-[#0a192d] p-6 sm:p-7">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-amber-300">Trust by design</p>
            <h2 className="mt-3 text-2xl font-bold text-white">Evidence before status.</h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
              <li><span className="mr-2 text-amber-300">✓</span>A listed institution is not proof that a programme is open.</li>
              <li><span className="mr-2 text-amber-300">✓</span>Your reported submission is kept distinct from provider confirmation.</li>
              <li><span className="mr-2 text-amber-300">✓</span>Official decisions remain with the institution or employer.</li>
            </ul>
          </aside>
        </section>

        <section aria-labelledby="workspace-heading" className="py-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-amber-300">Your tools</p>
              <h2 id="workspace-heading" className="mt-2 text-2xl font-bold text-white sm:text-3xl">Candidate workspace</h2>
            </div>
            <p className="max-w-lg text-sm leading-6 text-slate-400">Protected actions require an authenticated session. This page does not fabricate application counts, review states or saved progress.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {workspaces.map((item) => (
              <article key={item.href} className="flex h-full flex-col rounded-2xl border border-slate-700 bg-[#0b1d33] p-5 transition hover:border-amber-300/50">
                <p className="text-[10px] font-extrabold tracking-[0.18em] text-amber-300">{item.tag}</p>
                <h3 className="mt-3 text-xl font-bold text-white">{item.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-slate-300">{item.detail}</p>
                <a href={item.href} className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-amber-200 hover:text-amber-100">{item.action} <span aria-hidden="true">→</span></a>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="pathways-heading" className="py-12">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-amber-300">South Africa · national scope</p>
          <h2 id="pathways-heading" className="mt-2 text-2xl font-bold text-white sm:text-3xl">Six pathways. One Kingsmen application journey.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">A Kingsmen application can organise multiple programme choices under one parent application where the provider process supports it. Each opportunity still needs current source evidence, eligibility checks and its own submission requirements.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pathways.map((item) => (
              <article key={item.number} className="rounded-2xl border border-slate-700/90 bg-[#0a1a2e] p-5">
                <p className="text-xs font-black tracking-[0.18em] text-amber-300">{item.number}</p>
                <h3 className="mt-2 text-lg font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mb-10 rounded-3xl border border-slate-700 bg-[#0a1a2e] p-6 sm:p-8">
          <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-amber-300">When a portal blocks progress</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Keep the next step honest and actionable.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">If a provider portal is down or requires a CAPTCHA or OTP, Kingsmen must not claim submission. Manual Application Package (MAP) and Phoenix fallback procedures are used where supported, with evidence recorded before status changes.</p>
            </div>
            <a href="/candidate/support" className="inline-flex justify-center rounded-xl border border-amber-300/50 px-5 py-3 text-sm font-bold text-amber-200 hover:bg-amber-300/10">Get support <span aria-hidden="true" className="ml-2">→</span></a>
          </div>
        </section>

        <footer className="flex flex-wrap justify-between gap-3 border-t border-slate-800 py-6 text-xs leading-5 text-slate-500">
          <span>© Kingsmen One · Candidate workspace</span>
          <span>Privacy-conscious · Evidence-led · Human decisions retained</span>
        </footer>
      </div>
    </main>
  );
}
