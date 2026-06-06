export const dynamic = "force-static";

const proofCards = [
  {
    "id": "batch-21",
    "title": "BATCH 21",
    "label": "Controlled Docker Oracle Lite Runtime",
    "status": "PROVEN"
  },
  {
    "id": "batch-22",
    "title": "BATCH 22",
    "label": "Runtime Health Hardening",
    "status": "PROVEN"
  },
  {
    "id": "batch-23",
    "title": "BATCH 23",
    "label": "Build Proof Centre Read Model",
    "status": "PROVEN"
  },
  {
    "id": "batch-24",
    "title": "BATCH 24",
    "label": "Control Plane Proof Display Adapter",
    "status": "PROVEN"
  },
  {
    "id": "batch-25",
    "title": "BATCH 25",
    "label": "Founder Proof Centre Page Wiring",
    "status": "PROVEN"
  },
  {
    "id": "batch-26b",
    "title": "BATCH 26B",
    "label": "Founder Proof Centre Runtime Reachability",
    "status": "PROVEN"
  },
  {
    "id": "batch-27",
    "title": "BATCH 27",
    "label": "Founder Control Plane Proof Centre Entry Link",
    "status": "PROVEN"
  },
  {
    "id": "batch-28",
    "title": "BATCH 28",
    "label": "Founder Control Plane Entry Link Runtime Proof",
    "status": "PROVEN"
  }
] as const;

export default function FounderProofCentrePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, #123044 0, #07131f 38%, #03070d 100%)",
        color: "#e8fbff",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        padding: "40px 18px"
      }}
    >
      <section
        style={{
          maxWidth: "1040px",
          margin: "0 auto",
          border: "1px solid rgba(71, 213, 255, 0.28)",
          borderRadius: "28px",
          padding: "32px",
          background: "rgba(5, 15, 28, 0.84)",
          boxShadow: "0 24px 80px rgba(0, 0, 0, 0.45)"
        }}
      >
        <p
          style={{
            color: "#61dafb",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            fontSize: "12px",
            fontWeight: 800,
            margin: "0 0 12px"
          }}
        >
          Local founder proof page only
        </p>

        <h1
          style={{
            fontSize: "clamp(34px, 6vw, 72px)",
            lineHeight: 0.95,
            margin: "0 0 18px",
            color: "#ffffff"
          }}
        >
          Kingsmen Founder Control Plane
        </h1>

        <h2
          style={{
            fontSize: "clamp(22px, 3vw, 34px)",
            margin: "0 0 18px",
            color: "#c8f6ff"
          }}
        >
          Build Proof Centre
        </h2>

        <p
          style={{
            maxWidth: "760px",
            color: "#a9c7d6",
            fontSize: "16px",
            lineHeight: 1.7,
            margin: "0 0 28px"
          }}
        >
          This local Founder Proof Centre shows proof cards for the controlled
          Kingsmen Oracle Lite runtime path. It does not claim production
          readiness, Oracle deployment, public availability, candidate
          processing, payment runtime, email runtime, WhatsApp runtime, or
          official application submission.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px"
          }}
        >
          {proofCards.map((card) => (
            <article
              key={card.title}
              style={{
                border: "1px solid rgba(97, 218, 251, 0.24)",
                borderRadius: "18px",
                padding: "18px",
                background: "rgba(10, 33, 54, 0.72)"
              }}
            >
              <strong
                style={{
                  display: "block",
                  color: "#f8d77a",
                  fontSize: "14px",
                  marginBottom: "8px"
                }}
              >
                {card.title}
              </strong>
              <p style={{ margin: "0 0 14px", color: "#d8eef6" }}>
                {card.label}
              </p>
              <span
                style={{
                  display: "inline-flex",
                  borderRadius: "999px",
                  padding: "7px 12px",
                  background: "rgba(24, 210, 131, 0.12)",
                  border: "1px solid rgba(24, 210, 131, 0.42)",
                  color: "#87ffcf",
                  fontSize: "12px",
                  fontWeight: 900,
                  letterSpacing: "0.08em"
                }}
              >
                {card.status}
              </span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
