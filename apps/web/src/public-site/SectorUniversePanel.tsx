const sectors = [
  "Universities",
  "TVET Colleges",
  "SETA / QCTO / Skills",
  "Learnerships",
  "Employers / Internships",
  "Bursaries / Scholarships",
  "NSFAS Support",
  "CAO Route Planning",
  "Accommodation",
  "Verified Private Colleges"
];

export function SectorUniversePanel() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Route Universe</p>
      <h2 className="mt-2 text-3xl font-black text-slate-950">All sectors visible from day one.</h2>
      <p className="mt-3 text-sm text-slate-600">
        Sector access is not dignity-gated. Exact route intelligence is sealed until activation, but the universe remains visible.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sectors.map((sector) => (
          <div key={sector} className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">{sector}</div>
        ))}
      </div>
    </section>
  );
}