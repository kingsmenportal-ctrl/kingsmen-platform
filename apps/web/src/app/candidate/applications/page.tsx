import type { Metadata } from "next";
import CandidateApplicationTracker from "@/components/candidate/CandidateApplicationTracker";

export const metadata: Metadata = {
  title: "My applications | Kingsmen Portal",
  description: "View your Kingsmen parent applications and resume editable application drafts."
};

export default function CandidateApplicationsPage() {
  return <CandidateApplicationTracker />;
}
