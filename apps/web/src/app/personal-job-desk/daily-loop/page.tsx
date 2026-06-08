import fs from "node:fs";
import path from "node:path";
import DailyLoopClient from "./DailyLoopClient";

export const dynamic = "force-dynamic";

export type PersonalJobs10SafeProfile = {
  fullName: string;
  targetRole: string;
  location: string;
  headline: string;
  priority: string;
};

function readSafeLocalProfile(): PersonalJobs10SafeProfile {
  const profilePath = path.join(process.cwd(), "data", "personal-job-desk", "personal-candidate.local.json");

  if (!fs.existsSync(profilePath)) {
    return {
      fullName: "Local candidate",
      targetRole: "Job seeker",
      location: "South Africa",
      headline: "Private local profile not loaded.",
      priority: "Load the local private profile before relying on campaign guidance."
    };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(profilePath, "utf8"));

    return {
      fullName: parsed.fullName || parsed.name || "Local candidate",
      targetRole: parsed.targetRole || parsed.roleTarget || parsed.preferredRole || "Job seeker",
      location: parsed.location || parsed.city || parsed.province || "South Africa",
      headline: parsed.headline || parsed.summary || parsed.profileSummary || "Private local profile loaded.",
      priority: parsed.priority || parsed.jobSearchPriority || "Move daily: find leads, rank them, prepare truthful packs, submit manually, capture proof, follow up, and record outcomes."
    };
  } catch {
    return {
      fullName: "Local candidate",
      targetRole: "Job seeker",
      location: "South Africa",
      headline: "Private local profile exists but could not be parsed safely.",
      priority: "Repair the local profile JSON before relying on the daily loop."
    };
  }
}

export default function PersonalJobsDailyLoopPage() {
  const profile = readSafeLocalProfile();

  return (
    <main
      data-kingsmen-personal-jobs-10-route="true"
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 14% 8%, rgba(214,178,94,0.20), transparent 30%), radial-gradient(circle at 90% 80%, rgba(248,215,122,0.12), transparent 35%), linear-gradient(135deg, #050403 0%, #171008 48%, #030303 100%)",
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
            PERSONAL-JOBS-10 · Daily Operating Loop
          </p>

          <h1 style={{ margin: "12px 0 8px", fontSize: "clamp(2.2rem, 5vw, 5.2rem)", lineHeight: 0.92, letterSpacing: "-0.08em" }}>
            Today&apos;s Job Campaign Command Desk
          </h1>

          <p style={{ margin: 0, maxWidth: "980px", color: "rgba(248,237,210,0.78)", fontSize: "17px", lineHeight: 1.7 }}>
            This desk reads the local job lead, shortlist, apply-pack, submission, follow-up, outcome, and real-use-gate records already saved in this browser. It turns them into a daily operating sequence without sending applications, contacting employers, touching payments, syncing calendars, starting Docker, or claiming production readiness.
          </p>
        </header>

        <DailyLoopClient initialProfile={profile} />
      </section>
    </main>
  );
}