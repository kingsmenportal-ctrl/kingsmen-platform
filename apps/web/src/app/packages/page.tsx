import PayFastSandboxCheckout from "@/components/candidate/PayFastSandboxCheckout";

const plans = [
  {
    id: "artisan_charter",
    planCode: "ARTISAN_CHARTER_R149_99",
    name: "Artisan Charter",
    price: "R149.99",
    cents: 14999,
    applications: 5,
    capacity: 3,
    audience: "Technical and occupational pathways",
    description: "A focused managed-service starting point for skills and trade routes."
  },
  {
    id: "foundational_accord",
    planCode: "FOUNDATIONAL_ACCORD_R169_99",
    name: "Foundational Accord",
    price: "R169.99",
    cents: 16999,
    applications: 5,
    capacity: 4,
    audience: "A balanced start across pathways",
    description: "Structured application support with accommodation routes included."
  },
  {
    id: "guildmasters_charter",
    planCode: "GUILDMASTERS_CHARTER_R199_99",
    name: "Guildmasters Charter",
    price: "R199.99",
    cents: 19999,
    applications: 8,
    capacity: 5,
    audience: "Candidates managing several applications",
    description: "More managed-route capacity for a broader application plan."
  },
  {
    id: "collegiate_ordinance",
    planCode: "COLLEGIATE_ORDINANCE_R299_99",
    name: "Collegiate Ordinance",
    price: "R299.99",
    cents: 29999,
    applications: 10,
    capacity: 8,
    audience: "Study and training applications",
    description: "Expanded support for candidates pursuing multiple education routes."
  },
  {
    id: "chancellors_writ",
    planCode: "CHANCELLORS_WRIT_R399_99",
    name: "Chancellor’s Writ",
    price: "R399.99",
    cents: 39999,
    applications: 15,
    capacity: 10,
    audience: "A high-volume application plan",
    description: "More priority applications and managed-route capacity."
  },
  {
    id: "regency_mandate",
    planCode: "REGENCY_MANDATE_R469_99",
    name: "Regency Mandate",
    price: "R469.99",
    cents: 46999,
    applications: 15,
    capacity: 12,
    audience: "Maximum standard managed-route capacity",
    description: "The highest standard capacity for candidates coordinating many routes."
  }
] as const;

const sharedFeatures = [
  "One reusable candidate profile",
  "One unified application workbench",
  "Discovery across all six pathways",
  "Accommodation support included"
];

function PlanCard({ plan, featured = false }: { plan: (typeof plans)[number]; featured?: boolean }) {
  return (
    <article className={`flex h-full flex-col rounded-2xl border p-6 shadow-sm ${featured ? "border-amber-400 bg-slate-950 text-white ring-1 ring-amber-300/40" : "border-slate-200 bg-white text-slate-900"}`}>
      <p className={`text-xs font-bold uppercase tracking-[0.16em] ${featured ? "text-amber-300" : "text-amber-700"}`}>{plan.audience}</p>
      <h2 className="mt-3 text-xl font-bold tracking-tight">{plan.name}</h2>
      <p className={`mt-2 min-h-12 text-sm leading-6 ${featured ? "text-slate-300" : "text-slate-600"}`}>{plan.description}</p>
      <p className="mt-5 text-3xl font-extrabold tracking-tight">{plan.price}<span className={`ml-1 text-xs font-medium ${featured ? "text-slate-300" : "text-slate-500"}`}>ZAR</span></p>
      <p className={`mt-1 text-xs ${featured ? "text-slate-300" : "text-slate-500"}`}>Displayed price; payment activation requires confirmed settlement.</p>
      <div className={`my-5 grid grid-cols-2 gap-3 border-y py-4 ${featured ? "border-slate-700" : "border-slate-200"}`}>
        <div><p className={`text-2xl font-bold ${featured ? "text-amber-300" : "text-slate-950"}`}>{plan.applications}</p><p className={`mt-1 text-xs ${featured ? "text-slate-300" : "text-slate-600"}`}>Priority applications</p></div>
        <div><p className={`text-2xl font-bold ${featured ? "text-amber-300" : "text-slate-950"}`}>{plan.capacity}</p><p className={`mt-1 text-xs ${featured ? "text-slate-300" : "text-slate-600"}`}>Concurrent managed routes / 30 days</p></div>
      </div>
      <ul className={`flex-1 space-y-3 text-sm ${featured ? "text-slate-200" : "text-slate-700"}`}>
        {sharedFeatures.map((feature) => <li key={feature} className="flex gap-2"><span aria-hidden="true" className={featured ? "text-amber-300" : "text-amber-700"}>✓</span><span>{feature}</span></li>)}
        {plan.id === "foundational_accord" && <li className="flex gap-2"><span aria-hidden="true" className="text-amber-600">✓</span><span>8 accommodation routes included</span></li>}
      </ul>
      <a href={`/candidate/workbench?plan=${plan.id}`} className={`mt-6 inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-3 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 ${featured ? "bg-amber-300 text-slate-950 hover:bg-amber-200" : "border border-slate-300 bg-white text-slate-900 hover:border-slate-500 hover:bg-slate-50"}`}>Continue to application workbench <span aria-hidden="true" className="ml-2">→</span></a>
      <PayFastSandboxCheckout planCode={plan.planCode} />
    </article>
  );
}

export default function PackagesPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-3 rounded focus:outline-none focus:ring-2 focus:ring-amber-300">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-amber-200 to-amber-500 text-lg font-black text-slate-950">K</span>
            <span><strong className="block text-sm tracking-[0.18em]">KINGSMEN</strong><span className="mt-1 block text-xs text-slate-300">PORTAL</span></span>
          </a>
          <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-4 text-sm text-slate-200">
            <a className="hover:text-amber-200" href="/">Home</a>
            <a className="hover:text-amber-200" href="/candidate/dashboard">Candidate dashboard</a>
            <a className="rounded-lg border border-slate-600 px-3 py-2 font-semibold hover:border-amber-300 hover:text-amber-200" href="/candidate/workbench">Application workbench</a>
          </nav>
        </div>
      </header>
      <section className="bg-slate-950 px-4 pb-12 pt-10 text-white sm:px-6 sm:pb-16 sm:pt-14">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-300">Choose your service level</p>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">One Kingsmen journey. A plan that fits.</h1>
          <p className="mx-auto mt-5 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">Every plan keeps all six pathways available for discovery through one candidate profile and one unified application workbench. Plans change priority application volume and managed-service capacity—not access to pathways.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs font-semibold">
            <span className="rounded-full border border-slate-700 px-3 py-2 text-slate-200">South African rand (ZAR)</span>
            <span className="rounded-full border border-slate-700 px-3 py-2 text-slate-200">Accommodation support included with paid plans</span>
            <span className="rounded-full border border-slate-700 px-3 py-2 text-slate-200">No guaranteed outcomes</span>
            <span className="rounded-full border border-slate-700 px-3 py-2 text-amber-200">PayFast sandbox only · no live charges</span>
          </div>
        </div>
      </section>
      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div><h2 className="text-2xl font-bold tracking-tight">Managed service plans</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Application allowances and concurrent 30-day managed-route capacity are separate limits.</p></div>
          <p className="text-xs text-slate-500">Prices shown in ZAR, including cents.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => <PlanCard key={plan.id} plan={plan} featured={plan.id === "foundational_accord"} />)}
        </div>
      </section>
      <section className="mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Standalone service</p>
            <h2 className="mt-3 text-xl font-bold">CV Revamp — R49.99</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Target turnaround: 3 business days. Includes 15 CV versions and 15 motivation letters. It does not include managed-route capacity by itself.</p>
            <p className="mt-3 text-sm leading-6 text-slate-700">A +2 route bonus applies only after verified CV Revamp ownership and an eligible plan upgrade. It is not granted merely by selecting or mentioning this service.</p>
            <a href="/candidate/workbench?plan=cv_revamp" className="mt-5 inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 py-3 text-sm font-bold hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400">Continue to workbench <span aria-hidden="true" className="ml-2">→</span></a>
            <PayFastSandboxCheckout planCode="CV_REVAMP_R49_99" />
          </article>
          <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="font-bold">Free Destiny Map</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">Explore possible directions before choosing a paid service. The free map is separate from the seven paid products and does not represent an application submission.</p>
            <a href="/free-destiny-map/" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2">Explore the free map <span aria-hidden="true" className="ml-2">↗</span></a>
          </aside>
        </div>
        <aside className="mt-6 rounded-xl border border-slate-200 bg-white p-5" aria-labelledby="important-details">
          <h2 id="important-details" className="font-semibold">Before you continue</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Selecting a plan does not activate entitlements. The checkout control creates a sandbox intent and redirects to PayFast’s test environment only; no live charge is enabled. The return page does not mark an order paid. Entitlements can activate only after the backend accepts a verified PayFast ITN. Opportunity availability, provider receipt, admission, funding, placement, and employment are never guaranteed.</p>
        </aside>
      </section>
      <footer className="border-t border-slate-200 bg-white px-4 py-6 text-xs text-slate-500 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:justify-between"><span>© Kingsmen Portal · South Africa</span><span>Candidate data and payment status must be verified by the platform backend.</span></div>
      </footer>
    </main>
  );
}
