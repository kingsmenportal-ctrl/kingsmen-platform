export function FinanceRuntimePanel() {
  const cards = [
    "Plan Catalog",
    "Orders",
    "Invoices",
    "PayFast Intents",
    "ITN Receipts",
    "Payments",
    "Refund Reviews",
    "Finance Ledger",
    "Payment Evidence"
  ];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">N10 Finance / PayFast Runtime</p>
      <h2 className="mt-2 text-3xl font-black text-slate-950">PostgreSQL finance truth, PayFast processing</h2>
      <p className="mt-3 max-w-3xl text-sm text-slate-600">
        PayFast processes payment collection. Kingsmen activates paid status only after verified ITN evidence, signature checks, amount checks, and idempotent ledger entry.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <article key={card} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-semibold text-slate-950">{card}</h3>
            <p className="mt-2 text-xs text-slate-500">Evidence-backed finance surface.</p>
          </article>
        ))}
      </div>
    </section>
  );
}