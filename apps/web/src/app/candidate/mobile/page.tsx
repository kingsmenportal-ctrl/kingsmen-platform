const journey = [
  "Welcome", "Identity", "Intake", "Six Gate Review", "Documents",
  "Payments", "Applications", "Messages", "Support", "Outcomes"
];

export default function CandidateMobileJourneyPage() {
  return (
    <main>
      <h1>Kingsmen Mobile Journey</h1>
      <p>Mobile-first, low-data candidate journey. Candidate communication uses email and the secure portal only.</p>
      <ol aria-label="Candidate Journey">
        {journey.map((step) => <li key={step}>{step}</li>)}
      </ol>
      <section aria-label="Communication Boundary">
        <p>Email: the only enabled external candidate communication channel.</p>
        <p>Portal: secure in-account messages and status history.</p>
        <p>WhatsApp: disabled.</p>
        <p>SMS: disabled.</p>
        <p>No WhatsApp or SMS messages are sent or queued.</p>
      </section>
    </main>
  );
}
