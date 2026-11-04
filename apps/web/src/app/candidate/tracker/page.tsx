import type { Metadata } from "next";
import CandidateApplicationTracker from "@/components/candidate/CandidateApplicationTracker";

export const metadata: Metadata = {
  title: "Application tracker | Kingsmen Portal",
  description: "View your Kingsmen parent applications, saved-route preparation and recorded status evidence."
};

export default function CandidateApplicationTrackerPage() {
  return <CandidateApplicationTracker />;
}
