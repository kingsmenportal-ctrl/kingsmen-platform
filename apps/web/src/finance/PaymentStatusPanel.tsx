export function PaymentStatusPanel() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment Status</p>
      <h2 className="text-2xl font-bold text-slate-950">Verified before activation</h2>
      <p className="mt-2 text-sm text-slate-600">
        Paid status requires PayFast ITN receipt, valid signature, matching amount, non-duplicate idempotency key, and payment evidence.
      </p>
    </section>
  );
}