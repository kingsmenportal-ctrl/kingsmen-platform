import { proxyPrivateDocumentRequest } from "../../../../../lib/private-document-proxy";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  return proxyPrivateDocumentRequest(request, { action: "list_review_queue" });
}
export async function POST(request: Request) {
  return proxyPrivateDocumentRequest(request, { action: "review_document" });
}
