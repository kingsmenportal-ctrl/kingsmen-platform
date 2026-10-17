import CandidateOpportunitiesClient from "../../../components/candidate-opportunities-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Saved opportunities | Kingsmen" };

export default function SavedOpportunitiesPage() {
  return <CandidateOpportunitiesClient savedOnly />;
}
