import Link from "next/link";
import { N04_OFFICIAL_PACKAGE_PRICES } from "../../../../../packages/backend/src/n04/service-order-policy";

const packageRows = Object.entries(N04_OFFICIAL_PACKAGE_PRICES).map(([code, value]) => ({
  code,
  name: value.name,
  price: value.displayPrice
}));

export default function PackagesPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#080d16", color: "#f4f1e8", fontFamily: "Inter, ui-sans-serif, system-ui, Arial, sans-serif" }}>
      <style>{`
        *{box-sizing:border-box}
        .km-package-wrap{width:min(1120px,calc(100% - 32px));margin:auto}
        .km-package-nav{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px 0;border-bottom:1px solid #253043;flex-wrap:wrap}
        .km-package-brand{font-weight:900;letter-spacing:2px;text-decoration:none}
        .km-package-link{display:inline-flex;align-items:center;justify-content:center;padding:11px 15px;border:1px solid #8e7547;border-radius:9px;color:#f2d48a;text-decoration:none;font-weight:800;font-size:13px}
        .km-package-hero{padding:54px 0 36px}
        .km-package-eyebrow{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#e3bf70;font-weight:800}
        .km-package-hero h1{font-size:clamp(32px,5vw,54px);line-height:1.08;letter-spacing:-1.8px;margin:14px 0}
        .km-package-muted{color:#b7c1d1;line-height:1.8;max-width:760px}
        .km-package-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px;padding:20px 0 36px}
        .km-package-card{border:1px solid #344158;border-radius:15px;background:linear-gradient(150deg,#151f30,#0c1320);padding:22px;min-height:175px;display:flex;flex-direction:column;gap:12px}
        .km-package-card h2{font-size:18px;margin:0}
        .km-package-price{font-size:28px;font-weight:900;color:#f2d48a}
        .km-package-code{font-size:10px;letter-spacing:1.5px;color:#98a5b8}
        .km-package-rules{border:1px solid #2b374b;border-radius:14px;padding:22px;background:#0d1522;margin-bottom:30px}
        .km-package-rules h2{margin-top:0}
        .km-package-rules li{color:#b7c1d1;line-height:1.8;margin:6px 0}
        .km-package-footer{padding:24px 0 40px;border-top:1px solid #253043;color:#8996aa;font-size:12px;display:flex;gap:16px;flex-wrap:wrap;justify-content:space-between}
        @media(max-width:800px){.km-package-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:520px){.km-package-grid{grid-template-columns:1fr}.km-package-hero{padding-top:36px}}
      `}</style>
      <div className="km-package-wrap">
        <nav className="km-package-nav" aria-label="Kingsmen product navigation">
          <Link className="km-package-brand" href="/">KINGSMEN ONE</Link>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            <Link className="km-package-link" href="/#pathways">Explore pathways</Link>
            <Link className="km-package-link" href="/candidate/login">Sign in / create account</Link>
          </div>
        </nav>
        <section className="km-package-hero">
          <div className="km-package-eyebrow">Transparent service catalogue · South Africa</div>
          <h1>Choose the service intensity that fits your route.</h1>
          <p className="km-package-muted">Every package keeps discovery open across all six Kingsmen pathways. Packages define managed-service quantity and intensity—not which opportunity sectors you are allowed to see. Prices below come from Kingsmen's canonical backend price register.</p>
        </section>
        <section aria-label="Canonical Kingsmen package prices" className="km-package-grid">
          {packageRows.map(item => (
            <article key={item.code} className="km-package-card">
              <div className="km-package-code">{item.code.replaceAll("_", " ")}</div>
              <h2>{item.name}</h2>
              <div className="km-package-price">{item.price}</div>
            </article>
          ))}
        </section>
        <section className="km-package-rules" aria-labelledby="package-rules-title">
          <h2 id="package-rules-title">What every package must preserve</h2>
          <ul>
            <li>One reusable candidate profile across higher education, TVET, SETA programmes and learnerships, internships, apprenticeships and employment.</li>
            <li>Source verification, deadline awareness, document readiness and honest application status.</li>
            <li>Funding, NSFAS, bursary and accommodation support where relevant; these support layers do not replace the six core pathways.</li>
            <li>No package guarantees admission, funding, employment, provider acceptance or any other outcome.</li>
          </ul>
          <p className="km-package-muted">Before a payment is requested, the selected order must show its confirmed managed-service allowance and applicable terms. This page is a price catalogue; it does not mark orders paid or initiate a payment.</p>
          <Link className="km-package-link" href="/candidate/login">Sign in to review your service orders</Link>
        </section>
        <footer className="km-package-footer">
          <span>© Kingsmen One · South Africa</span>
          <span>Prices are in South African rand (ZAR).</span>
        </footer>
      </div>
    </main>
  );
}
