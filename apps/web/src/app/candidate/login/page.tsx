import { CandidateAuthForm } from "../../../components/candidate/CandidateAuthForm";

export const metadata = {
  title: "Sign in | Kingsmen Portal",
  description: "Sign in to your Kingsmen candidate account."
};

export default function CandidateLoginPage() {
  return <CandidateAuthForm mode="login" />;
}
