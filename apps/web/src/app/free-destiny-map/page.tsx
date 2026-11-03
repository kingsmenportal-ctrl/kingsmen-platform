import FreeDestinyMapIntakeForm from "@/components/candidate/FreeDestinyMapIntakeForm";

export default function FreeDestinyMapPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px 20px 64px",
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

        <h1 style={{ margin: 0, fontSize: "clamp(34px, 6vw, 48px)", lineHeight: 1.05, color: "#fff7d6" }}>
          Start your Kingsmen route discovery.
        </h1>

        <p style={{ maxWidth: "760px", color: "#d5d9e2", fontSize: "16px", lineHeight: 1.7 }}>
          One national entry point for higher education, TVET, SETA programmes and learnerships,
          internships, apprenticeships, employment, funding, accommodation, documents and CV support.
          Kingsmen assesses possible routes; providers retain authority over admission, funding and hiring.
        </p>

        <FreeDestinyMapIntakeForm />

        <aside
          style={{
            padding: "16px",
            borderRadius: "16px",
            border: "1px solid rgba(214, 178, 94, 0.2)",
            color: "#aeb7c5",
            fontSize: "13px",
            lineHeight: 1.65
          }}
        >
          <strong style={{ color: "#fff7d6" }}>Important boundary:</strong> this is a route-intake request,
          not account registration or an official application. A successful response confirms only that
          the backend command boundary accepted the request. Durable storage, identity verification,
          provider confirmation, application submission and outcomes require separate evidence. Do not
          submit identity numbers, passport details, banking information or documents through this form.
        </aside>
      </section>
    </main>
  );
}
