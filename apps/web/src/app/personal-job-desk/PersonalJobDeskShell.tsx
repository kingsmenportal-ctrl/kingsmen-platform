"use client";

import type { CSSProperties, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const navItems = [
  { label: "Dashboard", href: "/personal-job-desk", icon: "⌂" },
  { label: "Tracker", href: "/personal-job-desk/application-tracker", icon: "◷" },
  { label: "Apply", href: "/personal-job-desk/apply-now", icon: "✦" },
  { label: "Apply Pack", href: "/personal-job-desk/apply-pack", icon: "▤" },
  { label: "Apply Pack Builder", href: "/personal-job-desk/apply-pack-builder", icon: "•" },
  { label: "Daily Loop", href: "/personal-job-desk/daily-loop", icon: "↻" },
  { label: "Daily Worklist", href: "/personal-job-desk/daily-worklist", icon: "•" },
  { label: "Documents", href: "/personal-job-desk/document-pack-index", icon: "▣" },
  { label: "Follow Up", href: "/personal-job-desk/follow-up", icon: "✉" },
  { label: "Follow Up Inbox", href: "/personal-job-desk/follow-up-inbox", icon: "•" },
  { label: "Import Search", href: "/personal-job-desk/import-search", icon: "•" },
  { label: "Job Finder", href: "/personal-job-desk/job-finder", icon: "⌕" },
  { label: "Manual Submission Workbench", href: "/personal-job-desk/manual-submission-workbench", icon: "•" },
  { label: "Navigation", href: "/personal-job-desk/navigation", icon: "•" },
  { label: "Normalizer", href: "/personal-job-desk/normalizer", icon: "•" },
  { label: "Opportunities", href: "/personal-job-desk/opportunities", icon: "•" },
  { label: "Opportunity Quality Gate", href: "/personal-job-desk/opportunity-quality-gate", icon: "•" },
  { label: "Opportunity Queue", href: "/personal-job-desk/opportunity-queue", icon: "•" },
  { label: "Scout", href: "/personal-job-desk/opportunity-scout", icon: "◎" },
  { label: "Outcomes", href: "/personal-job-desk/outcomes", icon: "✓" },
  { label: "Proof Index", href: "/personal-job-desk/proof-index", icon: "•" },
  { label: "Proof Review Board", href: "/personal-job-desk/proof-review-board", icon: "•" },
  { label: "Public Snapshot", href: "/personal-job-desk/public-snapshot", icon: "•" },
  { label: "Readiness Queue", href: "/personal-job-desk/readiness-queue", icon: "•" },
  { label: "Real Use Gate", href: "/personal-job-desk/real-use-gate", icon: "•" },
  { label: "Response Library", href: "/personal-job-desk/response-library", icon: "•" },
  { label: "Review Ledger", href: "/personal-job-desk/review-ledger", icon: "•" },
  { label: "Runtime Click Test", href: "/personal-job-desk/runtime-click-test", icon: "•" },
  { label: "SA Sources", href: "/personal-job-desk/sa-sources", icon: "⚑" },
  { label: "Shortlist", href: "/personal-job-desk/shortlist", icon: "•" },
  { label: "Source Runner", href: "/personal-job-desk/source-runner", icon: "•" },
  { label: "Source Scout", href: "/personal-job-desk/source-scout", icon: "◇" },
  { label: "Status Advancement", href: "/personal-job-desk/status-advancement", icon: "•" },
  { label: "Status Timeline", href: "/personal-job-desk/status-timeline", icon: "•" },
  { label: "Submissions", href: "/personal-job-desk/submissions", icon: "•" }
];

export default function PersonalJobDeskShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const active = useMemo(() => {
    return navItems.find((item) => pathname === item.href) ||
      navItems.find((item) => item.href !== "/personal-job-desk" && pathname.startsWith(item.href)) ||
      navItems[0];
  }, [pathname]);

  return (
    <div style={app}>
      <aside style={side}>
        <a href="/personal-job-desk" style={brand}>
          <span style={mark}>K</span>
          <span>
            <strong>Kingsmen</strong>
            <small>Personal Workbench</small>
          </span>
        </a>

        <nav style={nav}>
          {navItems.map((item) => {
            const selected = pathname === item.href || (item.href !== "/personal-job-desk" && pathname.startsWith(item.href));
            return (
              <a key={item.href} href={item.href} style={selected ? navSelected : navItem}>
                <span style={navIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        <div style={sideCard}>
          <strong>Today</strong>
          <span>Prepare profile, scout real opportunities, build packs, and capture proof.</span>
        </div>
      </aside>

      <section style={body}>
        <header style={top}>
          <div style={topLeft}>
            <button onClick={() => router.back()} style={ghost}>â† Back</button>
            <a href="/personal-job-desk" style={ghostLink}>Home</a>
            <button onClick={() => location.reload()} style={ghost}>Refresh</button>
          </div>

          <div style={pageTitle}>
            <span style={pageIcon}>{active.icon}</span>
            <strong>{active.label}</strong>
          </div>

          <button onClick={() => setOpen(!open)} style={menu}>Menu</button>
        </header>

        {open ? (
          <section style={drawer}>
            {navItems.map((item) => (
              <a key={item.href} href={item.href} style={drawerLink}>
                <span style={navIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </a>
            ))}
          </section>
        ) : null}

        <main style={content}>{children}</main>
      </section>
    </div>
  );
}

const app: CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  gridTemplateColumns: "280px minmax(0,1fr)",
  background: "#070705",
  color: "#f6efe0",
  fontFamily: "Inter, Arial, sans-serif"
};

const side: CSSProperties = {
  position: "sticky",
  top: 0,
  height: "100vh",
  padding: 22,
  background: "linear-gradient(180deg,#0f0c07,#070705)",
  borderRight: "1px solid rgba(229,184,87,.18)",
  display: "grid",
  gridTemplateRows: "auto 1fr auto",
  gap: 24
};

const brand: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  color: "#f6efe0",
  textDecoration: "none"
};

const mark: CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 14,
  display: "grid",
  placeItems: "center",
  background: "linear-gradient(135deg,#f4c968,#8f6826)",
  color: "#111",
  fontWeight: 1000,
  fontSize: 23
};

const nav: CSSProperties = {
  display: "grid",
  alignContent: "start",
  gap: 8
};

const navItem: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "13px 14px",
  borderRadius: 16,
  color: "#cfc2a4",
  textDecoration: "none",
  border: "1px solid transparent"
};

const navSelected: CSSProperties = {
  ...navItem,
  color: "#ffe1a1",
  background: "rgba(229,184,87,.13)",
  border: "1px solid rgba(229,184,87,.28)"
};

const navIcon: CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 10,
  display: "grid",
  placeItems: "center",
  background: "rgba(229,184,87,.12)",
  color: "#f4c968"
};

const sideCard: CSSProperties = {
  display: "grid",
  gap: 8,
  padding: 16,
  borderRadius: 18,
  background: "rgba(255,255,255,.045)",
  border: "1px solid rgba(229,184,87,.15)",
  color: "#cfc2a4",
  lineHeight: 1.45
};

const body: CSSProperties = {
  minWidth: 0
};

const top: CSSProperties = {
  height: 68,
  display: "grid",
  gridTemplateColumns: "1fr auto auto",
  alignItems: "center",
  gap: 14,
  padding: "0 22px",
  background: "rgba(7,7,5,.92)",
  borderBottom: "1px solid rgba(229,184,87,.14)",
  position: "sticky",
  top: 0,
  zIndex: 10,
  backdropFilter: "blur(14px)"
};

const topLeft: CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap"
};

const ghost: CSSProperties = {
  border: "1px solid rgba(229,184,87,.22)",
  background: "rgba(255,255,255,.035)",
  color: "#f4c968",
  borderRadius: 999,
  padding: "9px 12px",
  fontWeight: 800,
  cursor: "pointer"
};

const ghostLink: CSSProperties = {
  ...ghost,
  textDecoration: "none"
};

const pageTitle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10
};

const pageIcon: CSSProperties = {
  ...navIcon,
  width: 32,
  height: 32
};

const menu: CSSProperties = {
  border: 0,
  background: "#e5b857",
  color: "#111",
  borderRadius: 999,
  padding: "10px 15px",
  fontWeight: 1000,
  cursor: "pointer"
};

const drawer: CSSProperties = {
  margin: 18,
  padding: 14,
  borderRadius: 18,
  background: "rgba(20,16,9,.96)",
  border: "1px solid rgba(229,184,87,.18)",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
  gap: 10
};

const drawerLink: CSSProperties = {
  ...navItem,
  background: "rgba(255,255,255,.045)",
  color: "#f6efe0"
};

const content: CSSProperties = {
  minWidth: 0
};