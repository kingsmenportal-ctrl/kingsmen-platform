import Link from "next/link";
import { FreeDestinyMapApiForm } from "@/components/kingsmen/FreeDestinyMapApiForm";

export default function FreeDestinyMapPage() {
  return (
    <main className="public-site destiny-map-page">
      <div className="public-notice"><span aria-hidden="true" /> FREE DESTINY MAP · INTAKE API BOUNDARY</div>
      <header className="public-header"><div className="public-container public-header-inner">
        <Link className="public-brand" href="/" aria-label="Kingsmen Portal home"><span className="public-crest" aria-hidden="true">K</span><span className="public-wordmark"><strong>KINGSMEN</strong><small>PORTAL</small></span></Link>
        <nav className="public-nav" aria-label="Main navigation"><Link href="/">Home</Link><Link href="/packages/">Packages</Link><Link href="/candidate/dashboard/">Candidate portal</Link></nav>
      </div></header>
      <div className="public-container destiny-map-layout">
        <section className="destiny-map-intro" data-kingsmen-free-destiny-map-identity="true">
          <div className="public-eyebrow"><span /> YOUR NEXT MOVE STARTS HERE</div>
          <h1>Build your <em>Destiny Map.</em></h1>
          <p>Describe your current stage, route interests and support needs. Kingsmen sends a minimum route-mapping request to its intake API boundary; it does not itself submit an official provider application.</p>
          <div className="destiny-map-benefits"><span>✓ Six core pathways</span><span>✓ South African context</span><span>✓ Clear next-step guidance</span></div>
          <div className="destiny-map-boundary"><strong>Privacy boundary</strong><p>Do not enter identity numbers, banking details, passwords or document contents. This public form uses an intake API boundary; production persistence, contact delivery and official applications are not confirmed.</p></div>
          <Link className="destiny-map-back-link" href="/">← Back to Kingsmen Portal</Link>
        </section>
        <FreeDestinyMapApiForm />

      </div>
      <footer className="public-footer public-container"><Link className="public-brand public-brand-footer" href="/"><span className="public-crest" aria-hidden="true">K</span><span className="public-wordmark"><strong>KINGSMEN</strong><small>PORTAL</small></span></Link><span>Free Destiny Map · API boundary only</span><span>Verify source, deadline and eligibility before applying.</span></footer>
    </main>
  );
}
