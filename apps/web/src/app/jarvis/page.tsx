export default function JarvisPage() {
  const cards = [
    {
      title: "Database Foundation",
      status: "READY",
      detail: "Local PostgreSQL is connected. N03 to N20 migrations are applied. Migration ledger confirmed 18/18."
    },
    {
      title: "Web Runtime",
      status: "READY",
      detail: "Next.js runtime is running from apps/web on http://127.0.0.1:3000."
    },
    {
      title: "Founder Command Surface",
      status: "VISIBLE",
      detail: "Jarvis is now exposed as a browser route for founder/operator visibility."
    },
    {
      title: "API Command Execution",
      status: "PENDING WIRING",
      detail: "apps/api source exists, but it still needs a runnable package boundary before live command execution."
    }
  ];

  const commands = [
    "SYSTEM_VALIDATE_N20",
    "DB_LEDGER_CHECK",
    "QUEUE_HEALTH_CHECK",
    "INCIDENT_REVIEW",
    "MANUAL_FALLBACK_REVIEW",
    "FOUNDER_OVERRIDE_REVIEW",
    "PUBLIC_ROUTE_HOUSE_CHECK",
    "CANDIDATE_PORTAL_CHECK"
  ];

  const pillStyle = (color: string) => ({
    border: "1px solid " + color,
    color,
    borderRadius: "999px",
    padding: "8px 12px",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "0.08em",
    background: "rgba(2,6,23,0.44)"
  });

  return (
    <main style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at top left, #18233f 0, #07111f 40%, #030712 100%)",
      color: "#f8fafc",
      fontFamily: "Arial, Helvetica, sans-serif",
      padding: "32px"
    }}>
      <section style={{
        maxWidth: "1180px",
        margin: "0 auto",
        display: "grid",
        gap: "24px"
      }}>
        <header style={{
          border: "1px solid rgba(148,163,184,0.35)",
          borderRadius: "24px",
          padding: "28px",
          background: "rgba(15,23,42,0.72)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.35)"
        }}>
          <p style={{
            margin: "0 0 10px",
            color: "#38bdf8",
            letterSpacing: "0.16em",
            fontSize: "12px",
            fontWeight: 700
          }}>
            KINGSMEN FOUNDER COMMAND INTERFACE
          </p>

          <h1 style={{
            margin: 0,
            fontSize: "clamp(34px, 6vw, 72px)",
            lineHeight: 0.95,
            letterSpacing: "-0.06em"
          }}>
            JARVIS
          </h1>

          <p style={{
            maxWidth: "820px",
            color: "#cbd5e1",
            fontSize: "18px",
            lineHeight: 1.65,
            marginTop: "18px"
          }}>
            Jarvis is the visible founder/operator surface for Kingsmen. It is not a fake chatbot and it does not replace the backend state machine. It presents command readiness, evidence, incidents, queue health, and safe founder actions.
          </p>

          <div style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            marginTop: "22px"
          }}>
            <span style={pillStyle("#10b981")}>DB CONFIRMED</span>
            <span style={pillStyle("#38bdf8")}>WEB ONLINE</span>
            <span style={pillStyle("#f59e0b")}>API WIRING NEXT</span>
          </div>
        </header>

        <section style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "16px"
        }}>
          {cards.map((card) => (
            <article key={card.title} style={{
              border: "1px solid rgba(148,163,184,0.25)",
              borderRadius: "20px",
              padding: "20px",
              background: "rgba(15,23,42,0.62)"
            }}>
              <p style={{
                margin: "0 0 10px",
                color: "#94a3b8",
                fontSize: "12px",
                letterSpacing: "0.12em",
                fontWeight: 700
              }}>
                {card.status}
              </p>
              <h2 style={{
                margin: "0 0 10px",
                fontSize: "20px"
              }}>
                {card.title}
              </h2>
              <p style={{
                color: "#cbd5e1",
                lineHeight: 1.55,
                margin: 0
              }}>
                {card.detail}
              </p>
            </article>
          ))}
        </section>

        <section style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "18px"
        }}>
          <article style={{
            border: "1px solid rgba(56,189,248,0.32)",
            borderRadius: "22px",
            padding: "22px",
            background: "rgba(8,47,73,0.38)"
          }}>
            <h2 style={{ marginTop: 0 }}>What Jarvis is supposed to do</h2>
            <p style={{ color: "#dbeafe", lineHeight: 1.65 }}>
              Jarvis is the Kingsmen command cockpit. It must read system truth from PostgreSQL, show the founder what needs attention, surface safe command options, and never silently execute risky actions without policy checks and evidence logging.
            </p>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
              gap: "10px",
              marginTop: "18px"
            }}>
              {commands.map((command) => (
                <div key={command} style={{
                  border: "1px solid rgba(125,211,252,0.25)",
                  borderRadius: "14px",
                  padding: "12px",
                  background: "rgba(2,6,23,0.42)",
                  color: "#e0f2fe",
                  fontSize: "13px",
                  fontWeight: 700
                }}>
                  {command}
                </div>
              ))}
            </div>
          </article>

          <aside style={{
            border: "1px solid rgba(245,158,11,0.36)",
            borderRadius: "22px",
            padding: "22px",
            background: "rgba(69,26,3,0.35)"
          }}>
            <h2 style={{ marginTop: 0 }}>Current truth</h2>
            <p style={{ color: "#fde68a", lineHeight: 1.6 }}>
              You could not see Jarvis because no visible /jarvis route had been exposed in the web shell. PJ34 fixes visibility only. The next phase must connect this surface to the real backend command/runtime boundary.
            </p>
            <p style={{
              marginTop: "18px",
              padding: "12px",
              borderRadius: "12px",
              background: "rgba(0,0,0,0.28)",
              color: "#fff7ed",
              fontWeight: 700
            }}>
              Next: PJ35 API command runner + database-backed Jarvis status cards.
            </p>
          </aside>
        </section>
      </section>
    </main>
  );
}
