export default function KingsmenPublicPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px",
        background:
          "radial-gradient(circle at top, rgba(214,178,94,0.2), transparent 32%), #07090f",
        color: "#f8f3e7",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
      }}
    >
      <section style={{ maxWidth: "980px", margin: "0 auto", display: "grid", gap: "18px" }}>
        <p
          style={{
            margin: 0,
            color: "#d6b25e",
            fontSize: "13px",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            fontWeight: 900
          }}
        >
          Kingsmen Portal
        </p>

        <h1 style={{ margin: 0, fontSize: "44px", lineHeight: 1.05, color: "#fff7d6" }}>
          Start your opportunity path with Kingsmen.
        </h1>

        <p style={{ maxWidth: "760px", color: "#d5d9e2", fontSize: "16px", lineHeight: 1.7 }}>
          Kingsmen helps South African candidates prepare for education, TVET, SETA,
          learnership, bursary, employment, and opportunity routes. The Free Destiny Map is the
          safest public starting point before any managed package.
        </p>

        <a
          data-kingsmen-free-destiny-map-entry="true"
          href="/free-destiny-map/"
          style={{
            display: "inline-flex",
            width: "fit-content",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "18px",
            padding: "13px 18px",
            borderRadius: "999px",
            border: "1px solid rgba(214, 178, 94, 0.62)",
            background: "linear-gradient(135deg, rgba(214,178,94,0.22), rgba(214,178,94,0.08))",
            color: "#f8d77a",
            fontWeight: 900,
            textDecoration: "none",
            boxShadow: "0 16px 48px rgba(0,0,0,0.24)"
          }}
        >
          Start Free Destiny Map
        </a>

        <p style={{ color: "#aeb7c5", fontSize: "13px", lineHeight: 1.6 }}>
          Boundary: this public entry does not process candidate data, payments, email, WhatsApp,
          Oracle deployment, PayFast actions, or production credentials.
        </p>
      </section>
    </main>
  );
}
