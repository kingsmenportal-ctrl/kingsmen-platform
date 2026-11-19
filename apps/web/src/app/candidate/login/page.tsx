import { redirect } from "next/navigation";

export default function CandidateLoginRedirect() {
  redirect("/auth/login");
}
