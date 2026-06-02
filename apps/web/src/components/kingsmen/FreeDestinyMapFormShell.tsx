export function FreeDestinyMapFormShell() {
  const fieldStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(212,175,55,0.35)",
    background: "#020617",
    color: "#f8fafc"
  };

  const labelStyle = {
    display: "block",
    marginBottom: 6,
    color: "#f8fafc",
    fontSize: 13
  };

  return (
    <section style={{ border: "1px solid rgba(212,175,55,0.35)", borderRadius: 22, padding: 22, background: "rgba(2,6,23,0.92)", color: "#f8fafc" }}>
      <p style={{ margin: 0, color: "#d4af37", letterSpacing: "0.12em", textTransform: "uppercase", fontSize: 12 }}>Free first map</p>
      <h2 style={{ marginTop: 8 }}>Start your Free Destiny Map</h2>
      <p style={{ color: "#cbd5e1", lineHeight: 1.7 }}>
        This shell captures the first user intent. Backend saving, email delivery, source checks and proof tracking come in later batches.
      </p>

      <form style={{ display: "grid", gap: 14 }}>
        <label>
          <span style={labelStyle}>Your name</span>
          <input style={fieldStyle} placeholder="Full name" />
        </label>

        <label>
          <span style={labelStyle}>Province / area</span>
          <input style={fieldStyle} placeholder="Example: KwaZulu-Natal, Gauteng, Eastern Cape" />
        </label>

        <label>
          <span style={labelStyle}>What are you trying to do?</span>
          <select style={fieldStyle} defaultValue="">
            <option value="" disabled>Select one</option>
            <option>Apply to university</option>
            <option>Explore TVET</option>
            <option>Find learnership / SETA route</option>
            <option>Find job / internship / apprenticeship</option>
            <option>Need NSFAS or bursary readiness</option>
            <option>Need accommodation</option>
            <option>Improve CV</option>
            <option>I am confused and need a full map</option>
          </select>
        </label>

        <label>
          <span style={labelStyle}>Heard about a random opportunity or place?</span>
          <input style={fieldStyle} placeholder="Bursary, job, college, landlord, learnership, accommodation, training provider..." />
        </label>

        <label>
          <span style={labelStyle}>What do you already have?</span>
          <textarea style={{ ...fieldStyle, minHeight: 110 }} placeholder="Documents, CV, marks, ID, proof, known route, accommodation need..." />
        </label>

        <button type="button" style={{ border: 0, borderRadius: 999, padding: "13px 18px", background: "#d4af37", color: "#020617", fontWeight: 800 }}>
          Shell only - backend connection comes next
        </button>
      </form>
    </section>
  );
}
