const gates = [
  {
    title: "PayFast sandbox ITN evidence",
    state: "external proof required",
    command: "npm run payfast:staging -- <real sandbox proof flags>",
    detail: "Requires real sandbox provider values, checkout creation, ITN receipt, signature check, amount check, duplicate rejection, failed-payment rejection, refund review, and founder review."
  },
  {
    title: "Communications provider proof",
    state: "external proof required",
    command: "npm run communications:staging -- <real provider proof flags>",
    detail: "Requires real SMTP/provider values, send/receive proof, bounce handling, opt-out path, urgent-only WhatsApp review, SMS fallback review, and founder review."
  },
  {
    title: "Branch protection/account review",
    state: "repo/account proof required",
    command: "npm run repo:branch-review -- <review flags>",
    detail: "Records account constraints and compensating-control review, but true pass requires actual main branch protection and founder review."
  },
  {
    title: "Final assembly founder review",
    state: "last gate",
    command: "npm run final:founder-review -- <final review flags>",
    detail: "Requires complete final evidence bundle, launch audit without hard blockers, provider risk acceptance, branch risk acceptance, and no-live-writes confirmation."
  }
];

export default function JarvisGatesPage() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Kingsmen Jarvis</p>
        <h1>Launch Gates</h1>
        <p>These gates are intentionally strict. Jarvis may track and explain them, but it must not mark them ready without real evidence.</p>
      </section>

      <section className="cards">
        {gates.map((gate) => (
          <article className="card" key={gate.title}>
            <span>{gate.state}</span>
            <h2>{gate.title}</h2>
            <p>{gate.detail}</p>
            <code>{gate.command}</code>
          </article>
        ))}
      </section>

      <section className="footerBox">
        <h2>Gate evaluation</h2>
        <code>npm run jarvis:gates:evaluate</code>
        <p>This reads the four reports and returns exactly which gate still blocks live activation.</p>
      </section>

      <style jsx>{`
        .shell { min-height: 100vh; padding: 36px; background: #08111f; color: #eef5ff; font-family: Arial, sans-serif; }
        .hero { max-width: 1100px; margin: 0 auto 28px; }
        .eyebrow { color: #8bb8ff; text-transform: uppercase; letter-spacing: 0.16em; font-size: 12px; }
        h1 { font-size: 40px; margin: 8px 0; }
        .cards { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
        .card, .footerBox { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.13); border-radius: 20px; padding: 22px; }
        .card span { color: #8bb8ff; font-size: 12px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; }
        .card p, .footerBox p { color: #c8d5ea; line-height: 1.5; }
        code { display: block; background: #050b14; color: #dfeaff; padding: 12px; border-radius: 12px; overflow-x: auto; }
        .footerBox { max-width: 1100px; margin: 18px auto 0; }
        @media (max-width: 860px) { .cards { grid-template-columns: 1fr; } .shell { padding: 20px; } }
      `}</style>
    </main>
  );
}
