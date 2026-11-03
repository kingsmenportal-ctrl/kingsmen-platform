const gates = [
  ["higher_education", "Higher Education"],
  ["tvet", "TVET"],
  ["seta_learnership", "SETA programmes & learnerships"],
  ["internship", "Internship"],
  ["apprenticeship", "Apprenticeship"],
  ["employment", "Employment"]
] as const;

const plans = {
  foundational_accord: { name: "Foundational Accord", price: "R169.99" },
  collegiate_ordinance: { name: "Collegiate Ordinance", price: "R299.99" },
  chancellors_writ: { name: "Chancellor’s Writ", price: "R399.99" },
  regency_mandate: { name: "Regency Mandate", price: "R469.99" },
  artisan_charter: { name: "Artisan Charter", price: "R149.99" },
  guildmasters_charter: { name: "Guildmasters Charter", price: "R199.99" },
  cv_revamp: { name: "CV Revamp", price: "R49.99" }
} as const;

type PlanId = keyof typeof plans;

export default async function CandidateWorkbenchPage({
  searchParams
}: {
  searchParams: Promise<{ plan?: string | string[] }>;
}) {
  const params = await searchParams;
  const requestedPlan = Array.isArray(params.plan) ? params.plan[0] : params.plan;
  const selectedPlan = requestedPlan && Object.prototype.hasOwnProperty.call(plans, requestedPlan)
    ? plans[requestedPlan as PlanId]
    : null;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-3 rounded focus:outline-none focus:ring-2 focus:ring-amber-300">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-amber-200 to-amber-500 text-lg font-black text-slate-950">K</span>
            <span><strong className="block text-sm tracking-[0.18em]">KINGSMEN</strong><span className="mt-1 block text-xs text-slate-300">APPLICATION WORKBENCH</span></span>
          </a>
          <nav aria-label="Candidate navigation" className="flex flex-wrap items-center gap-4 text-sm text-slate-200">
            <a className="hover:text-amber-200" href="/candidate/dashboard">Dashboard</a>
            <a className="hover:text-amber-200" href="/candidate/documents">Documents</a>
            <a className="hover:text-amber-200" href="/packages/">Packages</a>
          </nav>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-white shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-300">One profile · Six pathways</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Kingsmen Application Workbench</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">All six pathways remain available for discovery and readiness review. A service plan changes priority application volume and managed-route capacity, not access to pathways.</p>
        </section>

        {selectedPlan ? (
          <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5" aria-labelledby="selected-plan">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-800">Selected plan for review</p>
            <h2 id="selected-plan" className="mt-2 text-xl font-bold">{selectedPlan.name} · {selectedPlan.price}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">This selection is a browser-supplied preference only. It has not created an order, initiated checkout, verified a payment, or activated entitlements. Final pricing and eligibility must be loaded and enforced by the backend.</p>
            <a href="/packages/" className="mt-4 inline-flex min-h-10 items-center rounded-lg border border-amber-300 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500">Change plan</a>
          </section>
        ) : requestedPlan ? (
          <section className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5" role="status">
            <h2 className="font-bold text-red-900">Plan selection needs review</h2>
            <p className="mt-2 text-sm leading-6 text-red-800">The requested plan is not recognised. No order or entitlement has been created. Return to the package catalogue and choose a listed product.</p>
            <a href="/packages/" className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">View packages</a>
          </section>
        ) : null}

        <section className="mt-8" aria-labelledby="six-gates">
          <div className="mb-4"><h2 id="six-gates" className="text-xl font-bold">Your six pathways</h2><p className="mt-1 text-sm text-slate-600">Pathway access is universal; opportunity status and eligibility still require evidence-based verification.</p></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {gates.map(([code, label]) => (
              <article key={code} data-gate={code} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Pathway {String(gates.findIndex(([key]) => key === code) + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 font-semibold text-slate-900">{label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Available for route readiness, matching, and workbench review.</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5" aria-labelledby="cao-parent-child">
          <h2 id="cao-parent-child" className="font-bold">CAO parent application</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">CAO remains one Kingsmen managed application. Programme choices are tracked as child choices and do not each count as separate Kingsmen applications.</p>
        </section>

        <aside className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5" aria-labelledby="status-boundary">
          <h2 id="status-boundary" className="font-bold">Status and safety boundary</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">This workbench provides navigation and guidance. It cannot verify sources, mark an application as submitted, confirm provider receipt, mark a payment as settled, or claim an outcome from the browser. Provider receipt and outcomes require provider-origin evidence. No admission, funding, placement, employment, or success is guaranteed.</p>
        </aside>
      </div>
    </main>
  );
}
