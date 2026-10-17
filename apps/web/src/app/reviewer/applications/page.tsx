export default function ReviewerApplicationsPage(){
 return <main style={{maxWidth:1100,margin:"0 auto",padding:24}}>
  <h1>Application review operations</h1>
  <p>Authorised reviewer workspace for application readiness, evidence verification, submission workflow preparation and provider-status updates.</p>
  <p><strong>Important:</strong> a Kingsmen draft is not a submission. A submission task marked manual-required is not dispatched. A provider outcome must be supported by reviewed provider evidence.</p>
  <section style={{border:"1px solid #888",borderRadius:12,padding:16,marginTop:16}}>
   <h2>Reviewer API operations</h2>
   <ul>
    <li><code>GET /api/reviewer/applications</code> — authorised review queue.</li>
    <li><code>GET /api/reviewer/applications/evidence?applicationId=…</code> — evidence records.</li>
    <li><code>POST /api/reviewer/applications/evidence</code> — register evidence with source, locator and SHA-256; then use action <code>VERIFY</code> or <code>REJECT</code> with an independent review note.</li>
    <li><code>POST /api/reviewer/applications/authorize-submission</code> — create a controlled manual-required submission task after readiness and checklist verification.</li>
    <li><code>POST /api/reviewer/applications/provider-status</code> — record a provider status only against matching verified evidence.</li>
   </ul>
   <p>Access is denied unless the signed-in Supabase user has an active row in <code>platform_reviewers</code> with the required role. Reviewer grants must be provisioned through an approved operator process; there is no self-enrolment path.</p>
  </section>
  <p>Runtime readiness remains pending until migration 0061 is applied, reviewer roles are provisioned, server secrets are configured, and integration tests pass.</p>
 </main>;
}
