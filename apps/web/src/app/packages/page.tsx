const packages = [
  { name: "Foundational Accord", price: "169.99", applications: 5, capacity: 4, accommodation: "8 accommodation routes included", detail: "A focused starting point for candidates who want guided application preparation." },
  { name: "Collegiate Ordinance", price: "299.99", applications: 10, capacity: 8, accommodation: "Accommodation support included", detail: "More priority application capacity for candidates managing several education routes." },
  { name: "Chancellor’s Writ", price: "399.99", applications: 15, capacity: 10, accommodation: "Accommodation support included", detail: "Expanded priority capacity across your eligible pathways." },
  { name: "Regency Mandate", price: "469.99", applications: 15, capacity: 12, accommodation: "Accommodation support included", detail: "The highest managed-route capacity in the education package range." },
  { name: "Artisan Charter", price: "149.99", applications: 5, capacity: 3, accommodation: "Accommodation support included", detail: "A practical route for skills, TVET, learnership and apprenticeship journeys." },
  { name: "Guildmasters Charter", price: "199.99", applications: 8, capacity: 5, accommodation: "Accommodation support included", detail: "Additional priority capacity for skills and workplace pathways." },
];

const styles = `
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#080d16;color:#f4f1e8;font-family:Inter,ui-sans-serif,system-ui,Arial,sans-serif}a{color:inherit}.wrap{width:min(1120px,calc(100% - 36px));margin:auto}.nav{min-height:78px;display:flex;align-items:center;justify-content:space-between;gap:16px;border-bottom:1px solid #253043}.brand{display:flex;align-items:center;gap:11px;text-decoration:none}.mark{width:40px;height:40px;display:grid;place-items:center;border-radius:11px;background:linear-gradient(140deg,#f2d48a,#b58a3b);color:#111827;font-weight:950;font-size:20px}.links{display:flex;gap:18px;align-items:center;font-size:13px;color:#c1cada}.links a{text-decoration:none}.btn{display:inline-flex;align-items:center;justify-content:center;padding:12px 16px;border-radius:9px;background:linear-gradient(135deg,#f2d48a,#c49a4a);color:#111827;text-decoration:none;font-weight:800;font-size:13px;border:1px solid #f2d48a}.hero{padding:64px 0 40px;max-width:790px}.eyebrow{color:#e3bd68;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase}.hero h1{font-size:clamp(36px,6vw,62px);line-height:1.03;letter-spacing:-2px;margin:15px 0}.hero p,.muted{color:#aab5c6;line-height:1.7}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;padding:12px 0 56px}.card{border:1px solid #2b374a;background:linear-gradient(160deg,#101a2a,#0b1220);border-radius:16px;padding:23px;display:flex;flex-direction:column;min-height:310px}.card h2{font-size:18px;margin:0 0 10px}.price{font-size:34px;font-weight:850;letter-spacing:-1px;margin:8px 0}.price small{font-size:13px;color:#aab5c6;font-weight:500;letter-spacing:0}.detail{font-size:13px;line-height:1.6;color:#aab5c6;min-height:42px}.stats{border-top:1px solid #29364a;margin-top:17px;padding-top:15px;display:grid;gap:9px;font-size:13px}.stats span{color:#d5dce7}.stats b{color:#f2d48a}.foot{border-top:1px solid #253043;padding:24px 0 36px;color:#929fb2;font-size:12px;line-height:1.6}.notice{border:1px solid #4a3b1e;background:#17170f;border-radius:12px;padding:17px;color:#d8cfb5;line-height:1.6;font-size:13px;margin:0 0 48px}.actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:auto;padding-top:22px}.secondary{border:1px solid #3a4659;border-radius:9px;padding:12px 14px;text-decoration:none;font-size:13px;font-weight:700;color:#e3e8ef}@media(max-width:800px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.wrap{width:calc(100% - 28px)}.nav{align-items:flex-start;padding:14px 0;flex-direction:column}.links{width:100%;justify-content:space-between;gap:8px;font-size:12px}.grid{grid-template-columns:1fr}.hero{padding-top:45px}.card{min-height:0}}`;

export default function PackagesPage() {
  return (
    <main>
      <style>{styles}</style>
      <div className="wrap">
        <nav className="nav" aria-label="Main navigation">
          <a className="brand" href="/"><span className="mark">K</span><span><strong style={{display:"block",fontSize:13,letterSpacing:2.3}}>KINGSMEN</strong><small style={{display:"block",color:"#98a5b8",fontSize:10,marginTop:4}}>YOUR OPPORTUNITY, CONNECTED</small></span></a>
          <div className="links"><a href="/">Home</a><a href="/free-destiny-map/">Free Destiny Map</a><a href="#packages">Packages</a></div>
        </nav>
        <section className="hero">
          <div className="eyebrow">Clear pricing · South Africa · ZAR</div>
          <h1>One candidate profile.<br/><span style={{color:"#f2d48a"}}>More than one pathway.</span></h1>
          <p>All packages support the same six pathways: Higher Education, TVET, SETA programmes and learnerships, internships, apprenticeships, and employment. Packages change priority application volume and managed-route capacity—not which pathways you can explore.</p>
        </section>
        <section id="packages" className="grid" aria-label="Kingsmen packages">
          {packages.map((item) => (
            <article className="card" key={item.name}>
              <div className="eyebrow">Kingsmen package</div>
              <h2>{item.name}</h2>
              <div className="price">R{item.price}<small> / package</small></div>
              <p className="detail">{item.detail}</p>
              <div className="stats">
                <span><b>{item.applications}</b> priority applications</span>
                <span><b>{item.capacity}</b> managed-route / 30-day capacity</span>
                <span>{item.accommodation}</span>
              </div>
              <div className="actions"><a className="secondary" href="/free-destiny-map/">Explore your pathways ↗</a></div>
            </article>
          ))}
          <article className="card">
            <div className="eyebrow">Standalone service</div>
            <h2>CV Revamp</h2>
            <div className="price">R49.99<small> / service</small></div>
            <p className="detail">A focused CV and motivation-letter preparation service.</p>
            <div className="stats"><span><b>15</b> CV versions target</span><span><b>15</b> motivation letters target</span><span>Target turnaround: 3 business days</span><span>Managed-route capacity: 0 unless an eligible upgrade is verified</span></div>
            <div className="actions"><a className="secondary" href="/free-destiny-map/">Start with the Free Destiny Map ↗</a></div>
          </article>
          <article className="card">
            <div className="eyebrow">Free starting point</div>
            <h2>Free Destiny Map</h2>
            <div className="price">R0.00<small> / free</small></div>
            <p className="detail">Begin by identifying your goals, current stage and preferred routes.</p>
            <div className="stats"><span>Explore all six pathways</span><span>No payment required to begin</span><span>Opportunity outcomes are never guaranteed</span></div>
            <div className="actions"><a className="btn" href="/free-destiny-map/">Open the Free Destiny Map ↗</a></div>
          </article>
        </section>
        <aside className="notice"><strong>Payment and activation status:</strong> these prices reflect the Kingsmen catalogue. Paid checkout and package activation are not offered from this page until the PayFast settlement and entitlement path has been verified. Do not treat a payment intent or browser redirect as proof of settlement. No VAT treatment, refund promise or service guarantee is stated here.</aside>
        <footer className="foot">© Kingsmen Portal · South Africa. A directory entry does not prove that an opportunity is open or that you are eligible. Application, funding, admission and employment outcomes are determined by the relevant provider.</footer>
      </div>
    </main>
  );
}
