import type { CandidatePortalSummary } from "./candidate-types";

export interface CandidatePortalSection {
  key: string;
  title: string;
  status: "OK" | "ACTION_REQUIRED" | "WAITING" | "BLOCKED";
  message: string;
}

export function buildCandidatePortalSections(summary: CandidatePortalSummary): CandidatePortalSection[] {
  const sections: CandidatePortalSection[] = [];

  sections.push({
    key: "profile",
    title: "Profile",
    status: summary.profileConfidence === "HIGH" ? "OK" : "ACTION_REQUIRED",
    message: summary.profileConfidence === "HIGH"
      ? "Your profile is confirmed."
      : "Review or complete your profile fields."
  });

  sections.push({
    key: "documents",
    title: "Documents",
    status: summary.documentReadiness === "READY" ? "OK" : "ACTION_REQUIRED",
    message: summary.documentReadiness === "READY"
      ? "Your document set is ready for active routes."
      : "Upload or review missing documents."
  });

  sections.push({
    key: "applications",
    title: "Applications",
    status: summary.applicationReadiness === "MANUAL_REQUIRED" ? "WAITING" : summary.applicationReadiness === "READY" ? "OK" : "ACTION_REQUIRED",
    message: summary.applicationReadiness === "MANUAL_REQUIRED"
      ? "Manual Application Package fallback is required for one or more routes."
      : summary.applicationReadiness === "READY"
        ? "Applications are ready for execution."
        : "Applications are not ready yet."
  });

  sections.push({
    key: "messages",
    title: "Messages",
    status: summary.unreadMessages > 0 ? "ACTION_REQUIRED" : "OK",
    message: summary.unreadMessages > 0
      ? `${summary.unreadMessages} unread message(s).`
      : "No unread messages."
  });

  sections.push({
    key: "finance",
    title: "Finance",
    status: summary.outstandingAmountCents > 0 ? "ACTION_REQUIRED" : "OK",
    message: summary.outstandingAmountCents > 0
      ? "There is an outstanding payment item."
      : "No outstanding payment item."
  });

  return sections;
}