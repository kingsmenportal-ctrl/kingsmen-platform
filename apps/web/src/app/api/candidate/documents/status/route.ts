import { proxyPrivateDocumentRequest } from "../../../../../lib/private-document-proxy";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  return proxyPrivateDocumentRequest(request);
}
