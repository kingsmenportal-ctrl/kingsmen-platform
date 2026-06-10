export function SourceReviewPanel() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Source Review</p>
      <h2 className="text-2xl font-bold text-slate-950">Review before candidate-facing use</h2>
      <p className="mt-2 text-sm text-slate-600">
        Low-confidence, stale, changed, or unofficial observations are held for review before they become route recommendations.
      </p>
    </section>
  );
}