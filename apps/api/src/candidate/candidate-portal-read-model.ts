import type { CandidatePortalSummary } from "./candidate-types";
import type { CandidateProfileReadiness } from "./candidate-profile-readiness";

export interface CandidatePortalSection {
  key: string;
  title: string;
  status: "OK" | "ACTION_REQUIRED" | "WAITING" | "BLOCKED";
  message: string;
}

/**
 * Build candidate-facing status cards from the server-evaluated readiness result.
 * Callers must construct readiness from authenticated, candidate-scoped records;
 * this view model is not an authorization boundary.
 */
export function buildCandidatePortalSections(
  summary: CandidatePortalSummary,
  readiness: CandidateProfileReadiness
): CandidatePortalSection[] {
  if (!summary.candidate.candidateId.trim()) throw new Error("CANDIDATE_ID_REQUIRED");
  if (readiness.candidateId !== summary.candidate.candidateId) {
    throw new Error("CANDIDATE_PORTAL_READINESS_OWNERSHIP_MISMATCH");
  }

  const identityBlocked = readiness.blockers.some((blocker) =>
    blocker.startsWith("IDENTITY_LINK_REJECTED") ||
    blocker.startsWith("IDENTITY_LINK_MISSING") ||
    blocker === "CANDIDATE_ACCOUNT_NOT_ACTIVE"
  );
  const readinessStatus = readiness.status === "BLOCKED" || identityBlocked
    ? "BLOCKED"
    : readiness.ready ? "OK" : "ACTION_REQUIRED";

  const profileMessage = readiness.missingFields.length > 0
    ? `Complete profile fields: ${readiness.missingFields.join(", ")}.`
    : readiness.blockers.some((blocker) => blocker.startsWith("IDENTITY_LINK_"))
      ? "Identity verification must be completed before protected candidate workflows can proceed."
      : readinessStatus === "BLOCKED"
        ? "Your account needs support before you can continue."
        : readiness.ready ? "Your profile and identity checks are ready." : "Review the actions needed to complete your profile.";

  const documentMessage = readiness.blockers.includes("DOCUMENT_REVIEW_REQUIRED")
    ? "One or more documents need review before your profile can be marked ready."
    : summary.documentReadiness === "READY" && readiness.ready
      ? "Your document set is ready for active routes."
      : readiness.nextActions.find((action) => action.toLowerCase().includes("document"))
        ?? "Upload or review missing documents.";

  // Application readiness is never shown as READY solely because a legacy summary says so.
  const applicationsReady = summary.applicationReadiness === "READY" && readiness.ready;
  const applicationStatus: CandidatePortalSection["status"] =
    readinessStatus === "BLOCKED" ? "BLOCKED" :
    summary.applicationReadiness === "MANUAL_REQUIRED" ? "WAITING" :
    applicationsReady ? "OK" : "ACTION_REQUIRED";

  const applicationMessage = readinessStatus === "BLOCKED"
    ? "Applications are blocked until the account and identity requirements are resolved."
    : !readiness.ready
      ? `Complete readiness actions before applications can proceed: ${readiness.nextActions.join(" ")}`.trim()
      : summary.applicationReadiness === "MANUAL_REQUIRED"
        ? "Manual Application Package fallback is required for one or more routes."
        : applicationsReady
          ? "Profile, identity, and document readiness checks are complete for application handoff."
          : "Applications are not ready yet.";

  return [
    {
      key: "profile",
      title: "Profile",
      status: readinessStatus,
      message: profileMessage
    },
    {
      key: "documents",
      title: "Documents",
      status: readinessStatus === "BLOCKED" ? "BLOCKED" : summary.documentReadiness === "READY" && readiness.ready ? "OK" : "ACTION_REQUIRED",
      message: documentMessage
    },
    {
      key: "applications",
      title: "Applications",
      status: applicationStatus,
      message: applicationMessage
    },
    {
      key: "messages",
      title: "Messages",
      status: summary.unreadMessages > 0 ? "ACTION_REQUIRED" : "OK",
      message: summary.unreadMessages > 0
        ? `${summary.unreadMessages} unread message(s).`
        : "No unread messages."
    },
    {
      key: "finance",
      title: "Finance",
      status: summary.outstandingAmountCents > 0 ? "ACTION_REQUIRED" : "OK",
      message: summary.outstandingAmountCents > 0
        ? "There is an outstanding payment item."
        : "No outstanding payment item."
    }
  ];
}
