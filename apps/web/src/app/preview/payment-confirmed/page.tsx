import Link from "next/link";

export default function PaymentReceiptPreviewPage() {
  return (
    <main className="public-site">
      <div className="public-notice"><span aria-hidden="true" /> EXAMPLE RECEIPT · No payment has been made</div>
      <div className="public-container receipt-preview-page">
        <div className="public-eyebrow"><span /> Static design example</div>
        <h1>Payment confirmation <em>layout.</em></h1>
        <p className="receipt-preview-lede">This page demonstrates the receipt design only. It is not proof of settlement and must not be used as a real receipt.</p>
        <section className="receipt-preview-card" aria-label="Example receipt, not a real transaction">
          <div className="receipt-preview-head"><Link className="public-brand" href="/"><span className="public-crest" aria-hidden="true">K</span><span className="public-wordmark"><strong>KINGSMEN</strong><small>PORTAL</small></span></Link><span className="receipt-preview-state">NOT A REAL RECEIPT</span></div>
          <div className="receipt-preview-order"><span>EXAMPLE ORDER</span><strong>KM-DEMO-0000</strong><small>Settlement status: not verified</small></div>
          <div className="receipt-preview-line"><span>Package</span><strong>Foundational Accord (example)</strong></div>
          <div className="receipt-preview-line"><span>Subtotal (illustrative)</span><strong>R147.82</strong></div>
          <div className="receipt-preview-line"><span>VAT (illustrative at 15%)</span><strong>R22.17</strong></div>
          <div className="receipt-preview-total"><span>Illustrative total</span><strong>R169.99</strong></div>
          <div className="receipt-preview-warning">PayFast ITN signature, merchant, amount, reference and settlement have not been checked. No order or entitlement is created by this page.</div>
          <div className="receipt-preview-actions"><Link className="public-button public-button-gold" href="/candidate/dashboard/">Continue to dashboard preview →</Link><Link className="public-button public-button-outline" href="/packages/">Review packages</Link></div>
        </section>
        <p className="receipt-preview-note">A production receipt must be generated from a persisted order and verified, idempotently processed payment notification. Final tax amounts must come from the actual order record.</p>
      </div>
    </main>
  );
}
