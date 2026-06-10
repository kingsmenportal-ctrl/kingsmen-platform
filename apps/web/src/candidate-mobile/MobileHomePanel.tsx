const cards = [
  ["Route status", "See route readiness, MAP fallback, documents, finance activation, and next action."],
  ["Smart intake", "Only confirm missing or uncertain fields. CV/document data is reused, not retyped."],
  ["Document vault", "Upload once and reuse across route applications with verification evidence."],
  ["Support", "Email-first support with urgent WhatsApp boundary and auditable message ledger."]
];

export function MobileHomePanel() {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900 p-5 text-white">
      <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Mobile home</p>
      <h2 className="mt-2 text-2xl font-black">Candidate command surface</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {cards.map(([title, body]) => (
          <article key={title} className="rounded-2xl bg-white/5 p-4">
            <h3 className="font-bold">{title}</h3>
            <p className="mt-2 text-sm text-slate-300">{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}