"use client";

const pathways = [
  { number: "01", title: "Higher education", detail: "Universities, universities of technology and CAO programme choices." },
  { number: "02", title: "TVET", detail: "TVET colleges, NC(V), NATED and occupational progression." },
  { number: "03", title: "SETA programmes & learnerships", detail: "Skills programmes, funded training and learnership routes." },
  { number: "04", title: "Internships", detail: "Graduate, workplace-learning and industry experience." },
  { number: "05", title: "Apprenticeships", detail: "Trade, artisan and occupational training opportunities." },
  { number: "06", title: "Employment", detail: "Vacancies, job applications, CV readiness and follow-up." }
] as const;

const workspaces = [
  { title: "My candidate profile", detail: "Create or update your reusable Kingsmen profile. New profiles require explicit processing consent and receive a candidate reference.", href: "/candidate/profile", label: "PROFILE & CONSENT" },
  { title: "Identity review", detail: "Request a human-reviewed link to an existing Kingsmen candidate record. Email equality is never used as proof of identity.", href: "/candidate/identity-review", label: "HUMAN VERIFICATION" },
  { title: "Opportunity discovery", detail: "Explore the national catalogue across all six pathways. Only verified, current and open opportunities may be presented as open.", href: "/candidate/opportunity-matches", label: "SOURCE-VERIFIED DISCOVERY" },
  { title: "Master application & tracker", detail: "Prepare one Kingsmen application with provider and programme choices underneath it. Preparation is not provider submission.", href: "/candidate/applications", label: "ONE APPLICATION JOURNEY" },
  { title: "Private Document Vault", detail: "Upload and retrieve documents through authenticated, owner-checked server routes and private storage.", href: "/candidate/documents", label: "PRIVATE DOCUMENTS" },
  { title: "Preparation & outcomes", detail: "Review evidence-backed application progress. Candidate-reported submission remains distinct from provider-confirmed receipt and decisions.", href: "/candidate/applications", label: "EVIDENCE-LED TRACKING" }
] as const;

export default function CandidatePortalPage() {
  return (
    <main className="min-h-screen bg-[#071426] text-[#f4f0e6]">
      <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-300/20 pb-6">
          <a href="/" className="flex items-center gap-3" aria-label="Kingsmen home">
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-amber-300/50 bg-[#102747] text-lg font-black text-amber-300">K</span>
            <span><span className="block text-xs font-black uppercase tracking-[0.24em] text-amber-300">KINGSMEN ONE</span><span className="block text-sm text-slate-300">Candidate workspace</span></span>
          </a>
          <nav className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-200" aria-label="Candidate navigation">
            <a className="hover:text-amber-300" href="/free-destiny-map">Destiny Map</a>
            <a className="hover:text-amber-300" href="/candidate/workbench">Workbench</a>
            <a className="rounded-xl border border-slate-500/70 px-4 py-2" href="/candidate/login?next=%2Fcandidate%2Fprofile">Sign in</a>
            <a className="rounded-xl border border-amber-300/50 px-4 py-2 text-amber-200" href="/candidate/login?next=%2Fcandidate%2Fprofile">Create account</a>
          </nav>
        </header>

        <section className="grid gap-8 py-12 lg:grid-cols-[1.3fr_0.7fr] lg:items-end lg:py-16">
          <div>
            <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.24em] text-amber-300">One candidate account · one reusable profile · six pathways</p>
            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">One Kingsmen journey for education and work.</h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">Create your account, complete your profile and manage applications across South Africa's education, skills and employment pathways from one connected workspace.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="/candidate/login?next=%2Fcandidate%2Fprofile" className="rounded-xl bg-amber-300 px-5 py-3 text-sm font-extrabold text-[#101b2a]">Create account / sign in</a>
              <a href="/free-destiny-map" className="rounded-xl border border-slate-500/70 px-5 py-3 text-sm font-bold text-white">Explore Free Destiny Map</a>
            </div>
          </div>
          <aside className="rounded-3xl border border-amber-300/25 bg-gradient-to-br from-[#112b4d] to-[#0a192d] p-6 sm:p-7">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-amber-300">Identity and evidence boundary</p>
            <h2 className="mt-3 text-2xl font-bold text-white">Evidence before access or status.</h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
              <li>New registrations create their own provisional profile only after email confirmation and explicit consent.</li>
              <li>Older Kingsmen records are linked only after authorised human review.</li>
              <li>Saved plans are not proof of provider submission or acceptance.</li>
            </ul>
          </aside>
        </section>

        <section className="py-6" aria-labelledby="workspace-heading">
          <div className="mb-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-amber-300">Your workspace</p>
            <h2 id="workspace-heading" className="mt-2 text-2xl font-bold text-white sm:text-3xl">Candidate services</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">Protected actions require your authenticated account. The workspace displays persisted backend states; it does not invent application counts, verified identities or provider outcomes.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {workspaces.map((item) => (
              <article key={item.href + item.title} className="flex h-full flex-col rounded-2xl border border-slate-700 bg-[#0b1d33] p-5 transition hover:border-amber-300/50">
                <p className="text-[10px] font-extrabold tracking-[0.18em] text-amber-300">{item.label}</p>
                <h3 className="mt-3 text-xl font-bold text-white">{item.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-slate-300">{item.detail}</p>
                <a href={item.href} className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-amber-200">Open workspace <span aria-hidden="true">→</span></a>
              </article>
            ))}
          </div>
        </section>

        <section className="py-12" aria-labelledby="pathways-heading">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-amber-300">South Africa · national scope</p>
          <h2 id="pathways-heading" className="mt-2 text-2xl font-bold text-white sm:text-3xl">Six pathways. One Kingsmen application journey.</h2>
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
          <h2 className="text-2xl font-bold text-white">When a provider portal blocks progress</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">Where supported, MAP and Phoenix manual fallbacks preserve the next step. CAPTCHA, OTP, portal failure or missing source evidence must never be represented as a successful submission.</p>
          <a href="/candidate/support" className="mt-5 inline-flex rounded-xl border border-amber-300/50 px-5 py-3 text-sm font-bold text-amber-200">Open support centre</a>
        </section>
        <footer className="flex flex-wrap justify-between gap-3 border-t border-slate-800 py-6 text-xs leading-5 text-slate-500">
          <span>© Kingsmen One · Candidate workspace</span>
          <span>Privacy-conscious · Evidence-led · Human decisions retained</span>
        </footer>
      </div>
    </main>
  );
}
