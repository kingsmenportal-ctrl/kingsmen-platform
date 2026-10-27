"use client";

import { useEffect, useState } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type StoredDocument = { id: string; original_filename: string; mime_type: string; size_bytes: number; status: string; sha256_hex?: string | null; uploaded_at?: string | null };

const requiredDocuments = [
  { title: "Government-issued ID", detail: "Smart ID card, ID book or passport", status: "Not uploaded", tone: "neutral" },
  { title: "Matric certificate / latest results", detail: "Academic record relevant to your application", status: "Not uploaded", tone: "neutral" },
  { title: "Proof of residence", detail: "Recent utility bill or bank statement, where required", status: "Not uploaded", tone: "neutral" },
  { title: "CV / Resume", detail: "For employment, internships and learnerships", status: "Optional", tone: "blue" },
];

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function CandidateDocumentsPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [message, setMessage] = useState("Sign in to load your private documents.");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const supabase: SupabaseClient | null = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true } })
    : null;

  async function api(token: string, payload: Record<string, unknown>) {
    if (!supabase || !supabaseUrl || !supabaseAnonKey) throw new Error("Private Document Vault is not configured in this deployment.");
    const response = await fetch(`${supabaseUrl}/functions/v1/candidate-private-documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: supabaseAnonKey, Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload), cache: "no-store",
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : `Document service returned HTTP ${response.status}.`);
    return body;
  }

  async function sessionToken() {
    if (!supabase) throw new Error("Private Document Vault is not configured in this deployment.");
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!data.session?.access_token) throw new Error("Sign in to your Kingsmen candidate account before managing private documents.");
    return data.session.access_token;
  }

  async function loadDocuments() {
    if (!supabase) { setMessage("Private Document Vault is not configured in this deployment."); return; }
    try {
      const token = await sessionToken();
      const result = await api(token, { action: "list" });
      setDocuments(Array.isArray(result.documents) ? result.documents : []);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load private documents.");
    }
  }

  useEffect(() => { void loadDocuments(); }, []);

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const next = Array.from(files);
    const accepted = next.filter((file) =>
      ["application/pdf", "image/jpeg", "image/png"].includes(file.type) &&
      file.size > 0 && file.size <= 10 * 1024 * 1024
    );
    setSelectedFiles(current => [...current, ...accepted]);
    if (accepted.length !== next.length) setMessage("Some files were excluded. Use non-empty PDF, JPEG or PNG files no larger than 10 MiB each.");
    else setMessage("Files selected locally. They are not uploaded or verified until you choose secure upload.");
  };

  async function uploadSelectedFiles() {
    if (!selectedFiles.length) { setMessage("Select at least one valid file first."); return; }
    setBusy(true);
    try {
      const token = await sessionToken();
      let completed = 0;
      for (const file of selectedFiles) {
        setMessage(`Requesting a private upload ticket for ${file.name}…`);
        const ticket = await api(token, {
          action: "create_upload", filename: file.name, mime_type: file.type,
          size_bytes: file.size, evidence_purpose: "CANDIDATE_DOCUMENT",
        });
        const document = ticket.document as { id?: string } | undefined;
        const bucket = typeof ticket.bucket === "string" ? ticket.bucket : "";
        const path = typeof ticket.path === "string" ? ticket.path : "";
        const uploadToken = typeof ticket.upload_token === "string" ? ticket.upload_token : "";
        if (!document?.id || !bucket || !path || !uploadToken || !supabase) {
          throw new Error("The private vault did not return a complete signed upload ticket.");
        }
        const { error: uploadError } = await supabase.storage.from(bucket).uploadToSignedUrl(path, uploadToken, file, {
          contentType: file.type, upsert: false,
        });
        if (uploadError) throw new Error(`Upload failed for ${file.name}: ${uploadError.message}`);
        await api(token, { action: "finalize_upload", document_id: document.id });
        completed++;
      }
      setSelectedFiles([]);
      await loadDocuments();
      setMessage(`${completed} file(s) uploaded and recorded. Upload is candidate-provided evidence; an authorized reviewer must verify it separately.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload did not complete. Retry after checking your connection.");
      await loadDocuments();
    } finally { setBusy(false); }
  }

  async function downloadDocument(documentId: string) {
    setBusy(true);
    try {
      const token = await sessionToken();
      const result = await api(token, { action: "create_download_url", document_id: documentId });
      if (typeof result.signed_download_url !== "string" || !result.signed_download_url) {
        throw new Error("The vault did not return a temporary download link.");
      }
      window.location.assign(result.signed_download_url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not open this private document.");
    } finally { setBusy(false); }
  }

  return (
    <main className="vault-page">
      <style jsx global>{`
        *{box-sizing:border-box} body{margin:0;background:#f4f6fa;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#13213a}
        .vault-page{min-height:100vh;padding-bottom:30px}.vault-header{background:#1753b6;color:#fff;box-shadow:0 4px 14px #0b255022}
        .vault-shell{width:min(1320px,calc(100% - 36px));margin:0 auto}.vault-nav{min-height:86px;display:flex;align-items:center;justify-content:space-between;gap:20px}
        .vault-brand{display:flex;align-items:center;gap:12px;color:#fff;text-decoration:none;font-size:22px;font-weight:850}.vault-crest{width:45px;height:50px;display:grid;place-items:center;background:#e7c76d;color:#10336f;clip-path:polygon(50% 0,94% 16%,86% 70%,50% 100%,14% 70%,6% 16%);font-size:23px}
        .vault-navlinks{display:flex;align-items:center;gap:24px;font-size:13px;font-weight:750}.vault-navlinks a{text-decoration:none;color:#eaf1ff;padding:9px 0}.vault-navlinks a.active{border-bottom:3px solid #e8cc70;color:#fff}.vault-user{display:flex;align-items:center;gap:8px;white-space:nowrap;font-size:13px}.vault-avatar{display:grid;place-items:center;border-radius:50%;width:40px;height:40px;background:#e8c96e;color:#173a79;font-weight:900}
        .vault-stepper{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin:24px 0 28px}.vault-step{border-radius:12px;background:#e6eaf0;padding:18px 17px;min-height:120px;border:1px solid #dce1e8}.vault-step.active{background:#edf4ff;border-color:#b7cdf3}.vault-step.done{background:#edf8f1;border-color:#c5e6d2}.vault-step strong{display:block;font-size:18px;margin-bottom:8px}.vault-step span{font-size:13px;color:#657185}.vault-step.active strong{color:#164a9c}.vault-step.done strong{color:#168052}.vault-bar{height:6px;border-radius:99px;background:#cbd2dc;margin-top:16px;overflow:hidden}.vault-bar i{height:100%;display:block;background:#1753b6;width:48%}.vault-step.done .vault-bar i{background:#15945d;width:100%}
        .vault-title{margin:0;font-size:clamp(27px,4vw,42px);letter-spacing:-.04em;color:#102b59}.vault-intro{margin:9px 0 23px;max-width:780px;color:#566176;line-height:1.6}.vault-layout{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);gap:22px;align-items:start}
        .vault-panel{background:#fff;border:1px solid #e0e5ed;border-radius:16px;padding:23px;box-shadow:0 6px 20px #142d5010}.vault-drop{border:2px dashed #91acd7;border-radius:16px;background:#f0f5ff;text-align:center;padding:34px 20px}.vault-cloud{font-size:45px;color:#1753b6}.vault-drop h2{margin:8px 0;font-size:23px;color:#123b7e}.vault-drop p{font-size:13px;color:#5d6b80;line-height:1.6}.vault-actions{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;margin:22px 0 14px}.vault-btn{border:0;border-radius:9px;background:#1753b6;color:white;padding:13px 18px;font-weight:800;font-size:13px;cursor:pointer}.vault-btn.alt{background:#e9edf4;color:#182945}.vault-security{border:1px solid #e0e7f1;border-radius:10px;padding:12px;text-align:left;color:#43536b;font-size:12px;line-height:1.5;background:#fff}.vault-docs{display:grid;gap:12px}.vault-doc{border:1px solid #e0e5ed;border-radius:13px;padding:16px;background:#fff}.vault-doc-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.vault-doc h3{margin:0 0 5px;font-size:16px;color:#172746}.vault-doc p{margin:0;color:#697588;font-size:12px;line-height:1.5}.vault-status{border-radius:999px;padding:6px 10px;font-size:11px;font-weight:850;white-space:nowrap;background:#edf0f4;color:#657185}.vault-status.blue{background:#e8f1ff;color:#1653a7}.vault-filelist{margin-top:12px;display:grid;gap:8px}.vault-file{display:flex;justify-content:space-between;gap:12px;align-items:center;background:#f5f7fa;border-radius:8px;padding:10px;font-size:12px}.vault-file small{color:#657185}.vault-summary{display:flex;align-items:center;justify-content:space-between;gap:16px;background:#123c83;color:#fff;padding:17px 22px;border-radius:12px;margin-top:22px}.vault-summary strong{font-size:14px}.vault-summary span{font-size:12px;color:#dce8ff}.vault-note{font-size:12px;color:#687589;line-height:1.6;margin-top:18px}
        @media(max-width:900px){.vault-navlinks{gap:10px}.vault-user{display:none}.vault-layout{grid-template-columns:1fr}.vault-stepper{gap:8px}.vault-step{padding:13px;min-height:110px}.vault-step strong{font-size:15px}}
        @media(max-width:600px){.vault-shell{width:calc(100% - 24px)}.vault-nav{min-height:70px}.vault-brand{font-size:17px}.vault-crest{width:35px;height:40px}.vault-navlinks{display:none}.vault-stepper{grid-template-columns:repeat(2,minmax(0,1fr));margin:18px 0}.vault-step{min-height:92px}.vault-step strong{font-size:14px}.vault-step span{font-size:11px}.vault-panel{padding:15px}.vault-drop{padding:24px 12px}.vault-summary{align-items:flex-start;flex-direction:column}.vault-doc-head{flex-direction:column}}
      `}</style>
      <header className="vault-header"><div className="vault-shell vault-nav">
        <a className="vault-brand" href="/"><span className="vault-crest" aria-hidden="true">K</span><span>Kingsmen Portal<br/><small style={{fontSize:12,fontWeight:500}}>Candidate Portal</small></span></a>
        <nav className="vault-navlinks" aria-label="Main navigation"><a href="/candidate/dashboard">⌂ Dashboard</a><a className="active" href="/candidate/documents">▤ Application</a><a href="/candidate/support">▱ Help</a></nav>
        <div className="vault-user"><span className="vault-avatar">K</span><span>Candidate workspace</span></div>
      </div></header>
      <div className="vault-shell">
        <section className="vault-stepper" aria-label="Application progress">
          <div className="vault-step done"><strong>✓ Step 1<br/>Personal Information</strong><span>Completed status requires saved profile evidence</span><div className="vault-bar"><i/></div></div>
          <div className="vault-step active"><strong>2 Step 2<br/>Document Verification</strong><span>Current workspace</span><div className="vault-bar"><i/></div></div>
          <div className="vault-step"><strong>3 Step 3<br/>Assessment</strong><span>Pending</span><div className="vault-bar"><i style={{width:"0%"}}/></div></div>
          <div className="vault-step"><strong>4 Step 4<br/>Final Review</strong><span>Pending</span><div className="vault-bar"><i style={{width:"0%"}}/></div></div>
        </section>
        <h1 className="vault-title">Document Upload &amp; Verification</h1>
        <p className="vault-intro">Keep the documents needed for your chosen pathway organised in one private vault. Verification states must come from Kingsmen review evidence—not from the browser.</p>
        <div className="vault-layout">
          <section className="vault-panel" aria-label="Select documents">
            <div className="vault-drop" style={{borderColor:dragging?"#1753b6":undefined,background:dragging?"#e2edff":undefined}} onDragOver={(event)=>{event.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)} onDrop={(event)=>{event.preventDefault();setDragging(false);addFiles(event.dataTransfer.files)}}>
              <div className="vault-cloud" aria-hidden="true">⇧</div><h2>Drag &amp; drop files here</h2><p>Or select files from this device. You can choose multiple files.</p>
              <div className="vault-actions">
                <label className="vault-btn" style={{display:"inline-flex",alignItems:"center",gap:8}}>▣ Browse files<input aria-label="Choose documents" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" style={{position:"absolute",width:1,height:1,overflow:"hidden",clipPath:"inset(50%)"}} onChange={(event)=>addFiles(event.target.files)}/></label>
                <button className="vault-btn alt" type="button" onClick={()=>setMessage("Camera capture is not connected in this build. Use Browse files on your device.")}>◎ Camera capture</button>
              </div>
              <div className="vault-security">♧ <strong>Private by design.</strong> Uploads use a signed private-storage ticket. The backend remains responsible for file validation, SHA-256 and reviewer decisions.</div>
            </div>
            {message && <p role="status" style={{fontSize:13,lineHeight:1.5,color:"#31435f",marginTop:14}}>{message}</p>}
            {selectedFiles.length > 0 && <div className="vault-filelist" aria-label="Selected files">{selectedFiles.map((file,index)=><div className="vault-file" key={file.name+index}><span>▤ {file.name}<br/><small>{file.type || "Unknown type"} · {formatSize(file.size)}</small></span><button className="vault-btn alt" type="button" disabled={busy} onClick={()=>setSelectedFiles((current)=>current.filter((_,i)=>i!==index))}>Remove</button></div>)}</div>}
            <button className="vault-btn" type="button" disabled={busy || selectedFiles.length===0} onClick={()=>void uploadSelectedFiles()}>{busy ? "Working…" : "Upload selected files securely"}</button>
            <p className="vault-note">Selection checks: PDF, JPEG or PNG; maximum 10 MiB per file. Server-side validation is authoritative.</p>
            {documents.length > 0 && <div className="vault-filelist" aria-label="Documents in your private vault">{documents.map(doc=><div className="vault-file" key={doc.id}><span>▤ {doc.original_filename}<br/><small>{doc.mime_type} · {formatSize(doc.size_bytes)} · {doc.status.replaceAll("_"," ")}</small>{doc.sha256_hex && <><br/><small>SHA-256: {doc.sha256_hex}</small></>}</span><button className="vault-btn alt" type="button" disabled={busy} onClick={()=>void downloadDocument(doc.id)}>View</button></div>)}</div>}
          </section>
          <section className="vault-panel" aria-label="Required document checklist">
            <h2 style={{margin:"0 0 6px",fontSize:21,color:"#12305f"}}>Document checklist</h2><p style={{margin:"0 0 17px",fontSize:13,color:"#657185",lineHeight:1.5}}>Statuses below are not connected to a live verification service.</p>
            <div className="vault-docs">{requiredDocuments.map((doc)=><article className="vault-doc" key={doc.title}><div className="vault-doc-head"><div><h3>{doc.title}</h3><p>{doc.detail}</p></div><span className={"vault-status"+(doc.tone==="blue"?" blue":"")}>{doc.status}</span></div><div className="vault-note">No file verified in this session</div></article>)}</div>
          </section>
        </div>
        <div className="vault-summary"><div><strong>Verification summary: not yet available</strong><br/><span>Upload and review must be completed by the connected private Document Vault before progression.</span></div><button className="vault-btn" type="button" onClick={()=>setMessage("Assessment remains locked until required documents are uploaded and their verification status is returned by Kingsmen's backend.")}>Continue to assessment →</button></div>
        <p role="status" aria-live="polite" className="vault-note">{message}</p><p className="vault-note">Security boundary: upload is candidate-reported evidence, not independent verification. The assessment stays locked until required documents receive authorized reviewer verification.</p>
      </div>
    </main>
  );
}
