import type { Metadata } from "next";
import CandidateIdentityReviewPortal from "@/components/candidate/CandidateIdentityReviewPortal";

export const metadata: Metadata = {
  title: "Identity review | Kingsmen Portal",
  description: "Request human review of an existing Kingsmen candidate identity and submit supporting evidence privately."
};

export default function CandidateIdentityReviewPage() {
  return <CandidateIdentityReviewPortal />;
}
