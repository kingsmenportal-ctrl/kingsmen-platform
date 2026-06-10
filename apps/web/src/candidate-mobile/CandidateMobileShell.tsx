export function CandidateMobileShell() {
  const laws = [
    "MOBILE_WEB_FIRST",
    "PUBLIC_TO_PORTAL_HANDOFF",
    "EMAIL_PRIMARY",
    "WHATSAPP_URGENT_ONLY",
    "NO_FAKE_STATUS",
    "SMART_FORM_DOES_NOT_RETYPE_DOCUMENT_DATA"
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Kingsmen Candidate Mobile</p>
        <h1 className="text-4xl font-black">Mobile route command, not a separate weak app.</h1>
        <p className="max-w-3xl text-slate-300">
          Candidates continue from public website to secure portal, complete missing details, upload documents,
          view verified status cards, and follow manual fallback instructions without retyping what Kingsmen
          already extracted from their CV and documents.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          {laws.map((law) => (
            <div key={law} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-cyan-300">Locked law</p>
              <p className="font-bold">{law}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}