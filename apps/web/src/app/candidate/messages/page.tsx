export default function CandidateMessagesPage() {
  return (
    <main>
      <h1>Kingsmen Messages</h1>
      <p>Email is the primary tracked communication channel. Portal messages are safe copies for visibility.</p>
      <p>WhatsApp is urgent-only. SMS is backup-only. Bulk WhatsApp reminders are not used.</p>

      <section aria-label="Message Centre Boundary">
        <article>
          <h2>Routine updates</h2>
          <p>Sent by email and copied here.</p>
        </article>
        <article>
          <h2>Urgent alerts</h2>
          <p>WhatsApp may be used only for urgent or ceremonial cases.</p>
        </article>
        <article>
          <h2>Evidence</h2>
          <p>Every message requires a message evidence ledger record.</p>
        </article>
      </section>
    </main>
  );
}