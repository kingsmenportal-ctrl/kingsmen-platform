"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavigationLink = { href: string; label: string };
const publicLinks: NavigationLink[] = [
  { href: "/#pathways", label: "Pathways" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/pricing", label: "Packages" },
  { href: "/free-destiny-map", label: "Free Destiny Map" },
  { href: "/candidate/login", label: "Candidate sign in" }
];
const candidateLinks: NavigationLink[] = [
  { href: "/candidate/dashboard", label: "Overview" },
  { href: "/candidate/profile", label: "Profile" },
  { href: "/candidate/opportunity-matches", label: "Opportunities" },
  { href: "/candidate/workbench", label: "Workbench" },
  { href: "/candidate/applications", label: "Applications" },
  { href: "/candidate/documents", label: "Documents" },
  { href: "/pricing", label: "Packages" }
];
const reviewerLinks: NavigationLink[] = [
  { href: "/reviewer/identity-reviews", label: "Identity-review queue" }
];
const founderLinks: NavigationLink[] = [
  { href: "/founder/control-plane", label: "Control plane" },
  { href: "/founder-command", label: "Founder command" },
  { href: "/founder/proof-centre", label: "Proof centre" },
  { href: "/founder/providers", label: "Providers" },
  { href: "/founder/build-proof", label: "Build proof" }
];
function isCurrent(pathname: string, href: string) {
  if (href.includes("#")) return false;
  return pathname === href || pathname.startsWith(href + "/");
}
export default function ProductHeader() {
  const pathname = usePathname() || "/";
  const isCandidate = pathname.startsWith("/candidate");
  const isReviewer = pathname.startsWith("/reviewer");
  const isFounder = pathname.startsWith("/founder") || pathname === "/founder-command" ||
    pathname === "/control-plane" || pathname === "/command" || pathname.startsWith("/admin");
  const links = isCandidate ? candidateLinks : isReviewer ? reviewerLinks : isFounder ? founderLinks : publicLinks;
  const audience = isCandidate ? "Candidate workspace" : isReviewer ? "Restricted reviewer workspace" : isFounder ? "Founder workspace" : "South Africa · Education · Skills · Work";
  const navLabel = isCandidate ? "Candidate workspace navigation" : isReviewer ? "Restricted reviewer navigation" : isFounder ? "Founder workspace navigation" : "Public website navigation";
  return (
    <header className="km-site-header">
      <div className="km-site-header__inner">
        <Link className="km-site-brand" href="/" aria-label="Kingsmen home">
          <span className="km-site-brand__mark" aria-hidden="true">K</span>
          <span className="km-site-brand__copy"><strong>KINGSMEN</strong><small>{audience}</small></span>
        </Link>
        <nav className="km-site-nav" aria-label={navLabel}>
          {links.map(link => <Link key={link.href} className="km-site-nav__link" href={link.href} aria-current={isCurrent(pathname, link.href) ? "page" : undefined}>{link.label}</Link>)}
        </nav>
        <details className="km-site-menu">
          <summary aria-label="Open site navigation">Menu</summary>
          <nav className="km-site-menu__panel" aria-label={navLabel + " mobile"}>
            {links.map(link => <Link key={link.href} className="km-site-nav__link" href={link.href} aria-current={isCurrent(pathname, link.href) ? "page" : undefined}>{link.label}</Link>)}
          </nav>
        </details>
      </div>
    </header>
  );
}
