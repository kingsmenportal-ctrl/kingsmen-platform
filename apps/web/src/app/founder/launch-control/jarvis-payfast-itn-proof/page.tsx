export const dynamic = "force-dynamic";

const requirements = [
  {
    title: "Credentials Outside Git",
    state: "PENDING_CREDENTIALS",
    detail: "Merchant ID, merchant key, passphrase, notify URL, and payment provider secret must stay outside Git and never appear in web responses."
  },
  {
    title: "Sandbox Checkout",
    state: "PENDING_EVIDENCE",
    detail: "Checkout must be backend-created, linked to a finance/order record, and captured in the evidence ledger."
  },
  {
    title: "Accepted ITN",
    state: "REJECTED_UNTIL_ACCEPTED_ITN",
    detail: "Only accepted PayFast ITN evidence may mark paid. Return/cancel URLs never clear payment state."
  },
  {
    title: "Duplicate and Failed Payment Rejection",
    state: "PENDING_EVIDENCE",
    detail: "Duplicate ITNs must be idempotent. Failed, cancelled, pending, or mismatched notifications must not mark paid."
  },
  {
    title: "Refund Review + Founder Approval",
    state: "BLOCKED_BY_PROVIDER_EVIDENCE",
    detail: "Refunds and finance corrections require audit evidence, review boundary, and founder approval."
  }
];

const blockers = [
  "PayFast paid status cannot be accepted from return URL.",
  "PayFast paid status cannot be accepted from cancel URL.",
  "Screenshots or manual notes do not count without accepted ITN evidence.",
  "Duplicate ITNs must not double-credit the order or candidate.",
  "Failed/pending/cancelled notifications must keep payment unpaid or review-only.",
  "Founder approval and refund review are required before launch readiness."
];

export default function JarvisPayFastItnProofPage() {
  return (
    <main style={shell}>
      <section style={frame}>
        <p style={kicker}>Kingsmen · Jarvis Live Proof Batch 3</p>
        <h1 style={title}>PayFast Accepted ITN Proof</h1>
        <p style={lead}>
          This gate protects Kingsmen finance truth. PayFast can only clear payment state after sandbox checkout, accepted ITN, duplicate rejection, failed-payment rejection, refund review, and founder approval evidence exist.
        </p>

        <section style={stats}>
          <article style={card}><span>Runtime live</span><strong>false</strong></article>
          <article style={card}><span>Production</span><strong>false</strong></article>
          <article style={card}><span>Public launch</span><strong>false</strong></article>
          <article style={card}><span>PayFast proof</span><strong>not accepted</strong></article>
        </section>

        <section style={grid}>
          <article style={panel}>
            <h2>Proof requirements</h2>
            {requirements.map((item) => (
              <div key={item.title} style={row}>
                <span style={pill(item.state)}>{item.state}</span>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </div>
            ))}
          </article>

          <article style={panel}>
            <h2>Rejected until real evidence</h2>
            {blockers.map((blocker) => <p key={blocker} style={line}>• {blocker}</p>)}
            <a href="/api/jarvis/payfast-accepted-itn-proof" style={link}>Open PayFast proof gate JSON</a>
          </article>
        </section>
      </section>
    </main>
  );
}

function pill(state: string) {
  const blocked = state.includes("REJECTED") || state.includes("BLOCKED");
  const pending = state.includes("PENDING");
  return {
    display: "inline-block",
    border: `1px solid ${blocked ? "rgba(255,117,117,0.38)" : pending ? "rgba(255,227,163,0.38)" : "rgba(112,247,255,0.42)"}`,
    borderRadius: 999,
    padding: "5px 8px",
    color: blocked ? "#ffc9c9" : pending ? "#ffe3a3" : "#70f7ff",
    fontSize: "0.72rem",
    fontWeight: 900
  };
}

const shell = {
  minHeight: "100vh",
  padding: 28,
  color: "#ecfbff",
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  background: "radial-gradient(circle at 15% 12%, rgba(0,224,255,0.22), transparent 28%), radial-gradient(circle at 78% 18%, rgba(149,76,255,0.18), transparent 30%), linear-gradient(145deg, #040813, #071323 46%, #02040a)"
};
const frame = { maxWidth: 1320, margin: "0 auto" };
const kicker = { color: "#70f7ff", letterSpacing: "0.18em", textTransform: "uppercase" as const, fontWeight: 900 };
const title = { margin: "10px 0", fontSize: "clamp(2.6rem, 7vw, 6rem)", letterSpacing: "-0.07em", lineHeight: 0.9 };
const lead = { color: "rgba(236,251,255,0.72)", maxWidth: 920, lineHeight: 1.65 };
const stats = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, margin: "22px 0" };
const card = { border: "1px solid rgba(139,231,255,0.22)", borderRadius: 22, padding: 18, background: "rgba(8,22,39,0.86)" };
const grid = { display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 18 };
const panel = { border: "1px solid rgba(139,231,255,0.22)", borderRadius: 24, padding: 22, background: "rgba(8,22,39,0.86)" };
const row = { borderTop: "1px solid rgba(139,231,255,0.18)", paddingTop: 14, marginTop: 14 };
const line = { color: "rgba(236,251,255,0.72)", lineHeight: 1.55 };
const link = { display: "inline-block", marginTop: 18, color: "#9dffcb", fontWeight: 900 };
