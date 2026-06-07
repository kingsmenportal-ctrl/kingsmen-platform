import fs from "fs";
import path from "path";
import ApplyPackBuilderClient from "./ApplyPackBuilderClient";

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

export default function PersonalJobApplyPackPage() {
  const candidate = readLocalProfile();

  return (
    <main
      data-kingsmen-personal-jobs-04-apply-pack="true"
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(214,178,94,0.17), transparent 32%), radial-gradient(circle at bottom right, rgba(248,215,122,0.08), transparent 30%), linear-gradient(135deg, #070604 0%, #161008 46%, #030303 100%)",
        color: "#f8ecd0",
        padding: "32px",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      }}
    >
      <ApplyPackBuilderClient candidate={candidate} />
    </main>
  );
}