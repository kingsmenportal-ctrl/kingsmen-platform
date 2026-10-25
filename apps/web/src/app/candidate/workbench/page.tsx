const gates = [
  ["higher_education", "Higher Education"],
  ["tvet", "TVET"],
  ["seta_learnership", "SETA / Learnership"],
  ["internship", "Internship"],
  ["apprenticeship", "Apprenticeship"],
  ["employment", "Employment"]
] as const;

export default function CandidateWorkbenchPage() {
  return (
    <main>
      <h1>Kingsmen Application Workbench</h1>
      <p>Use one reusable master application to maintain your candidate profile and plan targets across all six pathways. Your package changes service intensity, not access.</p>

      <section aria-label="Unified Master Application">
        <h2>One master application · many provider targets</h2>
        <p>Enter your details once, select every pathway you want to pursue, and maintain multiple target records from the same profile. Provider submissions and outcomes are tracked separately only when route-specific evidence exists.</p>
        <a href="/candidate/master-application">Open my master application</a>
      </section>

      <section aria-label="Six Gate Workbench">
        {gates.map(([code, label]) => (
          <article key={code} data-gate={code}>
            <h2>{label}</h2>
            <p>Available for route readiness, matching, and workbench review.</p>
          </article>
        ))}
      </section>

      <section aria-label="Candidate Safety Boundary">
        <h2>Candidate-safe workbench</h2>
        <p>You can view readiness and route guidance. You cannot verify sources, mark paid, mark submitted, or claim outcomes from the browser.</p>
        <p>No acceptance, funding, placement, employment, or success is guaranteed.</p>
      </section>

      <section aria-label="CAO Parent Child View">
        <h2>CAO Parent-Child View</h2>
        <p>CAO remains one Kingsmen managed application. Programme choices are tracked as child choices and do not each count as separate Kingsmen applications.</p>
      </section>
    </main>
  );
}