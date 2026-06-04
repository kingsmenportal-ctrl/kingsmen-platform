export default function FounderCommandsPage() {
  return (
    <main>
      <h1>Founder Commands</h1>
      <p>Commands are controlled actions. High-risk commands require founder approval, proof, evidence, audit, and rollback where available.</p>

      <section aria-label="Approval Workflow">
        <h2>Approval workflow</h2>
        <p>Approve, reject, pause, retry, rollback, source-freeze, manual-review, and stop-selling commands are tracked as action packets.</p>
      </section>

      <section aria-label="Safety Gates">
        <h2>Safety gates</h2>
        <p>Commands cannot bypass source verification, POPIA/privacy, candidate-harm, payment, document, proof, evidence, or audit gates.</p>
      </section>

      <section aria-label="Audit Trail">
        <h2>Audit trail</h2>
        <p>Every command decision must keep command id, actor, reason, evidence, proof where required, and audit id.</p>
      </section>
    </main>
  );
}