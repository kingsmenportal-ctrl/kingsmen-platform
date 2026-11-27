import { proxyPrivateDocumentRequest } from "../../../../../lib/private-document-proxy";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  return proxyPrivateDocumentRequest(request, { action: "create_upload" });
}
