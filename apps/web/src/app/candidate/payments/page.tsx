export default function CandidatePaymentsPage() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24, fontFamily: "Inter,system-ui,sans-serif" }}>
      <a href="/candidate/dashboard">← Candidate dashboard</a>
      <header>
        <p>KINGSMEN · CANDIDATE PAYMENTS</p>
        <h1>Payments, receipts and refunds</h1>
        <p>Use this page to understand the payment process. It is not a live account ledger and does not initiate a charge.</p>
      </header>

      <section aria-labelledby="current-status" style={{ border: "1px solid #a67b35", borderRadius: 12, padding: 18, margin: "20px 0" }}>
        <h2 id="current-status">Current payment connection</h2>
        <p><strong>Payment verification is not connected to this candidate page.</strong></p>
        <p>No order, payment, receipt, refund or service entitlement is asserted here. Do not interpret a redirect, screenshot, email or browser message as proof that Kingsmen has received funds.</p>
      </section>

      <section aria-labelledby="safe-steps">
        <h2 id="safe-steps">Before you pay</h2>
        <ol>
          <li>Confirm the exact package, price, currency and included service with Kingsmen through an authorised channel.</li>
          <li>Check that the payment page belongs to the approved payment provider before entering payment details.</li>
          <li>Keep the provider's transaction reference and receipt for reconciliation. Do not send full card details, PINs or one-time passwords to support staff.</li>
          <li>Wait for an independently verified payment status and an order reference before assuming a paid service is active.</li>
        </ol>
      </section>

      <section aria-labelledby="refund-steps">
        <h2 id="refund-steps">Refunds and disputed payments</h2>
        <p>A refund request requires review against the original order, provider transaction and applicable policy. This page cannot approve, deny or submit a refund request.</p>
        <p>If a payment appears to have succeeded but no verified order is visible, avoid paying again until the transaction has been reconciled by authorised finance staff.</p>
      </section>

      <section aria-labelledby="security-boundary">
        <h2 id="security-boundary">Account and privacy boundary</h2>
        <p>Payment records must be retrieved from an authenticated, candidate-scoped source. A candidate-supplied order ID is not proof of ownership. Provider callbacks must be authenticated, validated and reconciled idempotently before an order status or entitlement changes.</p>
      </section>

      <nav aria-label="Related candidate areas" style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 24 }}>
        <a href="/candidate/finance">Package catalogue and finance policy</a>
        <a href="/candidate/applications">Applications and outcomes</a>
        <a href="/candidate/support">Candidate support</a>
      </nav>
    </main>
  );
}
