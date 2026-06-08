import fs from "node:fs";
import path from "node:path";
import RealUseGateClient from "./RealUseGateClient";

export const dynamic = "force-dynamic";

type SafePersonalProfile = {
  fullName?: string;
  targetRole?: string;
  location?: string;
  headline?: string;
  priority?: string;
};

function readSafeLocalProfile(): SafePersonalProfile {
  const profilePath = path.join(process.cwd(), "data", "personal-job-desk", "personal-candidate.local.json");

  if (!fs.existsSync(profilePath)) {
    return {
      fullName: "Local candidate",
      targetRole: "Job seeker",
      location: "South Africa",
      headline: "Private local profile not loaded.",
      priority: "Open the Real Use Gate, follow each route, and keep proof before trusting the campaign."
    };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(profilePath, "utf8"));

    return {
      fullName: parsed.fullName || parsed.name || "Local candidate",
      targetRole: parsed.targetRole || parsed.roleTarget || parsed.preferredRole || "Job seeker",
      location: parsed.location || parsed.city || parsed.province || "South Africa",
      headline: parsed.headline || parsed.summary || parsed.profileSummary || "Private local job-search profile loaded.",
      priority: parsed.priority || parsed.jobSearchPriority || "Apply fast, safely, truthfully, and with proof."
    };
  } catch {
    return {
      fullName: "Local candidate",
      targetRole: "Job seeker",
      location: "South Africa",
      headline: "Private local profile exists but could not be parsed safely.",
      priority: "Repair local profile JSON before real use."
    };
  }
}

export default function PersonalJobsRealUseGatePage() {
  const profile = readSafeLocalProfile();

  return (
    <main
      data-kingsmen-personal-jobs-08-route="true"
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(214,178,94,0.18), transparent 34%), radial-gradient(circle at bottom right, rgba(248,215,122,0.08), transparent 34%), linear-gradient(135deg, #070604 0%, #171008 50%, #050505 100%)",
        color: "#f8edd2",
        padding: "28px",
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
      }}
    >
      <section style={{ maxWidth: "1240px", margin: "0 auto", display: "grid", gap: "22px" }}>
        <header
          style={{
            border: "1px solid rgba(214,178,94,0.28)",
            borderRadius: "32px",
            padding: "30px",
            background: "rgba(255,255,255,0.045)",
            boxShadow: "0 24px 90px rgba(0,0,0,0.42)"
          }}
        >
          <p style={{ margin: 0, color: "#d6b25e", fontSize: "12px", letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 900 }}>
            PERSONAL-JOBS-08 · Real Use Gate
          </p>

          <h1 style={{ margin: "12px 0 8px", fontSize: "clamp(2.1rem, 5vw, 5rem)", lineHeight: 0.94, letterSpacing: "-0.075em" }}>
            End-to-End Local Runtime Smoke Test
          </h1>

          <p style={{ margin: 0, maxWidth: "930px", color: "rgba(248,237,210,0.78)", fontSize: "17px", lineHeight: 1.7 }}>
            This is the local gate before using the personal job system for real applications. It gives one clean
            navigation desk for the full campaign chain, checks browser storage readiness, captures a local smoke
            result, and reminds the user that no application is sent unless the user manually submits and records proof.
          </p>
        </header>

        <RealUseGateClient initialProfile={profile} />
      </section>
    </main>
  );
}