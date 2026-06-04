export default function FounderAirtableProviderPage() {
  return (
    <main>
      <h1>Airtable Mirror Health</h1>
      <p>PostgreSQL remains the truth. Airtable is an async mirror only.</p>

      <section aria-label="Airtable Provider Boundary">
        <article>
          <h2>Provider status</h2>
          <p>Missing credentials degrade gracefully. No live provider claim is allowed without proof.</p>
        </article>
        <article>
          <h2>Sync limits</h2>
          <p>Oracle Lite discipline: 15-minute batch interval, 50 records per batch, 1 sync worker, 3 retries, DLQ required.</p>
        </article>
        <article>
          <h2>Truth authority blocked</h2>
          <p>Airtable cannot govern paid status, submissions, documents, outcomes, refunds, source confidence, or partner identity sharing.</p>
        </article>
      </section>
    </main>
  );
}