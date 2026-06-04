const journey = [
  "Welcome",
  "Identity",
  "Intake",
  "Six Gate Review",
  "Documents",
  "Payments",
  "Applications",
  "Messages",
  "Support",
  "Outcomes"
];

export default function CandidateMobileJourneyPage() {
  return (
    <main>
      <h1>Kingsmen Mobile Journey</h1>
      <p>Mobile-first, low-data candidate journey. Routine updates are email-first. WhatsApp is urgent-only. SMS is backup-only.</p>

      <ol aria-label="Candidate Journey">
        {journey.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>

      <section aria-label="Communication Boundary">
        <p>Email: routine tracked updates.</p>
        <p>WhatsApp: urgent-only or ceremonial only.</p>
        <p>SMS: backup-only.</p>
        <p>No bulk WhatsApp reminders.</p>
      </section>
    </main>
  );
}