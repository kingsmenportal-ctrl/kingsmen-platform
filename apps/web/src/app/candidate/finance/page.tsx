const plans = [
  { id: "foundational_accord", name: "Foundational Accord", price: "R169.99", applications: "5", capacity: "4", note: "Includes 8 accommodation routes." },
  { id: "collegiate_ordinance", name: "Collegiate Ordinance", price: "R299.99", applications: "10", capacity: "8", note: "Expanded service capacity." },
  { id: "chancellors_writ", name: "Chancellor’s Writ", price: "R399.99", applications: "15", capacity: "10", note: "High-volume application support." },
  { id: "regency_mandate", name: "Regency Mandate", price: "R469.99", applications: "15", capacity: "12", note: "Highest standard managed-route capacity." },
  { id: "artisan_charter", name: "Artisan Charter", price: "R149.99", applications: "5", capacity: "3", note: "A focused plan for technical and trade routes." },
  { id: "guildmasters_charter", name: "Guildmasters Charter", price: "R199.99", applications: "8", capacity: "5", note: "More room for multi-route planning." },
  { id: "cv_revamp", name: "CV Revamp", price: "R49.99", applications: "Standalone", capacity: "0", note: "15 CV versions and 15 motivation letters; target 3 business days." }
] as const;

export const metadata = {
  title: "Plans and finance | Kingsmen Portal",
  description: "Canonical Kingsmen plan prices and payment-status boundaries."
};

export default function CandidateFinancePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-3 rounded focus:outline-none focus:ring-2 focus:ring-amber-300">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-amber-200 to-amber-500 text-lg font-black text-slate-950">K</span>
            <span><strong className="block text-sm tracking-[0.18em]">KINGSMEN</strong><span className="mt-1 block text-xs text-slate-300">PLANS & FINANCE</span></span>
          </a>
          <nav aria-label="Candidate navigation" className="flex flex-wrap items-center gap-4 text-sm text-slate-200"><a className="hover:text-amber-200" href="/candidate/dashboard">Dashboard</a><a className="hover:text-amber-200" href="/packages/">Packages</a><a className="hover:text-amber-200" href="/candidate/workbench">Workbench</a></nav>
        </div>
      </header>

      <section className="bg-slate-950 px-4 py-10 text-white sm:px-6 sm:py-14">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-amber-300">Commercial terms overview</p>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">Plans and payment status.</h1>
          <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">Use the canonical service prices below when comparing plans. This page is visibility-only: it does not create an order, start PayFast checkout, or activate service entitlements.</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded-full border border-slate-700 px-3 py-2">Currency: ZAR</span><span className="rounded-full border border-slate-700 px-3 py-2">Settlement must be verified</span><span className="rounded-full border border-slate-700 px-3 py-2">No return-URL payment claims</span></div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-5"><h2 className="text-2xl font-extrabold tracking-tight">Canonical products</h2><p className="mt-2 text-sm leading-6 text-slate-600">Priority application allowance and concurrent managed-route capacity are separate entitlements. All six pathways remain available for discovery on every plan.</p></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.id} className={`flex flex-col rounded-2xl border p-5 shadow-sm ${plan.id === "foundational_accord" ? "border-amber-400 bg-white ring-1 ring-amber-200" : "border-slate-200 bg-white"}`}>
              <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-amber-700">{plan.id === "cv_revamp" ? "Standalone service" : "Paid service plan"}</p>
              <h3 className="mt-3 text-lg font-bold">{plan.name}</h3>
              <p className="mt-2 text-3xl font-extrabold tracking-tight">{plan.price}</p>
              <p className="mt-1 text-xs text-slate-500">ZAR · canonical displayed price</p>
              <div className="my-4 grid grid-cols-2 gap-3 border-y border-slate-200 py-4">
                <div><p className="text-2xl font-extrabold text-slate-950">{plan.applications}</p><p className="text-xs text-slate-600">Priority applications</p></div>
                <div><p className="text-2xl font-extrabold text-slate-950">{plan.capacity}</p><p className="text-xs leading-5 text-slate-600">Concurrent managed routes / 30 days</p></div>
              </div>
              <p className="flex-1 text-sm leading-6 text-slate-600">{plan.note}</p>
              <a href="/packages/" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold hover:border-slate-500 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500">Review plan details <span aria-hidden="true" className="ml-2">→</span></a>
            </article>
          ))}
        </div>

        <section className="mt-8 grid gap-4 lg:grid-cols-2" aria-label="Payment and refund rules">
          <article className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-amber-700">Payment evidence</p>
            <h2 className="mt-2 text-xl font-bold">A return page is not payment proof.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">Paid status requires a verified PayFast ITN or authorised finance-review evidence, including merchant, amount, signature, reference, status and idempotency checks. A browser redirect cannot mark an order paid.</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-amber-700">Refund and upgrades</p>
            <h2 className="mt-2 text-xl font-bold">Human review remains required.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">Refund requests are not auto-approved. CV Revamp has zero standalone managed-route capacity; the conditional +2 route bonus applies only after verified service ownership and an eligible upgrade.</p>
          </article>
        </section>

        <aside className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
          <h2 className="font-bold">No live order status displayed</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">This deployment has not confirmed account-backed order and payment-status retrieval for this screen. No order has been created or changed by rendering this page. Use the package catalogue to compare terms; activation remains dependent on the verified backend settlement path.</p>
        </aside>
      </section>

      <footer className="border-t border-slate-200 bg-white px-4 py-6 text-xs text-slate-500 sm:px-6 lg:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:justify-between"><span>© Kingsmen Portal · South Africa</span><span>Finance status is evidence-bound.</span></div></footer>
    </main>
  );
}
