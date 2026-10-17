import ReviewerApplicationsClient from "./ReviewerApplicationsClient";
export default function ReviewerApplicationsPage(){
 return <main style={{maxWidth:1100,margin:"0 auto",padding:24}}>
  <h1>Application review operations</h1>
  <p>Authorised reviewer workspace for application readiness, evidence verification, controlled submission tasks and provider-status updates.</p>
  <p><strong>Truth boundary:</strong> a Kingsmen draft is not a submission. A manual-required task is not dispatched. A provider outcome must be supported by independently reviewed provider evidence.</p>
  <ReviewerApplicationsClient/>
 </main>;
}
