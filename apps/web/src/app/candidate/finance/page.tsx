const packages = [
  {
    name: "Free Destiny Map",
    price: "Free",
    description: "All-sector preview only. Exact targets, application links, and manual route plans remain sealed until package activation.",
    included: "Route preview",
    status: "Available as a free preview"
  },
  {
    name: "CV Revamp",
    price: "R49.99",
    description: "15 personalised, truthful CV versions and 15 matching motivation letters.",
    included: "CV and motivation-letter preparation",
    status: "Paid package — checkout is not enabled here"
  },
  {
    name: "Accommodation Support Package",
    price: "R179.00",
    description: "Standalone support for up to 8 accommodation applications or routes.",
    included: "Accommodation route support",
    status: "Paid package — checkout is not enabled here"
  }
] as const;

export default function CandidateFinancePage() {
  return (
    <main>
      <header>
        <p>KINGSMEN · CANDIDATE FINANCE</p>
        <h1>Packages, orders and payment status</h1>
        <p>
          Review the currently configured package catalogue and understand what happens next.
          This page does not create an order, collect payment details, or change your payment status.
        </p>
      </header>

      <section aria-label="Configured package catalogue">
        <h2>Configured packages</h2>
        <div>
          {packages.map((item) => (
            <article key={item.name}>
              <h3>{item.name}</h3>
              <p><strong>{item.price}</strong></p>
              <p>{item.description}</p>
              <p><strong>Includes:</strong> {item.included}</p>
              <p>{item.status}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-label="Payment status and next steps">
        <h2>Payment status</h2>
        <p><strong>Current portal capability:</strong> payment verification is not connected to this page.</p>
        <ol>
          <li>Selecting or viewing a package is not an order and does not activate a paid service.</li>
          <li>Returning from a payment provider is not proof that payment succeeded.</li>
          <li>A paid order can be marked paid only after a verified provider notification is reconciled to the order, or an authorised finance reviewer records evidence.</li>
          <li>Until that verification is available, treat payment status as unverified and contact the authorised Kingsmen finance team before paying again.</li>
        </ol>
      </section>

      <section aria-label="Refund policy boundary">
        <h2>Refunds and package changes</h2>
        <p>Refund requests require finance review and evidence; they are not automatically approved by AI or by this page.</p>
        <p>Package upgrades and service entitlements must be confirmed against an authoritative finance record. This page does not grant extra applications or routes.</p>
      </section>

      <p role="note">
        This is a catalogue and policy view, not a live account ledger. Individual orders, receipts,
        verified payments and refund decisions are not displayed because an authenticated,
        candidate-scoped finance data connection has not been proven.
      </p>
    </main>
  );
}
