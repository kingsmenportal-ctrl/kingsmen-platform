const packages = [
  {
    name: "Free Destiny Map",
    price: "R0",
    detail: "All-sector preview only. 0 managed applications. Exact targets remain sealed."
  },
  {
    name: "CV Revamp",
    price: "R49.99",
    detail: "15 personalised CV versions and 15 matching motivation letters. Truthful only."
  },
  {
    name: "Accommodation Support",
    price: "R179.00",
    detail: "8 accommodation applications/routes standalone. Paid packages include up to 8 ACC-01 routes."
  }
];

export function PricingBoundaryPanel() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pricing Boundary</p>
      <h2 className="mt-2 text-3xl font-black text-slate-950">Packages control campaign weight, not dignity.</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {packages.map((item) => (
          <article key={item.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="font-bold text-slate-950">{item.name}</h3>
            <p className="mt-2 text-2xl font-black text-slate-950">{item.price}</p>
            <p className="mt-2 text-sm text-slate-600">{item.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}