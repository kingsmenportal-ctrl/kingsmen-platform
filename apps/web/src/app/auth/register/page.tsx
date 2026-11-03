import { CandidateAuthForm } from "../../../components/candidate/CandidateAuthForm";

export const metadata = {
  title: "Create account | Kingsmen Portal",
  description: "Create a Kingsmen candidate account."
};

export default function CandidateRegisterPage() {
  return <CandidateAuthForm mode="register" />;
}
