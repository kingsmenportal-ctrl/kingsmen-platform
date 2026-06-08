import ImportNormalizerClient from "./ImportNormalizerClient";

export const dynamic = "force-dynamic";

export default function PersonalJobsImportNormalizerPage() {
  return (
    <main
      data-kingsmen-personal-jobs-13-route="true"
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 12% 8%, rgba(214,178,94,0.22), transparent 30%), radial-gradient(circle at 92% 78%, rgba(248,215,122,0.12), transparent 35%), linear-gradient(135deg, #050403 0%, #171008 48%, #030303 100%)",
        color: "#f8edd2",
        padding: "28px",
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
      }}
    >
      <section style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gap: "22px" }}>
        <header
          style={{
            border: "1px solid rgba(214,178,94,0.30)",
            borderRadius: "34px",
            padding: "30px",
            background: "rgba(255,255,255,0.045)",
            boxShadow: "0 28px 100px rgba(0,0,0,0.45)"
          }}
        >
          <p style={{ margin: 0, color: "#d6b25e", fontSize: "12px", letterSpacing: "0.24em", textTransform: "uppercase", fontWeight: 900 }}>
            PERSONAL-JOBS-13 · PJ02 Schema Repair
          </p>

          <h1 style={{ margin: "12px 0 8px", fontSize: "clamp(2.2rem, 5vw, 5.2rem)", lineHeight: 0.92, letterSpacing: "-0.08em" }}>
            Import Normalizer
          </h1>

          <p style={{ margin: 0, maxWidth: "1000px", color: "rgba(248,237,210,0.78)", fontSize: "17px", lineHeight: 1.7 }}>
            Repair imported PJ11 and PJ12 leads into the exact PJ02 opportunity ledger shape before scoring, apply-pack creation, submissions, follow-ups, and outcomes. This desk is local-only and creates a backup before rewriting the PJ02 local ledger.
          </p>
        </header>

        <ImportNormalizerClient />
      </section>
    </main>
  );
}