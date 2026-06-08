import fs from "node:fs";
import path from "node:path";
import SourceRunnerClient from "./SourceRunnerClient";

export const dynamic = "force-dynamic";

export type PersonalJobs12SafeProfile = {
  fullName: string;
  targetRole: string;
  location: string;
  headline: string;
  priority: string;
};

function readSafeLocalProfile(): PersonalJobs12SafeProfile {
  const profilePath = path.join(process.cwd(), "data", "personal-job-desk", "personal-candidate.local.json");

  if (!fs.existsSync(profilePath)) {
    return {
      fullName: "Local candidate",
      targetRole: "Job seeker",
      location: "South Africa",
      headline: "Private local profile not loaded.",
      priority: "Use the source runner to open trusted job sources, then capture only verified opportunities."
    };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(profilePath, "utf8"));

    return {
      fullName: parsed.fullName || parsed.name || "Local candidate",
      targetRole: parsed.targetRole || parsed.roleTarget || parsed.preferredRole || "Job seeker",
      location: parsed.location || parsed.city || parsed.province || "South Africa",
      headline: parsed.headline || parsed.summary || parsed.profileSummary || "Private local profile loaded.",
      priority: parsed.priority || parsed.jobSearchPriority || "Find real sources, verify before capture, and push strong leads into the campaign."
    };
  } catch {
    return {
      fullName: "Local candidate",
      targetRole: "Job seeker",
      location: "South Africa",
      headline: "Private local profile exists but could not be parsed safely.",
      priority: "Repair the local profile JSON before relying on source-runner guidance."
    };
  }
}

export default function PersonalJobsSourceRunnerPage() {
  const profile = readSafeLocalProfile();

  return (
    <main
      data-kingsmen-personal-jobs-12-route="true"
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 12% 8%, rgba(214,178,94,0.22), transparent 30%), radial-gradient(circle at 92% 78%, rgba(248,215,122,0.12), transparent 35%), linear-gradient(135deg, #050403 0%, #171008 48%, #030303 100%)",
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
            PERSONAL-JOBS-12 · Real Source Runner
          </p>

          <h1 style={{ margin: "12px 0 8px", fontSize: "clamp(2.2rem, 5vw, 5.2rem)", lineHeight: 0.92, letterSpacing: "-0.08em" }}>
            Verified Lead Finder
          </h1>

          <p style={{ margin: 0, maxWidth: "1000px", color: "rgba(248,237,210,0.78)", fontSize: "17px", lineHeight: 1.7 }}>
            Build search missions against real job-source pages, open them under your control, capture verified opportunities,
            and push clean leads into PERSONAL-JOBS-02. This desk does not apply, contact employers, process payments,
            use secrets, run bots, or claim production readiness.
          </p>
        </header>

        <SourceRunnerClient initialProfile={profile} />
      </section>
    </main>
  );
}