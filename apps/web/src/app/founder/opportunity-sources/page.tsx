import type { Metadata } from "next";
import N15SourceReviewConsole from "@/components/founder/N15SourceReviewConsole";

export const metadata: Metadata = {
  title: "Opportunity source review | Kingsmen Founder Control Plane",
  description: "Human review of N15 official-source observations and evidence."
};

export default function FounderOpportunitySourcesPage() {
  return <N15SourceReviewConsole />;
}
