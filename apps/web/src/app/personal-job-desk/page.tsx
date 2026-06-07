import fs from "node:fs";
import path from "node:path";
import PersonalJobDeskClient, { type PersonalCandidateProfile } from "./PersonalJobDeskClient";

export const dynamic = "force-dynamic";

const fallbackProfile: PersonalCandidateProfile = {
  schema: "kingsmen.personal-candidate-profile.v1",
  privacy: "FALLBACK_PUBLIC_SAFE_PROFILE",
  candidate: {
    displayName: "Local Candidate",
    headline: "Personal Job Campaign Profile",
    location: "South Africa",
    contact: {
      phone: "Local-only profile not loaded",
      email: "Local-only profile not loaded",
      license: "Local-only profile not loaded",
      mobility: "Local-only profile not loaded"
    },
    targetRoles: [
      "Retail Operations",
      "Store Management",
      "Inventory Control",
      "Customer Service",
      "Operations Administration"
    ],
    sectors: [
      "Retail and wholesale",
      "Formal employment",
      "Hospitality and tourism",
      "Admin and office support"
    ],
    strengths: [
      "Operations discipline",
      "Customer service",
      "Team support",
      "Application readiness"
    ],
    experienceHighlights: [
      "Local private profile was not found. Create data/personal-job-desk/personal-candidate.local.json."
    ],
    education: [],
    proofPoints: [],
    cvCampaignRules: [],
    applicationRules: []
  }
};

function loadLocalProfile(): PersonalCandidateProfile {
  const profilePath = path.join(process.cwd(), "data", "personal-job-desk", "personal-candidate.local.json");

  try {
    const text = fs.readFileSync(profilePath, "utf8").replace(/^\uFEFF/, "");
    const parsed = JSON.parse(text) as PersonalCandidateProfile;

    if (!parsed?.candidate?.displayName || !Array.isArray(parsed?.candidate?.targetRoles)) {
      return fallbackProfile;
    }

    return parsed;
  } catch {
    return fallbackProfile;
  }
}

export default function PersonalJobDeskPage() {
  return <PersonalJobDeskClient profile={loadLocalProfile()} />;
}
