export default function CandidateProfilePage() {
  return (
    <main className="mx-auto grid w-full max-w-4xl gap-6 px-4 py-8 text-slate-100 sm:px-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-400">Candidate portal</p>
        <h1 className="text-3xl font-semibold tracking-tight">Your profile</h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-300">
          Your reusable candidate profile is intended to support all six Kingsmen pathways.
          Personal information must only be edited through an authenticated, ownership-checked service.
        </p>
      </header>

      <section aria-label="Profile connection status" className="rounded-2xl border border-amber-700/60 bg-amber-950/30 p-5">
        <h2 className="font-semibold text-amber-100">Secure profile editing is not connected on this page</h2>
        <p className="mt-2 text-sm leading-6 text-amber-50/90">
          No authenticated profile was loaded. This page does not display sample personal data or offer a save button
          that could imply persistence without a verified backend write and audit trail.
        </p>
      </section>

      <section aria-label="Profile readiness checklist" className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
        <h2 className="text-lg font-semibold">Profile preparation checklist</h2>
        <p className="mt-2 text-sm text-slate-400">
          These are preparation categories, not a live completeness score. No profile completeness has been calculated.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            ["Contact details", "Email and phone preferences"],
            ["Personal details", "Legal name and date-of-birth details when required"],
            ["Location", "Province and municipality"],
            ["Education and training", "Qualifications and current study status"],
            ["Experience", "Work history, skills, and relevant certificates"],
            ["Consent", "Purpose-specific processing and communication consent"],
          ].map(([label, description]) => (
            <li key={label} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <h3 className="font-medium">{label}</h3>
              <p className="mt-1 text-sm leading-5 text-slate-400">{description}</p>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm leading-6 text-slate-400">
        Next integration requirement: authenticated session, candidate ownership enforcement, server-side validation,
        durable persistence, consent capture, and auditable changes before profile editing is enabled.
      </p>
    </main>
  );
}
