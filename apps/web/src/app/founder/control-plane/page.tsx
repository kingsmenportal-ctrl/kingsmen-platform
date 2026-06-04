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
    </main>
  );
}