export function MobileStatusCardsPanel() {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900 p-5 text-white">
      <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Status cards</p>
      <h2 className="mt-2 text-2xl font-black">Visible progress, no fake official claims</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-white/5 p-4">
          <h3 className="font-bold">Documents</h3>
          <p className="text-sm text-slate-300">Readiness and missing evidence only.</p>
        </div>
        <div className="rounded-2xl bg-white/5 p-4">
          <h3 className="font-bold">Routes</h3>
          <p className="text-sm text-slate-300">Source confidence, deadlines, manual fallback.</p>
        </div>
        <div className="rounded-2xl bg-white/5 p-4">
          <h3 className="font-bold">Payments</h3>
          <p className="text-sm text-slate-300">Activation/evidence, not refund decisions.</p>
        </div>
      </div>
    </section>
  );
}