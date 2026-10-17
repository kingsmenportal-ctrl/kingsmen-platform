import Link from "next/link";
import ProfileClient from "./ProfileClient";

export default function CandidateProfilePage() {
  return <main style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 18px 48px" }}>
    <p><Link href="/candidate/dashboard">← Candidate dashboard</Link></p>
    <h1>Candidate profile</h1>
    <p>Review evidence-backed profile fields and request corrections. Requests do not silently overwrite the current record.</p>
    <ProfileClient />
  </main>;
}
