import { n05Candidate, n05ErrorResponse, n05Rest } from "../../../../../lib/n05-server";

export async function GET(request: Request) {
  try {
    const actor = await n05Candidate(request);
    const query = new URLSearchParams({
      select: "document_ref,document_type,display_name,document_status,verification_status,extraction_status,uploaded_at,application_id,file_size_bytes",
      candidate_id: "eq." + actor.candidateId,
      order: "uploaded_at.desc",
      limit: "100"
    });
    const documents = await n05Rest("document_files?" + query);
    return Response.json({
      ok: true,
      productionReady: false,
      documents: Array.isArray(documents) ? documents : [],
      candidateCanVerify: false,
      candidateCanReject: false,
      candidateCanDelete: false,
      rawPublicUrlAllowed: false
    }, { headers: { "Cache-Control": "no-store", "Pragma": "no-cache" } });
  } catch (error) {
    return n05ErrorResponse(error);
  }
}
