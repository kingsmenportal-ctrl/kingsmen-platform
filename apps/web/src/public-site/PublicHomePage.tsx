export function PublicHomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Kingsmen</p>
        <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight">Your private route command house.</h1>
        <p className="mt-6 max-w-3xl text-lg text-slate-300">
          Direction, protection, positioning, evidence, route intelligence, document readiness, fallback planning, and managed execution across study, work, funding, skills, CV, and accommodation routes.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a className="rounded-2xl bg-cyan-300 px-5 py-3 font-bold text-slate-950" href="/destiny-map">Start Free Destiny Map</a>
          <a className="rounded-2xl border border-white/20 px-5 py-3 font-bold text-white" href="/pricing">See Packages</a>
        </div>
      </section>
    </main>
  );
}