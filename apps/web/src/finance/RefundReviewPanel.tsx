export function RefundReviewPanel() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Refund Review</p>
      <h2 className="text-2xl font-bold text-slate-950">No AI refund approval</h2>
      <p className="mt-2 text-sm text-slate-600">
        Refunds require human approval, evidence, reason, and audit trail. Airtable cannot make payment truth and AI cannot approve refunds.
      </p>
    </section>
  );
}