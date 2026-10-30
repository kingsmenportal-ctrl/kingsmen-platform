import type { Metadata } from "next";
import Link from "next/link";
import { KINGSMEN_COMMERCIAL_CATALOGUE, KINGSMEN_PATHWAYS, formatZar } from "../../../../api/src/commercial/commercial-catalogue";
import "./pricing.css";

export const metadata: Metadata = {
  title: "Kingsmen packages and pricing",
  description: "Compare Kingsmen service packages. Every package keeps access to all six opportunity pathways."
};

const serviceFocus: Record<string, string> = {
  foundational_accord: "A structured starting point for managed application preparation.",
  collegiate_ordinance: "More managed-route capacity and a stronger monitoring rhythm.",
  chancellors_writ: "Higher service intensity with deeper human review and escalation.",
  regency_mandate: "The highest listed managed-service capacity and monitoring intensity.",
  artisan_charter: "A work-and-skills focused service package for practical career pathways.",
  guildmasters_charter: "Additional managed service intensity for learnership and employment routes.",
  cv_revamp: "A standalone CV service with matching motivation-letter preparation."
};

export default function PricingPage() {
  return (
    <main className="km-pricing-page">
      <div className="km-pricing-wrap">
        <section className="km-pricing-intro" aria-labelledby="pricing-title">
          <p className="km-pricing-eyebrow">Kingsmen service packages</p>
          <h1 id="pricing-title">One opportunity catalogue. Service levels that fit your needs.</h1>
          <p>Packages change managed-service quantity and intensity. They do not hide institutions, opportunities or any of the six pathways.</p>
          <div className="km-pricing-law">
            <strong>Universal access law</strong>
            <span>Every candidate can discover opportunities across all six pathways, regardless of package.</span>
          </div>
        </section>
        <section aria-label="Package comparison" className="km-package-grid">
          {KINGSMEN_COMMERCIAL_CATALOGUE.map(plan => (
            <article className="km-package-card" key={plan.packageId}>
              <p className="km-package-kicker">{plan.packageId === "cv_revamp" ? "Standalone service" : "Managed service package"}</p>
              <h2>{plan.name}</h2>
              <p className="km-package-description">{serviceFocus[plan.packageId]}</p>
              <p className="km-package-price"><strong>{formatZar(plan.priceCents)}</strong><span> ZAR</span></p>
              <dl className="km-package-metrics">
                {plan.priorityApplications === null
                  ? <div><dt>CV preparation</dt><dd>{plan.cvVersions} CV versions</dd></div>
                  : <div><dt>Priority applications</dt><dd>{plan.priorityApplications}</dd></div>}
                {plan.concurrentManagedRoutes30d > 0
                  ? <div><dt>Concurrent managed routes</dt><dd>{plan.concurrentManagedRoutes30d} / 30 days</dd></div>
                  : <div><dt>Motivation letters</dt><dd>{plan.motivationLetters}</dd></div>}
                {plan.includedAccommodationRoutes > 0
                  ? <div><dt>Accommodation routes</dt><dd>{plan.includedAccommodationRoutes} included</dd></div>
                  : <div><dt>Accommodation support</dt><dd>Available where relevant</dd></div>}
              </dl>
              <p className="km-package-boundary">{plan.packageId === "cv_revamp"
                ? "Target completion: 3 business days after complete intake."
                : "Source verification, document readiness and application-status truth remain core safeguards."}</p>
              <Link className="km-package-cta" href="/candidate/login">Continue to candidate portal</Link>
            </article>
          ))}
        </section>
        <section className="km-pathway-access" aria-labelledby="pathway-access-title">
          <p className="km-pricing-eyebrow">Included in discovery</p>
          <h2 id="pathway-access-title">All six pathways remain visible</h2>
          <ul>{KINGSMEN_PATHWAYS.map(pathway => <li key={pathway}>{pathway}</li>)}</ul>
          <p>Eligibility, opening status, deadlines and requirements are displayed only when the source evidence supports those claims. A package does not turn an unverified listing into an open opportunity.</p>
        </section>
        <p className="km-pricing-note">Prices are shown in South African rand. This page compares packages; it does not collect payment or promise admission, funding, employment, accommodation or a provider outcome.</p>
      </div>
    </main>
  );
}
