import { redirect } from "next/navigation";

/**
 * Canonical entry point for the candidate's application journey.
 *
 * Keep the tracker as the single implementation of authenticated application
 * loading so the /candidate/applications and legacy /candidate/tracker URLs
 * cannot drift into separate data or authorization paths.
 */
export default function CandidateApplicationsPage(): never {
  redirect("/candidate/tracker");
}
