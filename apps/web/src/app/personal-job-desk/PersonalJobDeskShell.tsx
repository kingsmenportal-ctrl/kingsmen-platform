"use client";

import type { CSSProperties, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type NavItem = {
  label: string;
  href: string;
  description: string;
  badge: string;
};

const navItems: NavItem[] = [
  {
    label: "Command Home",
    href: "/personal-job-desk",
    description: "Personal job platform overview",
    badge: "HOME"
  },
  {
    label: "Apply Now",
    href: "/personal-job-desk/apply-now",
    description: "Profile, CV, documents, packs and proof",
    badge: "APPLY"
  },
  {
    label: "Opportunity Scout",
    href: "/personal-job-desk/opportunity-scout",
    description: "Find and import real leads",
    badge: "SCOUT"
  },
  {
    label: "Document Pack",
    href: "/personal-job-desk/document-pack-index",
    description: "Document readiness and pack index",
    badge: "DOCS"
  }
];

export default function PersonalJobDeskShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const active = useMemo(() => {
    return navItems.find((item) => pathname === item.href) || navItems.find((item) => pathname.startsWith(item.href) && item.href !== "/personal-job-desk") || navItems[0];
  }, [pathname]);

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/personal-job-desk");
    }
  }

  function goForward() {
    if (typeof window !== "undefined") {
      window.history.forward();
    }
  }

  function refresh() {
    router.refresh();
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }

  return (
    <div style={shell}>
      <aside style={sidebar}>
        <div style={brandBlock}>
          <div style={crest}>K</div>
          <div>
            <p style={eyebrow}>KINGSMEN</p>
            <h1 style={brandTitle}>Personal Job Desk</h1>
          </div>
        </div>

        <nav style={navStack}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/personal-job-desk" && pathname.startsWith(item.href));

            return (
              <a key={item.href} href={item.href} style={isActive ? navActive : navLink}>
                <span style={navBadge}>{item.badge}</span>
                <span style={navText}>
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
              </a>
            );
          })}
        </nav>

        <div style={sideFooter}>
          <strong>Reality boundary</strong>
          <span>
            Kingsmen helps you find, prepare and track real applications. It must not invent jobs,
            fake details, bypass OTP/CAPTCHA, or pretend a portal was submitted when it was not.
          </span>
        </div>
      </aside>

      <section style={mainArea}>
        <header style={topbar}>
          <div style={topLeft}>
            <button onClick={goBack} style={iconButton} title="Back">← Back</button>
            <button onClick={goForward} style={iconButton} title="Forward">Forward →</button>
            <a href="/personal-job-desk" style={iconLink}>⌂ Home</a>
            <button onClick={refresh} style={iconButton}>Refresh</button>
          </div>

          <div style={currentPage}>
            <span style={currentBadge}>{active?.badge}</span>
            <div>
              <strong>{active?.label}</strong>
              <small>{active?.description}</small>
            </div>
          </div>

          <button onClick={() => setMenuOpen((value) => !value)} style={menuButton}>
            ☰ Menu
          </button>
        </header>

        {menuOpen ? (
          <section style={drawer}>
            <div style={drawerHeader}>
              <strong>Kingsmen Menu</strong>
              <button onClick={() => setMenuOpen(false)} style={closeButton}>Close</button>
            </div>

            <div style={drawerGrid}>
              {navItems.map((item) => (
                <a key={item.href} href={item.href} style={drawerCard}>
                  <span style={navBadge}>{item.badge}</span>
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </a>
              ))}
            </div>

            <div style={quickActionRow}>
              <a href="/personal-job-desk/apply-now" style={primaryAction}>Continue application</a>
              <a href="/personal-job-desk/opportunity-scout" style={secondaryAction}>Find opportunities</a>
              <a href="/personal-job-desk/document-pack-index" style={secondaryAction}>Check documents</a>
            </div>
          </section>
        ) : null}

        <section style={contentWrap}>
          {children}
        </section>

        <nav style={mobileNav}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/personal-job-desk" && pathname.startsWith(item.href));

            return (
              <a key={item.href} href={item.href} style={isActive ? mobileNavActive : mobileNavLink}>
                <span>{item.badge}</span>
                <small>{item.label}</small>
              </a>
            );
          })}
        </nav>
      </section>
    </div>
  );
}

const shell: CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  gridTemplateColumns: "320px minmax(0, 1fr)",
  background: "radial-gradient(circle at top left,rgba(215,173,73,.22),transparent 30%),linear-gradient(135deg,#020202,#100b05,#261807)",
  color: "#f8f0db",
  fontFamily: "Arial, sans-serif"
};

const sidebar: CSSProperties = {
  position: "sticky",
  top: 0,
  height: "100vh",
  borderRight: "1px solid rgba(255,215,122,.22)",
  background: "linear-gradient(180deg,rgba(0,0,0,.72),rgba(0,0,0,.38))",
  padding: 22,
  display: "grid",
  gridTemplateRows: "auto 1fr auto",
  gap: 22
};

const brandBlock: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14
};

const crest: CSSProperties = {
  width: 54,
  height: 54,
  borderRadius: 18,
  background: "linear-gradient(135deg,#ffd77a,#8a641b)",
  color: "#111",
  display: "grid",
  placeItems: "center",
  fontSize: 28,
  fontWeight: 1000,
  boxShadow: "0 20px 50px rgba(215,173,73,.24)"
};

const eyebrow: CSSProperties = {
  margin: 0,
  color: "#d7ad49",
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: ".18em"
};

const brandTitle: CSSProperties = {
  margin: "4px 0 0",
  fontSize: 18
};

const navStack: CSSProperties = {
  display: "grid",
  gap: 10,
  alignContent: "start"
};

const navLink: CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  padding: 14,
  borderRadius: 18,
  border: "1px solid rgba(255,215,122,.12)",
  background: "rgba(255,255,255,.04)",
  color: "#f8f0db",
  textDecoration: "none"
};

const navActive: CSSProperties = {
  ...navLink,
  border: "1px solid rgba(255,215,122,.45)",
  background: "linear-gradient(135deg,rgba(215,173,73,.26),rgba(0,0,0,.25))",
  boxShadow: "0 18px 45px rgba(0,0,0,.26)"
};

const navBadge: CSSProperties = {
  minWidth: 54,
  borderRadius: 999,
  padding: "7px 8px",
  background: "rgba(215,173,73,.16)",
  color: "#ffd77a",
  border: "1px solid rgba(255,215,122,.22)",
  fontSize: 11,
  fontWeight: 900,
  textAlign: "center"
};

const navText: CSSProperties = {
  display: "grid",
  gap: 3
};

const sideFooter: CSSProperties = {
  display: "grid",
  gap: 8,
  padding: 14,
  borderRadius: 18,
  border: "1px solid rgba(255,215,122,.16)",
  background: "rgba(0,0,0,.24)",
  color: "#d8caa8",
  lineHeight: 1.45,
  fontSize: 13
};

const mainArea: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gridTemplateRows: "auto auto 1fr auto"
};

const topbar: CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 20,
  display: "grid",
  gridTemplateColumns: "1fr auto auto",
  gap: 14,
  alignItems: "center",
  padding: "14px 18px",
  borderBottom: "1px solid rgba(255,215,122,.18)",
  background: "rgba(10,7,3,.88)",
  backdropFilter: "blur(14px)"
};

const topLeft: CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap"
};

const iconButton: CSSProperties = {
  border: "1px solid rgba(255,215,122,.24)",
  background: "rgba(0,0,0,.22)",
  color: "#ffd77a",
  borderRadius: 999,
  padding: "10px 12px",
  fontWeight: 900,
  cursor: "pointer"
};

const iconLink: CSSProperties = {
  ...iconButton,
  textDecoration: "none"
};

const currentPage: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  minWidth: 220
};

const currentBadge: CSSProperties = {
  ...navBadge,
  minWidth: 68
};

const menuButton: CSSProperties = {
  border: 0,
  background: "#d7ad49",
  color: "#111",
  borderRadius: 999,
  padding: "11px 16px",
  fontWeight: 1000,
  cursor: "pointer"
};

const drawer: CSSProperties = {
  margin: 18,
  padding: 18,
  border: "1px solid rgba(255,215,122,.24)",
  borderRadius: 24,
  background: "rgba(0,0,0,.46)",
  boxShadow: "0 28px 80px rgba(0,0,0,.36)"
};

const drawerHeader: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 14
};

const closeButton: CSSProperties = {
  ...iconButton,
  padding: "8px 12px"
};

const drawerGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: 12
};

const drawerCard: CSSProperties = {
  display: "grid",
  gap: 9,
  padding: 16,
  borderRadius: 18,
  border: "1px solid rgba(255,215,122,.18)",
  background: "rgba(255,255,255,.055)",
  color: "#f8f0db",
  textDecoration: "none"
};

const quickActionRow: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginTop: 16
};

const primaryAction: CSSProperties = {
  border: 0,
  borderRadius: 999,
  padding: "12px 16px",
  background: "#d7ad49",
  color: "#111",
  fontWeight: 1000,
  textDecoration: "none"
};

const secondaryAction: CSSProperties = {
  border: "1px solid rgba(255,215,122,.36)",
  borderRadius: 999,
  padding: "12px 16px",
  color: "#ffd77a",
  fontWeight: 900,
  textDecoration: "none",
  background: "rgba(0,0,0,.18)"
};

const contentWrap: CSSProperties = {
  minWidth: 0
};

const mobileNav: CSSProperties = {
  display: "none"
};

const mobileNavLink: CSSProperties = {
  color: "#d8caa8",
  textDecoration: "none",
  display: "grid",
  placeItems: "center",
  gap: 3,
  fontSize: 11
};

const mobileNavActive: CSSProperties = {
  ...mobileNavLink,
  color: "#ffd77a",
  fontWeight: 900
};