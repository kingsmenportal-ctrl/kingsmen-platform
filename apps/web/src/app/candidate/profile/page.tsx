import type { Metadata } from "next";
import CandidateMasterProfileForm from "@/components/candidate/CandidateMasterProfileForm";

export const metadata: Metadata = {
  title: "Candidate profile",
  description: "Manage your reusable Kingsmen candidate profile and pathway preferences."
};

export default function CandidateProfilePage() {
  return <CandidateMasterProfileForm />;
}
