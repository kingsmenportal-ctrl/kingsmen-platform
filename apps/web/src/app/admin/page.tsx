import Link from "next/link";

export default function AdminHomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Kingsmen Admin</p>
        <h1>Operator Console</h1>
        <p>Open Jarvis runtime, launch gates, or backend status.</p>
      </section>

      <section className="cards">
        <Link href="/admin/jarvis-live" className="card">
          <span>LIVE</span>
          <h2>Jarvis Live</h2>
          <p>Run Jarvis command checks and view decisions, blockers, and ledger events.</p>
        </Link>
        <Link href="/admin/jarvis-gates" className="card">
          <span>GATES</span>
          <h2>Launch Gates</h2>
          <p>Track PayFast, communications, branch review, and final founder review.</p>
        </Link>
        <Link href="/api/jarvis/status" className="card">
          <span>STATUS</span>
          <h2>Jarvis Status</h2>
          <p>View backend health and Jarvis route confirmation.</p>
        </Link>
      </section>

      <style jsx>{`
        .shell { min-height: 100vh; padding: 36px; background: #08111f; color: #eef5ff; font-family: Arial, sans-serif; }
        .hero { max-width: 980px; margin: 0 auto 28px; }
        .eyebrow { color: #8bb8ff; text-transform: uppercase; letter-spacing: 0.16em; font-size: 12px; }
        h1 { font-size: 40px; margin: 8px 0; }
        .cards { max-width: 980px; margin: 0 auto; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
        .card { display: block; text-decoration: none; color: inherit; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.13); border-radius: 20px; padding: 22px; }
        .card span { color: #8bb8ff; font-size: 12px; font-weight: 800; letter-spacing: 0.12em; }
        .card h2 { margin: 12px 0 8px; }
        .card p { color: #c8d5ea; line-height: 1.5; }
        @media (max-width: 900px) { .cards { grid-template-columns: 1fr; } .shell { padding: 20px; } }
      `}</style>
    </main>
  );
}
