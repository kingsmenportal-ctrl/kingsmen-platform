import { requireCandidateSession, supabaseAdminFetch } from "../../../../../lib/candidate-document-runtime";

export async function GET(request: Request) {
  const auth = await requireCandidateSession(request);
  if (!auth.ok) {
    return Response.json({ ok: false, code: auth.code, error: auth.message }, { status: auth.status });
  }

  const candidateFilter = `eq.${auth.session.candidateId}`;
  const documentsUrl = new URL(`${auth.config.url}/rest/v1/document_files`);
  documentsUrl.searchParams.set("select", "id,document_type,display_name,original_filename,mime_type,file_size_bytes,document_status,verification_status,extraction_status,uploaded_at,updated_at");
  documentsUrl.searchParams.set("candidate_id", candidateFilter);
  documentsUrl.searchParams.set("archived_at", "is.null");
  documentsUrl.searchParams.set("order", "uploaded_at.desc");
  documentsUrl.searchParams.set("limit", "100");

  const requestsUrl = new URL(`${auth.config.url}/rest/v1/document_requests`);
  requestsUrl.searchParams.set("select", "id,document_type,reason,priority,request_status,due_at,created_at,fulfilled_at");
  requestsUrl.searchParams.set("candidate_id", candidateFilter);
  requestsUrl.searchParams.set("request_status", "in.(OPEN,FULFILLED)");
  requestsUrl.searchParams.set("order", "created_at.desc");
  requestsUrl.searchParams.set("limit", "100");

  let documentsResponse: Response;
  let requestsResponse: Response;
  try {
    [documentsResponse, requestsResponse] = await Promise.all([
      supabaseAdminFetch(auth.config, `/rest/v1/document_files?${documentsUrl.searchParams.toString()}`),
      supabaseAdminFetch(auth.config, `/rest/v1/document_requests?${requestsUrl.searchParams.toString()}`)
    ]);
  } catch {
    return Response.json({ ok: false, code: "DOCUMENT_STORE_UNAVAILABLE", error: "Document records could not be loaded. Try again later." }, { status: 503 });
  }

  if (!documentsResponse.ok || !requestsResponse.ok) {
    return Response.json({ ok: false, code: "DOCUMENT_QUERY_FAILED", error: "Document records could not be loaded. Check the configured schema and database permissions." }, { status: 502 });
  }

  const documents = await documentsResponse.json().catch(() => null);
  const requests = await requestsResponse.json().catch(() => null);
  if (!Array.isArray(documents) || !Array.isArray(requests)) {
    return Response.json({ ok: false, code: "DOCUMENT_RESPONSE_INVALID", error: "The document store returned an invalid response." }, { status: 502 });
  }

  return Response.json({
    ok: true,
    productionReady: true,
    candidateId: auth.session.candidateId,
    documents,
    requests,
    counts: {
      documents: documents.length,
      pendingVerification: documents.filter((item: { verification_status?: string }) => item.verification_status === "PENDING" || item.verification_status === "REVIEW_REQUIRED").length,
      openRequests: requests.filter((item: { request_status?: string }) => item.request_status === "OPEN").length
    },
    authority: {
      candidateCanVerify: false,
      candidateCanReject: false,
      candidateCanMarkOutcome: false,
      rawPublicUrlAllowed: false,
      serviceRoleVisibleToBrowser: false
    }
  }, { headers: { "cache-control": "no-store" } });
}
