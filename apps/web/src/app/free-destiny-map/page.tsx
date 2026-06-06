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
          Start your Kingsmen route discovery.
        </h1>

        <p style={{ maxWidth: "760px", color: "#d5d9e2", fontSize: "16px", lineHeight: 1.7 }}>
          This safe public intake surface helps you describe your current stage, province, route
          interest, biggest blocker, and readiness goal before any managed package. No payment is
          required for this Free Destiny Map starting point.
        </p>

        <form
          data-kingsmen-free-destiny-map-intake="true"
          style={{
            display: "grid",
            gap: "14px",
            padding: "22px",
            borderRadius: "28px",
            border: "1px solid rgba(214, 178, 94, 0.28)",
            background: "rgba(255, 255, 255, 0.045)",
            boxShadow: "0 22px 70px rgba(0,0,0,0.28)"
          }}
        >
          <div style={{ display: "grid", gap: "7px" }}>
            <label htmlFor="current-stage" style={{ color: "#fff7d6", fontWeight: 800 }}>
              Current stage
            </label>
            <select
              id="current-stage"
              data-kingsmen-intake-field="current-stage"
              defaultValue=""
              style={{
                padding: "12px",
                borderRadius: "14px",
                border: "1px solid rgba(214, 178, 94, 0.22)",
                background: "#101522",
                color: "#f8f3e7"
              }}
            >
              <option value="" disabled>
                Choose your current stage
              </option>
              <option>Grade 9 - 11</option>
              <option>Grade 12 / Matric</option>
              <option>Matric completed</option>
              <option>TVET / college student</option>
              <option>Unemployed and seeking opportunity</option>
              <option>Working and seeking upgrade</option>
            </select>
          </div>

          <div style={{ display: "grid", gap: "7px" }}>
            <label htmlFor="province" style={{ color: "#fff7d6", fontWeight: 800 }}>
              Province
            </label>
            <select
              id="province"
              data-kingsmen-intake-field="province"
              defaultValue=""
              style={{
                padding: "12px",
                borderRadius: "14px",
                border: "1px solid rgba(214, 178, 94, 0.22)",
                background: "#101522",
                color: "#f8f3e7"
              }}
            >
              <option value="" disabled>
                Choose province
              </option>
              <option>Eastern Cape</option>
              <option>Free State</option>
              <option>Gauteng</option>
              <option>KwaZulu-Natal</option>
              <option>Limpopo</option>
              <option>Mpumalanga</option>
              <option>Northern Cape</option>
              <option>North West</option>
              <option>Western Cape</option>
            </select>
          </div>

          <div style={{ display: "grid", gap: "7px" }}>
            <label htmlFor="route-interest" style={{ color: "#fff7d6", fontWeight: 800 }}>
              Route interest
            </label>
            <select
              id="route-interest"
              data-kingsmen-intake-field="route-interest"
              defaultValue=""
              style={{
                padding: "12px",
                borderRadius: "14px",
                border: "1px solid rgba(214, 178, 94, 0.22)",
                background: "#101522",
                color: "#f8f3e7"
              }}
            >
              <option value="" disabled>
                Choose route
              </option>
              <option>University</option>
              <option>TVET college</option>
              <option>SETA / learnership</option>
              <option>Internship / apprenticeship</option>
              <option>Employment / CV path</option>
              <option>Bursary / funding support</option>
              <option>I am not sure yet</option>
            </select>
          </div>

          <div style={{ display: "grid", gap: "7px" }}>
            <label htmlFor="biggest-blocker" style={{ color: "#fff7d6", fontWeight: 800 }}>
              Biggest blocker
            </label>
            <select
              id="biggest-blocker"
              data-kingsmen-intake-field="biggest-blocker"
              defaultValue=""
              style={{
                padding: "12px",
                borderRadius: "14px",
                border: "1px solid rgba(214, 178, 94, 0.22)",
                background: "#101522",
                color: "#f8f3e7"
              }}
            >
              <option value="" disabled>
                Choose blocker
              </option>
              <option>I do not know what to apply for</option>
              <option>I am missing documents</option>
              <option>I need funding guidance</option>
              <option>I need a better CV</option>
              <option>I am worried about deadlines</option>
              <option>I need backup options</option>
            </select>
          </div>

          <div style={{ display: "grid", gap: "7px" }}>
            <label htmlFor="readiness-goal" style={{ color: "#fff7d6", fontWeight: 800 }}>
              Readiness goal
            </label>
            <textarea
              id="readiness-goal"
              data-kingsmen-intake-field="readiness-goal"
              placeholder="Example: I want to know the safest route and what documents I need."
              rows={4}
              style={{
                padding: "12px",
                borderRadius: "14px",
                border: "1px solid rgba(214, 178, 94, 0.22)",
                background: "#101522",
                color: "#f8f3e7",
                resize: "vertical"
              }}
            />
          </div>

          <label
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "flex-start",
              color: "#d5d9e2",
              fontSize: "13px",
              lineHeight: 1.6
            }}
          >
            <input
              id="intake-boundary-confirmation"
              data-kingsmen-intake-field="boundary-confirmation"
              type="checkbox"
              style={{ marginTop: "4px" }}
            />
            I understand this is a safe Free Destiny Map starting surface only. It does not submit
            my information yet, does not create an application, and does not guarantee acceptance,
            funding, placement, or employment.
          </label>

          <button
            data-kingsmen-intake-button="preview-path"
            type="button"
            style={{
              display: "inline-flex",
              width: "fit-content",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "8px",
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
            Preview my readiness path
          </button>
        </form>

        <p style={{ color: "#aeb7c5", fontSize: "13px", lineHeight: 1.6 }}>
          Boundary: this page is a public intake surface only. It does not collect personal contact channels,
          official personal identifiers, documents, payments, outbound messages, urgent channel messages, production
          credentials, or Oracle deployment proof.
        </p>
      </section>
    </main>
  );
}

