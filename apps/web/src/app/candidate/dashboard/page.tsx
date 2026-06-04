const gates = [
  ["higher_education", "Higher Education"],
  ["tvet", "TVET"],
  ["seta_learnership", "SETA / Learnership"],
  ["internship", "Internship"],
  ["apprenticeship", "Apprenticeship"],
  ["employment", "Employment"]
] as const;

export default function CandidateDashboardPage() {
  return (
    <main>
      <h1>Kingsmen Candidate Dashboard</h1>
      <p>All six gates are visible and assessable. Your package changes service intensity, not access.</p>

      <section aria-label="Six Gate View">
        {gates.map(([code, label]) => (
          <article key={code} data-gate={code}>
            <h2>{label}</h2>
            <p>Status: Available for assessment</p>
          </article>
        ))}
      </section>

      <p data-boundary="browser-safe">
        Browser view is candidate-safe read model only. No service_role, paid verification, submitted verification, outcome verification, or source-confidence authority is exposed here.
      </p>
    </main>
  );
}