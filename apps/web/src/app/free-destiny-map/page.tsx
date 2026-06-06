export default function FreeDestinyMapPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px",
        background:
          "radial-gradient(circle at top left, rgba(214,178,94,0.2), transparent 34%), #080a12",
        color: "#f8f3e7",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
      }}
    >
      <section
        data-kingsmen-free-destiny-map-identity="true"
        style={{ maxWidth: "980px", margin: "0 auto", display: "grid", gap: "18px" }}
      >
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
          Free Destiny Map
        </p>

        <h1 style={{ margin: 0, fontSize: "44px", lineHeight: 1.05, color: "#fff7d6" }}>
          Free Destiny Map
        </h1>

        <p style={{ maxWidth: "760px", color: "#d5d9e2", fontSize: "16px", lineHeight: 1.7 }}>
          Start your Kingsmen route discovery without payment. This entry point helps candidates
          begin education, TVET, SETA, employment, bursary, and opportunity readiness safely before
          any managed package.
        </p>

        <p style={{ color: "#aeb7c5", fontSize: "13px", lineHeight: 1.6 }}>
          Boundary: this page is a public entry surface only. It does not submit applications,
          process candidate data, collect payments, send email, send WhatsApp, claim production
          readiness, or claim Oracle deployment.
        </p>
      </section>
    </main>
  );
}
