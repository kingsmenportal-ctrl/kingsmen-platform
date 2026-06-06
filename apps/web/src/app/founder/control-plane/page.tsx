export default function FounderControlPlanePage() {
  return (
    <main>
      <h1>Kingsmen Founder Control Plane</h1>
      <p>Mobile-first founder console for exceptions, approvals, queue health, provider health, and stop-selling decisions.</p>

      <section aria-label="Action Packets">
        <h2>Action packets</h2>
        <p>Each action packet must explain cause, impact, recommended action, rollback, owner, evidence, and audit trail.</p>
      </section>

      <section aria-label="Queue Health">
        <h2>Queue health</h2>
        <p>Oracle Lite queue health shows waiting, active, failed, dead-lettered, oldest waiting age, and stop-selling risk.</p>
      </section>

      <section aria-label="Stop Selling">
        <h2>Stop-selling operations</h2>
        <p>Stop-selling protects candidate safety and founder workload. It limits volume, not Kingsmen capability.</p>
      </section>

      <section aria-label="Truth Boundary">
        <h2>Truth boundary</h2>
        <p>Founder actions that change candidate truth require proof, evidence, and audit records.</p>
      </section>
    
        <a
          data-kingsmen-proof-centre-entry="true"
          href="/founder/proof-centre/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "18px",
            padding: "12px 16px",
            borderRadius: "999px",
            border: "1px solid rgba(214, 178, 94, 0.55)",
            background: "rgba(214, 178, 94, 0.12)",
            color: "#f8d77a",
            fontWeight: 900,
            textDecoration: "none"
          }}
        >
          Open Build Proof Centre
        </a>

    </main>
  );
}