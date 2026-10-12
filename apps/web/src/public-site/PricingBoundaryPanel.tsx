const packages = [
  { name: "Free Destiny Map", price: "R0", detail: "All-sector preview only. 0 managed applications. Exact targets remain sealed." },
  { name: "CV Revamp", price: "R49.99", detail: "15 personalised truthful CV versions and 15 matching motivation letters. One-off pack; 3-business-day delivery target after complete intake." },
  { name: "Artisan Charter", price: "R149.99", detail: "3 concurrent managed-route slots for 30 calendar days; work and skills focus." },
  { name: "Foundational Accord", price: "R169.99", detail: "4 concurrent managed-route slots for 30 calendar days across the six core gates." },
  { name: "Guildmaster's Charter", price: "R199.99", detail: "5 concurrent managed-route slots for 30 calendar days with increased work/skills monitoring." },
  { name: "Collegiate Ordinance", price: "R299.99", detail: "8 concurrent managed-route slots for 30 calendar days with higher monitoring priority." },
  { name: "Chancellor's Writ", price: "R399.99", detail: "10 concurrent managed-route slots for 30 calendar days with priority queue and deeper human review." },
  { name: "Regency Mandate", price: "R469.99", detail: "12 concurrent managed-route slots for 30 calendar days with highest queue priority and escalation depth." }
] as const;

export function PricingBoundaryPanel() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pricing Boundary</p>
      <h2 className="mt-2 text-3xl font-black text-slate-950">Packages control campaign weight, not dignity.</h2>
      <p className="mt-3 text-sm text-slate-600">Business-hour response targets begin after complete intake and are targets, not outcome guarantees. Accommodation support, where relevant, uses one managed-route slot and carries no separate fee. Package terms are pending founder approval; paid checkout remains disabled until approval and staging validation.</p>
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
