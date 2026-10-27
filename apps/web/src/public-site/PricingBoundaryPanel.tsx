// Canonical standalone prices: CV Revamp R49.99; Accommodation Support R179.00.
import { LIVE_SERVICE_AVAILABILITY_NOTICE, PUBLIC_PACKAGE_CARDS } from "../../../api/src/public-website/package-boundaries";

export function PricingBoundaryPanel() {
  const packages = PUBLIC_PACKAGE_CARDS;
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kingsmen Candidate Packages</p>
      <h2 className="mt-2 text-3xl font-black text-slate-950">Packages control campaign weight, not dignity.</h2>
      <p className="mt-3 max-w-3xl text-sm text-slate-600">
        Choose the service intensity that fits your campaign. Package entitlements describe Kingsmen support,
        not a guarantee of admission, funding, accommodation, employment, or a provider decision.
      </p>
      <p role="note" className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
        <strong>Service availability:</strong> {LIVE_SERVICE_AVAILABILITY_NOTICE}
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {packages.map((item) => (
          <article key={item.packageKey} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {item.packageKey === "ACCOMMODATION_SUPPORT" ? "Standalone accommodation service" : item.routeVisibility === "PREVIEW_ONLY" ? "Preview" : item.routeVisibility === "SEALED" ? "Standalone service" : "Managed service"}
            </p>
            <h3 className="mt-2 text-lg font-bold text-slate-950">{item.packageName}</h3>
            <p className="mt-2 text-2xl font-black text-slate-950">{item.priceLabel}</p>
            <p className="mt-2 text-sm font-medium text-slate-700">{item.summary}</p>
            <p className="mt-3 text-sm text-slate-600">
              {item.managedApplicationCount > 0 ? `${item.managedApplicationCount} managed applications/routes` : "No managed applications included"}
              {item.includedAccommodationRoutes > 0 ? ` · up to ${item.includedAccommodationRoutes} accommodation routes where relevant` : ""}
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700">
              {item.includedBenefits.map((benefit) => <li key={benefit}>{benefit}</li>)}
            </ul>
            <p className="mt-4 border-t border-slate-200 pt-3 text-xs leading-5 text-slate-500">{item.boundary}</p>
            <a href={item.packageKey === "FREE_DESTINY_MAP" ? "/free-destiny-map" : "/candidate/finance"} className="mt-4 inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white">{item.packageKey === "FREE_DESTINY_MAP" ? "Explore free preview" : "Choose package"}</a>
          </article>
        ))}
      </div>
    </section>
  );
}
