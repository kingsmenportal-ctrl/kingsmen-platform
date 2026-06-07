import fs from "node:fs";
import path from "node:path";
import OpportunityIntakeClient from "./OpportunityIntakeClient";

export const dynamic = "force-dynamic";

type LocalProfile = {
  campaign?: {
    targetRoles?: string[];
    targetLocations?: string[];
    urgency?: string;
  };
};

function readLocalProfile(): LocalProfile {
  const profilePath = path.join(process.cwd(), "data", "personal-job-desk", "personal-candidate.local.json");

  try {
    if (!fs.existsSync(profilePath)) return {};
    return JSON.parse(fs.readFileSync(profilePath, "utf8")) as LocalProfile;
  } catch {
    return {};
  }
}

export default function PersonalJobOpportunitiesPage() {
  const profile = readLocalProfile();

  return (
    <main
      data-kingsmen-personal-jobs-02="true"
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(214,178,94,0.16), transparent 34%), linear-gradient(135deg, #070707 0%, #111111 55%, #1a1305 100%)",
        color: "#f7efe0",
        padding: "28px",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      }}
    >
      <section
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
          display: "grid",
          gap: "18px"
        }}
      >
        <div
          style={{
            border: "1px solid rgba(214,178,94,0.34)",
            borderRadius: "28px",
            padding: "24px",
            background: "rgba(12,12,12,0.86)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.34)"
          }}
        >
          <p
            style={{
              margin: 0,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#d6b25e",
              fontWeight: 900,
              fontSize: "12px"
            }}
          >
            Kingsmen Private Job Campaign
          </p>

          <h1
            style={{
              margin: "10px 0 8px",
              fontSize: "clamp(34px, 5vw, 64px)",
              lineHeight: 0.95,
              letterSpacing: "-0.055em"
            }}
          >
            External Job Lead Intake
          </h1>

          <p
            style={{
              margin: 0,
              maxWidth: "820px",
              color: "rgba(247,239,224,0.78)",
              fontSize: "17px",
              lineHeight: 1.65
            }}
          >
            Capture every job you hear about, see online, receive by referral, or discover on a company page.
            Kingsmen keeps the lead organised locally, maps it to a CV and motivation-letter slot, and tracks
            the movement from found lead to proof-backed application.
          </p>
        </div>

        <OpportunityIntakeClient
          targetRoles={profile.campaign?.targetRoles ?? []}
          targetLocations={profile.campaign?.targetLocations ?? []}
          urgency={profile.campaign?.urgency ?? "Find suitable work fast while protecting privacy and proof discipline."}
        />
      </section>
    </main>
  );
}
