import Link from "next/link";
import ApplicationsClient from "./ApplicationsClient";
export default function ApplicationsPage(){return <main style={{maxWidth:1100,margin:"0 auto",padding:"24px 18px 48px"}}><p><Link href="/candidate/dashboard">← Candidate dashboard</Link></p><h1>Applications & pathway execution</h1><p>Track all six pathways, readiness blockers, and manual action packages. A draft is not a provider submission.</p><ApplicationsClient/></main>}
