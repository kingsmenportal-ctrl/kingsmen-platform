export function PhoenixFallbackPanel() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phoenix Fallback</p>
      <h2 className="text-2xl font-bold text-slate-950">No false rescue</h2>
      <p className="mt-2 text-sm text-slate-600">
        Phoenix fallback only proposes evidence-backed alternative routes after failure. It requires human review and cannot pretend rescue exists when source confidence or route evidence is weak.
      </p>
    </section>
  );
}