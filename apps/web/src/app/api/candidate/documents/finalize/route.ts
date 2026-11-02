import { proxyCandidateDocumentVault } from "../../../../../lib/candidate-document-vault-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return proxyCandidateDocumentVault(request, "finalize-upload", "POST");
}
