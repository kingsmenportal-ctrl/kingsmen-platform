import fs from "node:fs";
import path from "node:path";
import JobSearchImportClient from "./JobSearchImportClient";

export const dynamic = "force-dynamic";

export type PersonalJobs11SafeProfile = {
  fullName: string;
  targetRole: string;
  location: string;
  headline: string;
  priority: string;
};

function readSafeLocalProfile(): PersonalJobs11SafeProfile {
  const profilePath = path.join(process.cwd(), "data", "personal-job-desk", "personal-candidate.local.json");

  if (!fs.existsSync(profilePath)) {
    return {
      fullName: "Local candidate",
      targetRole: "Job seeker",
      location: "South Africa",
      headline: "Private local profile not loaded.",
      priority: "Paste job search results, URLs, or copied job posts. This desk converts them into structured local leads."
    };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(profilePath, "utf8"));

    return {
      fullName: parsed.fullName || parsed.name || "Local candidate",
      targetRole: parsed.targetRole || parsed.roleTarget || parsed.preferredRole || "Job seeker",
      location: parsed.location || parsed.city || parsed.province || "South Africa",
      headline: parsed.headline || parsed.summary || parsed.profileSummary || "Private local profile loaded.",
      priority: parsed.priority || parsed.jobSearchPriority || "Import real opportunities, keep the source visible, then rank and work them through Kingsmen."
    };
  } catch {
    return {
      fullName: "Local candidate",
      targetRole: "Job seeker",
      location: "South Africa",
      headline: "Private local profile exists but could not be parsed safely.",
      priority: "Repair the local profile JSON before relying on import guidance."
    };
  }
}

export default function PersonalJobsImportSearchPage() {
  const profile = readSafeLocalProfile();

  return (
    <main
      data-kingsmen-personal-jobs-11-route="true"
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 12% 8%, rgba(214,178,94,0.20), transparent 30%), radial-gradient(circle at 92% 78%, rgba(248,215,122,0.13), transparent 35%), linear-gradient(135deg, #050403 0%, #171008 48%, #030303 100%)",
        color: "#f8edd2",
        padding: "28px",
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
      }}
    >
      <section style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gap: "22px" }}>
        <header
          style={{
            border: "1px solid rgba(214,178,94,0.30)",
            borderRadius: "34px",
            padding: "30px",
            background: "rgba(255,255,255,0.045)",
            boxShadow: "0 28px 100px rgba(0,0,0,0.45)"
          }}
        >
          <p style={{ margin: 0, color: "#d6b25e", fontSize: "12px", letterSpacing: "0.24em", textTransform: "uppercase", fontWeight: 900 }}>
            PERSONAL-JOBS-11 · Local Job Search Import Desk
          </p>

          <h1 style={{ margin: "12px 0 8px", fontSize: "clamp(2.2rem, 5vw, 5.2rem)", lineHeight: 0.92, letterSpacing: "-0.08em" }}>
            Import Search Results Into the Campaign
          </h1>

          <p style={{ margin: 0, maxWidth: "990px", color: "rgba(248,237,210,0.78)", fontSize: "17px", lineHeight: 1.7 }}>
            Paste copied job posts, company career snippets, URLs, search results, WhatsApp leads, Facebook leads, LinkedIn text, or browser notes. Kingsmen converts them into structured local opportunity leads and can push them into PERSONAL-JOBS-02 without sending applications, contacting employers, scraping websites, touching payments, or claiming production readiness.
          </p>
        </header>

        <JobSearchImportClient initialProfile={profile} />
      </section>
    </main>
  );
}