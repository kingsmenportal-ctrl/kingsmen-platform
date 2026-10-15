export default function FounderCommandsPage() {
  return (
    <main>
      <h1>Founder Commands</h1>
      <p>Commands are controlled actions. High-risk commands require founder approval, proof, evidence, audit, and rollback where available.</p>
      <nav aria-label="Founder command navigation">
        <a href="/founder/control-plane/command-review/">Open persisted command review queue</a>
      </nav>
      <section aria-label="Submit a command request">
        <h2>Submit a request</h2>
        <p>Command requests are recorded for review and are not executed by this page.</p>
        <a href="/founder/control-plane/command-review/">Review existing requests</a>
      </section>
      <section aria-label="Approval Workflow">
        <h2>Approval workflow</h2>
        <p>Approve, reject, pause, retry, rollback, source-freeze, manual-review, and stop-selling commands require separate authorized decision records.</p>
      </section>
      <section aria-label="Safety Gates">
        <h2>Safety gates</h2>
        <p>Commands cannot bypass source verification, privacy, candidate-harm, payment, document, proof, evidence, or audit gates.</p>
      </section>
      <section aria-label="Audit Trail">
        <h2>Audit trail</h2>
        <p>Every command decision must keep command id, actor, reason, evidence, proof where required, and audit id.</p>
      </section>
    </main>
  );
}
