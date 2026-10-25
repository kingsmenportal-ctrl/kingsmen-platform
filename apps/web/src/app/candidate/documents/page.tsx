"use client";

import { useEffect, useState } from "react";

type DocumentRecord = {
  id: string; preparation_item_id?: string | null; application_id?: string | null;
  original_filename: string; mime_type: string; size_bytes: number; status: string;
  uploaded_at?: string | null; created_at: string;
};
type ApplicationRecord = { id: string; application_ref: string; pathway_type: string; status: string; created_at: string };

function readToken(): string | null {
  try {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!base) return null;
    const ref = new URL(base).hostname.split(".")[0];
    const session = localStorage.getItem(`sb-${ref}-auth-token`);
    const parsed = session ? JSON.parse(session) : null;
    return typeof parsed?.access_token === "string" ? parsed.access_token : null;
  } catch { return null; }
}
const field = "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900";
const button = "rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white disabled:opacity-50";

export default function CandidateDocumentsPage() {
  const [token,setToken] = useState<string|null>(null);
  const [documents,setDocuments] = useState<DocumentRecord[]>([]);
  const [applications,setApplications] = useState<ApplicationRecord[]>([]);
  const [applicationId,setApplicationId] = useState("");
  const [file,setFile] = useState<File|null>(null);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [message,setMessage] = useState("");

  useEffect(()=>{setToken(readToken());},[]);
  async function load(currentToken:string) {
    const response = await fetch("/api/candidate/documents/status",{headers:{Authorization:`Bearer ${currentToken}`},cache:"no-store"});
    const body = await response.json();
    if(!response.ok || body.ready!==true) throw new Error(body.error || "Could not load your private documents.");
    setDocuments(Array.isArray(body.documents)?body.documents:[]);
    setApplications(Array.isArray(body.applications)?body.applications:[]);
  }
  useEffect(()=>{if(token) void load(token).catch(e=>setError(e instanceof Error?e.message:"Could not load documents."));},[token]);

  async function upload(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();setError("");setMessage("");
    if(!token){setError("Sign in to your Kingsmen candidate account first.");return;}
    if(!file){setError("Choose a PDF, JPEG or PNG document.");return;}
    setBusy(true);
    try {
      const ticketResponse=await fetch("/api/candidate/documents/upload-url",{
        method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},
        body:JSON.stringify({filename:file.name,mimeType:file.type,sizeBytes:file.size,...(applicationId?{applicationId}:{})})
      });
      const ticket=await ticketResponse.json();
      if(!ticketResponse.ok || !ticket.signed_upload_url || !ticket.document?.id) throw new Error(ticket.error || "A private upload ticket could not be issued.");
      const base=process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/,"");
      const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if(!base||!key) throw new Error("Private storage is not configured.");
      const uploadUrl=String(ticket.signed_upload_url).startsWith("http")?ticket.signed_upload_url:new URL(ticket.signed_upload_url,base).toString();
      const put=await fetch(uploadUrl,{method:"POST",headers:{apikey:key,"Content-Type":file.type},body:file});
      if(!put.ok) throw new Error("The private file upload failed. The pending record is not marked uploaded; retry or contact support.");
      const finalizeResponse=await fetch("/api/candidate/documents/finalize",{
        method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},
        body:JSON.stringify({documentId:ticket.document.id})
      });
      const finalized=await finalizeResponse.json();
      if(!finalizeResponse.ok || finalized.ready!==true) throw new Error(finalized.error || "The uploaded file could not be finalized.");
      setFile(null);
      const input=document.getElementById("candidate-private-file") as HTMLInputElement|null;if(input)input.value="";
      setMessage("Private upload recorded and file signature checked. Status remains candidate-reported until an authorised reviewer verifies it.");
      await load(token);
    } catch(e) {setError(e instanceof Error?e.message:"Upload failed.");}
    finally {setBusy(false);}
  }

  async function download(id:string) {
    if(!token)return;
    setError("");setMessage("");
    try {
      const response=await fetch("/api/candidate/documents/read-url",{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({documentId:id})});
      const body=await response.json();
      if(!response.ok||!body.signed_download_url)throw new Error(body.error||"Could not create a private download link.");
      window.location.assign(body.signed_download_url);
      setMessage("A short-lived private download link was issued and audited.");
    }catch(e){setError(e instanceof Error?e.message:"Download failed.");}
  }

  return <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6">
    <div className="mx-auto max-w-5xl space-y-5">
      <header className="rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
        <p className="text-xs font-black uppercase tracking-[.2em] text-amber-300">Kingsmen · N05 Document Vault</p>
        <h1 className="mt-3 text-3xl font-black">Your reusable private documents</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200">Upload a CV, certificate or supporting document once, then link it to a candidate application where supported. Files are private; upload finalization checks the real file signature and records an audit event. A successful upload is not a verification decision.</p>
      </header>
      {!token&&<section className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm">Sign in before loading or changing private documents. <a className="font-bold underline" href="/candidate/login?next=%2Fcandidate%2Fdocuments">Sign in</a></section>}
      {error&&<p role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">{error}</p>}
      {message&&<p role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">{message}</p>}
      <form onSubmit={upload} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 sm:p-7">
        <h2 className="text-xl font-black">Upload a document once</h2>
        <label className="block text-sm font-semibold">File (PDF, JPEG or PNG; maximum 10 MiB)<input id="candidate-private-file" className={field} type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={e=>setFile(e.target.files?.[0]||null)} required /></label>
        <label className="block text-sm font-semibold">Link to an existing application (optional)<select className={field} value={applicationId} onChange={e=>setApplicationId(e.target.value)}><option value="">Keep in my document vault for reuse</option>{applications.map(app=><option key={app.id} value={app.id}>{app.application_ref} · {app.pathway_type} · {app.status}</option>)}</select></label>
        <button className={button} disabled={!token||busy}>{busy?"Uploading and verifying file signature…":"Upload to private vault"}</button>
        <p className="text-xs leading-5 text-slate-500">Supported formats only. No public file URL is created. Uploads use a short-lived signed ticket; document status and application ownership are checked by the backend.</p>
      </form>
      <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-black">My documents</h2><button type="button" className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold" onClick={()=>token&&load(token).catch(e=>setError(e instanceof Error?e.message:"Reload failed."))}>Refresh</button></div>
        {!documents.length?<p className="mt-4 text-sm text-slate-600">No private documents are available in this verified candidate workspace yet.</p>:<div className="mt-4 space-y-3">{documents.map(doc=><article key={doc.id} className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center">
          <div className="min-w-0"><h3 className="break-words font-bold">{doc.original_filename}</h3><p className="mt-1 text-xs text-slate-600">{doc.mime_type} · {(doc.size_bytes/1024/1024).toFixed(2)} MiB · {doc.status.replaceAll("_"," ")}</p><p className="mt-1 text-xs text-slate-500">{doc.application_id?"Linked to an application":"Available for reuse"} · Added {new Date(doc.created_at).toLocaleDateString()}</p></div>
          <button type="button" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold" onClick={()=>void download(doc.id)}>Private download</button>
        </article>)}</div>}
      </section>
      <footer className="text-xs leading-5 text-slate-500">Identity link approval is required before private workspace data is returned. Reviewer decisions and provider submission/outcome states cannot be set from this page.</footer>
    </div>
  </main>;
}
