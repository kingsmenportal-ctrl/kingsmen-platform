export function FounderBriefPanel() {
  const sections = [
    "System health",
    "Queue",
    "Finance",
    "Documents",
    "Matching",
    "Playwright / MAP",
    "Incidents",
    "Capacity",
    "Urgent candidates"
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Founder Briefs</p>
      <h2 className="text-2xl font-bold text-slate-950">Morning, midday, evening, incident</h2>
      <p className="mt-2 text-sm text-slate-600">
        Briefs give the founder a small actionable control surface instead of forcing constant manual monitoring.
      </p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {sections.map((section) => (
          <li key={section} className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">{section}</li>
        ))}
      </ul>
    </section>
  );
}