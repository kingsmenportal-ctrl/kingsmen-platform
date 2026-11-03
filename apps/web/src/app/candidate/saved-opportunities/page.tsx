import type { Metadata } from "next";
import CandidateSavedOpportunitiesClient from "@/components/candidate/CandidateSavedOpportunitiesClient";

export const metadata: Metadata = {
  title: "Saved opportunities",
  description: "Review your saved, verified opportunity records and official provider links."
};

export default function CandidateSavedOpportunitiesPage() {
  return <CandidateSavedOpportunitiesClient />;
}
