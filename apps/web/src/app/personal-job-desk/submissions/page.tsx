import fs from "fs";
import path from "path";
import SubmissionTrackerClient from "./SubmissionTrackerClient";

export const dynamic = "force-dynamic";

const PERSONAL_JOBS_05_ROUTE_MARKER =
  "PERSONAL_JOBS_05_ROUTE_MARKER:/personal-job-desk/submissions";

const LOCAL_PRIVATE_PROFILE_PATH = "data/personal-job-desk/personal-candidate.local.json";

type SafeLocalCandidate = {
  candidateLabel: string;
  location: string;
  routeMode: string;
};

function readSafeLocalCandidate(): SafeLocalCandidate {
  const root = process.cwd();
  const profilePath = path.join(root, LOCAL_PRIVATE_PROFILE_PATH);

  if (!fs.existsSync(profilePath)) {
    return {
      candidateLabel: "Private local candidate",
      location: "Local-only profile not found yet",
      routeMode: "manual-private"
    };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(profilePath, "utf8"));

    return {
      candidateLabel:
        parsed.fullName ||
        parsed.name ||
        parsed.candidateName ||
        "Private local candidate",
      location:
        parsed.location ||
        parsed.city ||
        parsed.province ||
        "South Africa",
      routeMode: "manual-private"
    };
  } catch {
    return {
      candidateLabel: "Private local candidate",
      location: "South Africa",
      routeMode: "manual-private"
    };
  }
}

export default function PersonalJobSubmissionsPage() {
  const candidate = readSafeLocalCandidate();

  return (
    <main
      data-kingsmen-route="/personal-job-desk/submissions"
      data-kingsmen-module="PERSONAL-JOBS-05"
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(214,178,94,0.18), transparent 34%), linear-gradient(135deg, #080704 0%, #15110a 48%, #050505 100%)",
        color: "#f7ead1",
        padding: "32px",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      }}
    >
      <section
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
          display: "grid",
          gap: "22px"
        }}
      >
        <div
          style={{
            border: "1px solid rgba(214,178,94,0.28)",
            borderRadius: "28px",
            padding: "28px",
            background: "rgba(18,15,9,0.82)",
            boxShadow: "0 24px 90px rgba(0,0,0,0.32)"
          }}
        >
          <p
            style={{
              margin: "0 0 10px",
              color: "#d6b25e",
              fontWeight: 900,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              fontSize: "12px"
            }}
          >
            PERSONAL-JOBS-05 · Manual Application Evidence
          </p>

          <h1
            style={{
              margin: 0,
              fontSize: "clamp(34px, 6vw, 68px)",
              lineHeight: 0.94,
              letterSpacing: "-0.055em"
            }}
          >
            Submission tracker and proof ledger.
          </h1>

          <p
            style={{
              margin: "18px 0 0",
              maxWidth: "860px",
              color: "rgba(247,234,209,0.78)",
              fontSize: "17px",
              lineHeight: 1.7
            }}
          >
            This desk records where you manually applied, what proof exists, when to follow up,
            and what still needs action. It does not send applications, emails, WhatsApps,
            payments, portal submissions, or employer contact.
          </p>
        </div>

        <SubmissionTrackerClient candidate={candidate} />
      </section>

      <span hidden>{PERSONAL_JOBS_05_ROUTE_MARKER}</span>
    </main>
  );
}
