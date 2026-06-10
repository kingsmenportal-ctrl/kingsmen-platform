const hidden = [
  "Exact institutions",
  "Exact companies",
  "Portal links",
  "Programme targets",
  "Bursary targets",
  "Accommodation targets",
  "Manual route plans",
  "Managed execution details"
];

export function DestinyMapPreviewPanel() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Free Destiny Map</p>
      <h2 className="mt-2 text-3xl font-black text-slate-950">R0 preview, 0 managed applications.</h2>
      <p className="mt-4 text-sm text-slate-600">
        The free map shows the route universe preview. Exact targets and execution paths unlock only after package activation.
      </p>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {hidden.map((item) => (
          <div key={item} className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">Sealed: {item}</div>
        ))}
      </div>
    </section>
  );
}