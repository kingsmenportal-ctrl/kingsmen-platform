const packages = [
  ["Foundational Accord", "R169.99"],
  ["Collegiate Ordinance", "R299.99"],
  ["Chancellor's Writ", "R399.99"],
  ["Regency Mandate", "R469.99"],
  ["Artisan Charter", "R149.99"],
  ["Guildmaster's Charter", "R199.99"],
  ["CV Revamp", "R49.99"]
] as const;

export default function CandidateFinancePage() {
  return (
    <main>
      <h1>Kingsmen Financial View</h1>
      <p>View your service orders, package, payment status, and refund status. This page is visibility only.</p>

      <section aria-label="Official Package Prices">
        {packages.map(([name, price]) => (
          <article key={name}>
            <h2>{name}</h2>
            <p>{price}</p>
          </article>
        ))}
      </section>

      <section aria-label="Payment Boundary">
        <p>Candidate cannot mark paid. Return URL cannot mark paid.</p>
        <p>Paid status requires verified webhook or manual finance review.</p>
        <p>Refund requests are visible but require manual finance review and are not auto-approved.</p>
        <p>CV Revamp upgrade keeps trust: later package upgrade grants two additional active managed applications/routes.</p>
      </section>
    </main>
  );
}