import fs from "node:fs";
import path from "node:path";
import FollowUpTrackerClient from "./FollowUpTrackerClient";

export const dynamic = "force-dynamic";

type SafePersonalProfile = {
  fullName?: string;
  targetRole?: string;
  location?: string;
  headline?: string;
  priority?: string;
  skills?: string[];
};

function readSafeLocalProfile(): SafePersonalProfile {
  const profilePath = path.join(process.cwd(), "data", "personal-job-desk", "personal-candidate.local.json");

  if (!fs.existsSync(profilePath)) {
    return {
      fullName: "Local candidate",
      targetRole: "Job seeker",
      location: "South Africa",
      headline: "Private local profile not loaded yet.",
      priority: "Fast job movement",
      skills: []
    };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(profilePath, "utf8"));

    return {
      fullName: parsed.fullName || parsed.name || "Local candidate",
      targetRole: parsed.targetRole || parsed.roleTarget || parsed.preferredRole || "Job seeker",
      location: parsed.location || parsed.city || parsed.province || "South Africa",
      headline: parsed.headline || parsed.summary || parsed.profileSummary || "Private local job-search profile loaded.",
      priority: parsed.priority || parsed.jobSearchPriority || "Find suitable work quickly",
      skills: Array.isArray(parsed.skills) ? parsed.skills.slice(0, 12) : []
    };
  } catch {
    return {
      fullName: "Local candidate",
      targetRole: "Job seeker",
      location: "South Africa",
      headline: "Private local profile exists but could not be parsed safely.",
      priority: "Repair local profile JSON",
      skills: []
    };
  }
}

export default function PersonalJobsFollowUpPage() {
  const profile = readSafeLocalProfile();

  return (
    <main
      data-kingsmen-personal-jobs-06-route="true"
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top left, rgba(214,178,94,0.16), transparent 34%), linear-gradient(135deg, #080705 0%, #14100a 46%, #050505 100%)",
        color: "#f8edd2",
        padding: "28px",
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
      }}
    >
      <section style={{ maxWidth: "1180px", margin: "0 auto", display: "grid", gap: "22px" }}>
        <header
          style={{
            border: "1px solid rgba(214,178,94,0.28)",
            borderRadius: "30px",
            padding: "28px",
            background: "rgba(255,255,255,0.045)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.38)"
          }}
        >
          <p style={{ margin: 0, color: "#d6b25e", fontSize: "12px", letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 900 }}>
            PERSONAL-JOBS-06 · Local follow-up command
          </p>

          <h1 style={{ margin: "12px 0 8px", fontSize: "clamp(2rem, 5vw, 4.8rem)", lineHeight: 0.94, letterSpacing: "-0.07em" }}>
            Follow-Up Calendar, Interview Prep & Response Tracker
          </h1>

          <p style={{ margin: 0, maxWidth: "850px", color: "rgba(248,237,210,0.78)", fontSize: "17px", lineHeight: 1.7 }}>
            This desk turns your manual application evidence into next actions: follow-up dates,
            recruiter response states, interview preparation notes, proof references, and outcome movement.
            It stays local. It does not send messages or submit applications.
          </p>
        </header>

        <FollowUpTrackerClient initialProfile={profile} />
      </section>
    </main>
  );
}