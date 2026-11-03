export default function CandidateMessagesPage() {
  return (
    <main>
      <h1>Kingsmen Messages</h1>
      <p>Email is the enabled external communication channel. Application status, messages and required actions are also shown in your Kingsmen portal inbox.</p>

      <section aria-label="Message Centre">
        <article>
          <h2>Application updates and reminders</h2>
          <p>Kingsmen sends email notifications for relevant application events and keeps the related status and next action visible in your portal.</p>
        </article>
        <article>
          <h2>Portal inbox</h2>
          <p>Use Kingsmen to review messages, outstanding requirements, document corrections, deadlines and follow-up tasks.</p>
        </article>
        <article>
          <h2>Other channels</h2>
          <p>WhatsApp and SMS notifications are currently disabled. Kingsmen will not ask you to monitor another messaging service for application progress.</p>
        </article>
        <article>
          <h2>Evidence and privacy</h2>
          <p>Messages are linked to application records and must follow consent, privacy, delivery-evidence and retention rules.</p>
        </article>
      </section>
    </main>
  );
}
