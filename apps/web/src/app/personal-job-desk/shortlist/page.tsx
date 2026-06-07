import fs from "fs";
import path from "path";
import ShortlistDecisionClient from "./ShortlistDecisionClient";

export const dynamic = "force-dynamic";

function readLocalProfile() {
  const profilePath = path.join(process.cwd(), "data", "personal-job-desk", "personal-candidate.local.json");

  try {
    if (!fs.existsSync(profilePath)) return null;
    return JSON.parse(fs.readFileSync(profilePath, "utf8"));
  } catch {
    return null;
  }
}

export default function PersonalJobShortlistPage() {
  const candidate = readLocalProfile();

  return (
    <main
      data-kingsmen-personal-jobs-03-shortlist="true"
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(214,178,94,0.16), transparent 34%), linear-gradient(135deg, #090806 0%, #16110b 44%, #050505 100%)",
        color: "#f8ecd0",
        padding: "32px",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      }}
    >
      <ShortlistDecisionClient candidate={candidate} />
    </main>
  );
}
