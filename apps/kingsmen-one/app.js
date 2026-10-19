(() => {
  "use strict";
  const KEY = "kingsmen-one-demo-v1";
  const pathways = [
    {id:"higher-education",name:"Higher education",icon:"⌂",desc:"Universities, colleges and recognised post-school study routes."},
    {id:"tvet",name:"TVET",icon:"⚒",desc:"Technical and vocational education and occupational training."},
    {id:"seta",name:"SETA & skills",icon:"✳",desc:"Learnerships, skills programmes and sector training routes."},
    {id:"employment",name:"Employment",icon:"↗",desc:"Prepare for work and track suitable job opportunities."},
    {id:"entrepreneurship",name:"Entrepreneurship",icon:"◇",desc:"Explore business support, enterprise development and funding routes."},
    {id:"unconfirmed-sixth",name:"Sixth pathway — name to confirm",icon:"?",desc:"Not displayed as a real pathway until the canonical name is verified from the Kingsmen source of truth.",unconfirmed:true}
  ];
  const opportunities = [
    {id:"opp-1",provider:"DEMO LISTING · VERIFY SOURCE",title:"Study opportunity preparation",type:"Education",location:"South Africa · details to verify",deadline:"Confirm official deadline",desc:"Use this sample to practise saving an opportunity and preparing your application. Not a verified live listing."},
    {id:"opp-2",provider:"DEMO LISTING · VERIFY SOURCE",title:"Skills programme readiness",type:"Skills",location:"South Africa · details to verify",deadline:"Confirm official deadline",desc:"A sample skills-route record for testing document readiness and follow-up tasks. Not a provider offer."},
    {id:"opp-3",provider:"DEMO LISTING · VERIFY SOURCE",title:"Entry-level job preparation",type:"Employment",location:"South Africa · details to verify",deadline:"Confirm official deadline",desc:"A sample employment listing used to demonstrate the workflow. Employer and vacancy must be independently verified."}
  ];
  const initial = () => ({profile:{fullName:"",province:"",qualification:"",interests:[]},tasks:[{id:"profile",title:"Review your candidate profile",detail:"Keep contact and education details up to date.",done:false},{id:"id",title:"Prepare identity document",detail:"A reviewer must verify identity through the authorised process.",done:false},{id:"results",title:"Gather academic results",detail:"Prepare readable copies; upload is not enabled in this demo.",done:false},{id:"route",title:"Choose a pathway to explore",detail:"Review eligibility and official source requirements.",done:false}],saved:[],applicationNotes:{},documents:{},noticeVisible:true});
  let state;
  try { state = JSON.parse(localStorage.getItem(KEY)) || initial(); } catch { state = initial(); }
  const root = document.getElementById("view-root");
  const crumb = document.getElementById("current-crumb");
  let activeView = "home";
  const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };
  const toast = text => { const el=document.getElementById("toast"); el.textContent=text; el.classList.add("show"); clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove("show"),2300); };
  const heading = (title,sub,action="") => `<div class="section-head"><div><h2>${title}</h2><p>${sub}</p></div>${action}</div>`;
  const button = (text,attrs="",secondary=true) => { const match=attrs.match(/\sclass="([^"]+)"/); const classes=match?match[1]:(secondary?"secondary-button":"primary-button"); const clean=attrs.replace(/\sclass="[^"]+"/,""); return `<button class="${classes}" ${clean}>${text}</button>`; };
  const taskList = (limit=10) => state.tasks.slice(0,limit).map(t=>`<div class="task-row"><button class="task-check ${t.done?"done":""}" data-task="${t.id}" aria-label="${t.done?"Mark incomplete":"Mark complete"}: ${escapeHtml(t.title)}">${t.done?"✓":""}</button><div class="task-info"><strong>${escapeHtml(t.title)}</strong><small>${escapeHtml(t.detail)}</small></div><span class="tag ${t.done?"done":"pending"}">${t.done?"Complete":"To do"}</span></div>`).join("");
  const progress = () => Math.round(state.tasks.filter(t=>t.done).length / state.tasks.length * 100);
  const supabaseClient = window.kingsmenSupabase || null;
  let authSession = null;
  let authMessage = "";
  let authBusy = false;
  let workspacePersistenceAvailable = false;
  let workspaceLoadedForUser = null;
  let officialProfile = null;
  let profileChangeRequests = [];
  let profileReviewAvailable = false;
  let profileLoadedForUser = null;
  async function loadOfficialProfile(force = false) {
    const userId=authSession?.user?.id;
    if(!supabaseClient||!userId){profileReviewAvailable=false;officialProfile=null;profileChangeRequests=[];profileLoadedForUser=null;return false;}
    if(!force&&profileLoadedForUser===userId)return profileReviewAvailable;
    try {
      const {data,error}=await supabaseClient.functions.invoke('candidate-profile-review',{body:{action:'load'}});
      if(error||data?.ready!==true)throw error||new Error('Official profile access unavailable.');
      officialProfile=data.profile||null;profileChangeRequests=Array.isArray(data.change_requests)?data.change_requests:[];profileReviewAvailable=true;profileLoadedForUser=userId;
      if(officialProfile){state.profile={...(state.profile||{}),province:officialProfile.province||'',qualification:officialProfile.highest_grade||''};save();}
      if(activeView==='profile')render('profile');return true;
    } catch {profileReviewAvailable=false;profileLoadedForUser=userId;return false;}
  }
  async function loadPersistentReadiness(force = false) {
    const userId = authSession?.user?.id;
    if (!supabaseClient || !userId) {
      workspacePersistenceAvailable = false;
      workspaceLoadedForUser = null;
      return false;
    }
    if (!force && workspaceLoadedForUser === userId) return workspacePersistenceAvailable;
    try {
      const { data, error } = await supabaseClient.functions.invoke("candidate-workspace-readiness", { body: { action: "load" } });
      if (error) throw error;
      if (data?.ready !== true) throw new Error("Verified candidate workspace is unavailable.");
      const completed = new Set(Array.isArray(data.completed_tasks) ? data.completed_tasks : []);
      state.tasks.forEach(task => { task.done = completed.has(task.id); });
      state.priorityPathway = typeof data.priority_pathway === "string" ? data.priority_pathway : "";
      workspacePersistenceAvailable = true;
      workspaceLoadedForUser = userId;
      save();
      if (activeView !== "account") render(activeView);
      return true;
    } catch {
      workspacePersistenceAvailable = false;
      workspaceLoadedForUser = userId;
      return false;
    }
  }
  async function persistReadiness() {
    if (!workspacePersistenceAvailable || !authSession?.user) return false;
    const payload = {
      action: "save",
      completed_tasks: state.tasks.filter(task => task.done).map(task => task.id),
      priority_pathway: state.priorityPathway || ""
    };
    try {
      const { data, error } = await supabaseClient.functions.invoke("candidate-workspace-readiness", { body: payload });
      if (error || data?.ready !== true) throw error || new Error("Workspace save was not confirmed.");
      return true;
    } catch {
      toast("Server sync failed; your progress remains in this browser.");
      return false;
    }
  }
  async function refreshAuthSession() {
    if (!supabaseClient) return;
    try {
      const { data, error } = await supabaseClient.auth.getSession();
      if (error) throw error;
      authSession = data.session;
      await loadPersistentReadiness(true);
      if (activeView === "account") render("account");
      updateAuthStatus();
    } catch (error) { authMessage = error.message || "Unable to read account session."; }
  }
  function updateAuthStatus() {
    const user = authSession?.user;
    const side = document.querySelector(".sidebar-bottom");
    if (side) side.innerHTML = `<span class="avatar">${user?"✓":"KM"}</span><div><strong>${user?escapeHtml(user.email||"Signed in"):"Preview candidate"}</strong><small>${user?"Account authenticated · candidate link pending":"Local preview profile"}</small></div><span class="online-dot" title="${user?"Authenticated account":"Preview mode"}"></span>`;
    const notice=document.querySelector(".notice p");
    if (notice && user) notice.innerHTML="<strong>Account authenticated.</strong> Your account is not yet linked to an authorised Kingsmen candidate record. Candidate records and documents remain unavailable until identity review is completed.";
  }
  function accountView() {
    const user=authSession?.user;
    if (!supabaseClient) return `${heading("Account access","Authentication could not initialise. Check network access and the Supabase client configuration.")}<div class="panel"><p>Account actions are unavailable until the Supabase client loads.</p></div>`;
    if (user) return `${heading("Your account","Your Supabase Auth session is active. This does not establish candidate identity.")}<div class="panel"><span class="tag done">Authenticated</span><h3 style="margin-top:14px">${escapeHtml(user.email||"Signed-in user")}</h3><p class="panel-subtitle">Account ID: ${escapeHtml(user.id)}</p><div class="notice"><span>ⓘ</span><p>Your account is not yet linked to an authorised Kingsmen candidate record. No existing candidate data is loaded or changed. Do not enter sensitive information in the local preview.</p></div><button class="primary-button" id="sign-out-button" type="button" ${authBusy?"disabled":""}>Sign out</button><h3 style="margin-top:24px">Request candidate identity review</h3><p class="panel-subtitle">Enter the candidate reference from your Kingsmen records. A reviewer must verify the match; this request does not grant access.</p><form id="identity-review-form"><label class="form-label" for="identity-candidate-reference">Existing candidate reference</label><input class="filter-input form-control" id="identity-candidate-reference" name="candidate_reference" required minlength="2" maxlength="120" autocomplete="off" placeholder="Your Kingsmen candidate reference"><label class="form-label" for="identity-claimant-name">Your full name</label><input class="filter-input form-control" id="identity-claimant-name" name="claimant_name" required minlength="2" maxlength="160" autocomplete="name" placeholder="Name for the reviewer"><label class="form-label" for="identity-claimant-message">Message for the reviewer (optional)</label><textarea class="filter-input form-control" id="identity-claimant-message" name="claimant_message" maxlength="1200" rows="3" placeholder="Add context without sending identity document numbers"></textarea><button class="primary-button" type="submit">Submit for manual review</button><p id="identity-review-message" class="muted-note" role="status" aria-live="polite"></p></form><p class="muted-note">Email matching alone will never link your account. Do not enter ID numbers or upload documents through this form.</p></div>`;
    return `${heading("Sign in or create an account","Use a real account session. Signing in does not automatically claim an existing candidate record.")}<div class="content-grid"><form class="panel" id="auth-form"><h3>Account access</h3><p class="panel-subtitle">Use an email you control. A confirmation email may be required.</p><label class="form-label" for="auth-email">Email address</label><input class="filter-input form-control" type="email" id="auth-email" name="email" autocomplete="email" required maxlength="254" placeholder="you@example.com"><label class="form-label" for="auth-password">Password</label><input class="filter-input form-control" type="password" id="auth-password" name="password" autocomplete="current-password" required minlength="8" maxlength="128" placeholder="At least 8 characters"><div class="auth-actions"><button class="primary-button" type="submit" name="auth-action" value="signin" ${authBusy?"disabled":""}>Sign in</button><button class="secondary-button" type="submit" name="auth-action" value="signup" ${authBusy?"disabled":""}>Create account</button></div><button class="text-button" type="button" id="reset-password-button">Send password reset email</button><p id="auth-message" class="muted-note" role="status" aria-live="polite">${escapeHtml(authMessage||"")}</p></form><div class="panel"><h3>Identity protection</h3><div class="task-list"><div class="task-row"><span class="task-check done">✓</span><div class="task-info"><strong>Secure account session</strong><small>Handled by Supabase Auth.</small></div></div><div class="task-row"><span class="task-check done">✓</span><div class="task-info"><strong>No automatic candidate matching</strong><small>An email match alone cannot establish identity.</small></div></div><div class="task-row"><span class="task-check">!</span><div class="task-info"><strong>Authorised identity review still required</strong><small>Candidate records stay locked until the link is verified.</small></div></div></div><p class="muted-note">Do not upload identity documents to this preview. The private document flow is not yet connected to this interface.</p></div></div>`;
  }
  function home() {
    return `${heading("Your overview","A practical view of what is ready and what needs attention.",button("View my tasks",'data-view="applications"'))}
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-top">Preparation progress <span class="stat-icon">✓</span></div><div class="stat-value">${progress()}%</div><div class="stat-foot">Based on your demo checklist</div><div class="progress-track"><div class="progress-fill" style="width:${progress()}%"></div></div></div>
        <div class="stat-card"><div class="stat-top">Saved opportunities <span class="stat-icon">☆</span></div><div class="stat-value">${state.saved.length}</div><div class="stat-foot">Saved in this browser only</div></div>
        <div class="stat-card"><div class="stat-top">Applications tracked <span class="stat-icon">▤</span></div><div class="stat-value">${Object.keys(state.applicationNotes).length}</div><div class="stat-foot">No provider submission is implied</div></div>
        <div class="stat-card"><div class="stat-top">Documents prepared <span class="stat-icon">▧</span></div><div class="stat-value">${Object.values(state.documents).filter(v=>v==="prepared").length}</div><div class="stat-foot">No files are uploaded or stored</div></div>
      </div>
      <div class="content-grid"><div class="panel"><h3>Your next steps</h3><p class="panel-subtitle">Small, trackable actions to help you prepare.</p><div class="task-list">${taskList(4)}</div><div style="margin-top:16px">${button("Continue preparation","data-view=\"applications\"",false)}</div></div>
      <div class="panel"><h3>Where you are heading</h3><p class="panel-subtitle">Explore routes that fit your next chapter.</p><div class="task-list">${pathways.slice(0,3).map(p=>`<div class="task-row"><span class="task-check" aria-hidden="true">${p.icon}</span><div class="task-info"><strong>${p.name}</strong><small>${p.unconfirmed?"Canonical name not yet confirmed":"Explore route requirements and preparation."}</small></div></div>`).join("")}</div><div class="next-step"><strong>One next step at a time.</strong><p>Choose a pathway, review requirements and prepare your documents before applying.</p>${button("Explore pathways","data-view=\"pathways\"",false)}</div></div></div>`;
  }
  function profileView() {
    const p=state.profile||{fullName:"",province:"",qualification:"",interests:[]};
    const interests=p.interests||[];
    const fields=[["higher-education","Higher education"],["tvet","TVET"],["seta","SETA & skills"],["employment","Employment"],["entrepreneurship","Entrepreneurship"]];
    const completed=[p.fullName,p.province,p.qualification,interests.length>0].filter(Boolean).length;
    return `${heading("My profile",profileReviewAvailable?"Official candidate profile is read-only; request authorised corrections.":"Until your identity link is verified, profile details stay in this browser.")}<div class="content-grid"><form class="panel" id="profile-form"><h3>Candidate details</h3><p class="panel-subtitle">${profileReviewAvailable?"Official profile access verified. Corrections remain pending until a reviewer decides them.":"Preview mode: this is not an official identity profile."}</p><label class="form-label" for="profile-name">Preferred name</label><input class="filter-input form-control" id="profile-name" name="fullName" maxlength="80" autocomplete="name" value="${escapeHtml(p.fullName)}" placeholder="How should we address you?"><label class="form-label" for="profile-province">Province</label><select class="filter-select form-control" id="profile-province" name="province"><option value="">Choose province</option>${["Eastern Cape","Free State","Gauteng","KwaZulu-Natal","Limpopo","Mpumalanga","Northern Cape","North West","Western Cape"].map(v=>`<option ${p.province===v?"selected":""}>${v}</option>`).join("")}</select><label class="form-label" for="profile-qualification">Highest qualification / current study</label><select class="filter-select form-control" id="profile-qualification" name="qualification"><option value="">Choose an option</option>${["Still at school","Matric / Grade 12","Certificate","Diploma","Degree","Postgraduate","TVET / occupational qualification","Other / not sure"].map(v=>`<option ${p.qualification===v?"selected":""}>${v}</option>`).join("")}</select><fieldset class="interest-fieldset"><legend>What would you like help with?</legend>${fields.map(([id,label])=>`<label class="interest-option"><input type="checkbox" name="interest" value="${id}" ${interests.includes(id)?"checked":""}> <span>${label}</span></label>`).join("")}</fieldset><label class="form-label" for="profile-change-reason">Reason for correction</label><textarea class="filter-input form-control" id="profile-change-reason" name="changeReason" maxlength="800" rows="3" placeholder="Explain why the official field needs correction"></textarea><button class="primary-button" type="submit">${profileReviewAvailable?"Submit correction requests":"Save demo profile"}</button><p id="profile-review-message" class="muted-note" role="status" aria-live="polite">${profileReviewAvailable?"Official province and qualification changes require review. Preferred name and interests remain local preferences.":"Saving records your own input only. It does not verify identity, eligibility or qualifications."}</p></form><div class="panel"><h3>Profile readiness</h3><p class="panel-subtitle">A quick guide to what you have filled in.</p><div class="stat-value">${Math.round(completed/4*100)}%</div><div class="progress-track"><div class="progress-fill" style="width:${completed/4*100}%"></div></div><div class="task-list"><div class="task-row"><span class="task-check ${p.fullName?"done":""}">${p.fullName?"✓":""}</span><div class="task-info"><strong>Preferred name</strong><small>Helps personalise your workspace.</small></div></div><div class="task-row"><span class="task-check ${p.province?"done":""}">${p.province?"✓":""}</span><div class="task-info"><strong>Province</strong><small>Can help narrow relevant opportunities.</small></div></div><div class="task-row"><span class="task-check ${p.qualification?"done":""}">${p.qualification?"✓":""}</span><div class="task-info"><strong>Study / qualification</strong><small>Useful for preparation and eligibility checks.</small></div></div><div class="task-row"><span class="task-check ${interests.length?"done":""}">${interests.length?"✓":""}</span><div class="task-info"><strong>Pathway interests</strong><small>Choose at least one route to explore.</small></div></div></div><div class="next-step"><strong>Keep your information in your control.</strong><p>Real Kingsmen will need secure sign-in, authorised candidate matching and correction review before this becomes an official profile.</p>${button("Explore pathways",'data-view="pathways"',false)}</div></div></div>`;
  }
  function pathwaysView() {
    return `${heading("My pathways","Explore the routes in the Kingsmen journey. Availability and eligibility must be verified against official sources.")}<div class="path-grid">${pathways.map(p=>`<article class="path-card"><div class="card-icon">${p.icon}</div><h3>${p.name}</h3><p>${p.desc}</p>${p.unconfirmed?'<span class="tag pending">Source confirmation required</span>':button("Explore preparation",`data-path="${p.id}"`)}</article>`).join("")}</div><p class="muted-note">Pathway labels are a working navigation inventory. The sixth canonical pathway must be confirmed from the authoritative Kingsmen catalogue before production.</p>`;
  }
  function opportunitiesView() {
    return `${heading("Opportunities","Verified source records appear first. Demo listings are separated and labelled for practice.")}<div class="panel verified-opportunities-panel"><h3>Official-source opportunities</h3><p class="panel-subtitle">Only records allowed by Kingsmen’s verified-public database policy are shown here.</p><div id="verified-opportunity-results"><p class="muted-note">Loading verified records…</p></div></div><h3 class="subsection-title">Practice with demo listings</h3><p class="muted-note">These records are not real opportunities. Use them only to practise the save and preparation interface.</p><div class="filter-row"><input id="opportunity-search" class="filter-input" placeholder="Search opportunities…" aria-label="Search opportunities"><select id="opportunity-filter" class="filter-select" aria-label="Filter opportunity type"><option value="all">All types</option><option>Education</option><option>Skills</option><option>Employment</option></select></div><div class="opportunity-grid" id="opportunity-results"></div><p class="muted-note">These demo listings are not live or verified opportunities. Saving one does not submit an application or contact a provider.</p>`;
  }
  function renderVerifiedOpportunityCard(o) {
    return "<article class=\"opportunity-card\"><span class=\"provider\">VERIFIED SOURCE · "+escapeHtml(o.source_confidence_band||"")+"</span><h3>"+escapeHtml(o.programme_name||"Opportunity")+"</h3><p>"+escapeHtml(o.eligibility_summary||"Review official eligibility requirements at the source.")+"</p><div class=\"details\">"+escapeHtml(o.route_type||"Pathway")+" · "+escapeHtml(o.province||"South Africa")+"<br><br>Status: "+escapeHtml(o.availability_status||"Verify availability")+"<br>Source checked: "+escapeHtml(o.updated_at?new Date(o.updated_at).toLocaleDateString():"date unavailable")+"</div><a class=\"secondary-button\" href=\""+escapeHtml(o.source_url)+"\" target=\"_blank\" rel=\"noopener noreferrer\">Open official source ↗</a><button class='secondary-button' data-save-route='"+escapeHtml(o.id)+"'>Save to my account</button></article>";
  }
  async function loadVerifiedOpportunities() {
    const target=document.getElementById("verified-opportunity-results");
    if(!target)return;
    if(!supabaseClient){target.innerHTML="<p class=\"muted-note\">Supabase client unavailable. Live listings cannot be loaded.</p>";return;}
    target.innerHTML="<p class=\"muted-note\">Checking official-source records…</p>";
    try {
      const result=await supabaseClient.from("route_programmes")
        .select("id,programme_name,route_type,province,source_url,source_confidence_band,route_status,availability_status,eligibility_summary,updated_at")
        .eq("route_status","VERIFIED")
        .in("availability_status",["OPEN","FUTURE"])
        .in("source_confidence_band",["A","B"])
        .not("source_url","is",null)
        .order("updated_at",{ascending:false})
        .limit(30);
      if(result.error)throw result.error;
      const rows=Array.isArray(result.data)?result.data:[];
      if(!rows.length){
        target.innerHTML="<div class=\"empty-state\"><strong>No verified live listings are currently available.</strong><p>Kingsmen will not invent listings or show practice records as real opportunities. Check again later, or use the clearly separated demo records to practise.</p></div>";
        return;
      }
      target.innerHTML="<div class=\"opportunity-grid\">"+rows.map(renderVerifiedOpportunityCard).join("")+"</div>";
    } catch(error) {
      target.innerHTML="<div class=\"empty-state\"><strong>Verified listings could not be loaded.</strong><p>The live source check failed. Demo records remain clearly labelled separately.</p></div>";
    }
  }
  function renderOpportunityCards() {
    const target=document.getElementById("opportunity-results"); if(!target)return;
    const q=(document.getElementById("opportunity-search")?.value||"").toLowerCase();
    const type=document.getElementById("opportunity-filter")?.value||"all";
    const list=opportunities.filter(o=>(type==="all"||o.type===type)&&[o.title,o.desc,o.provider,o.type].join(" ").toLowerCase().includes(q));
    target.innerHTML=list.length?list.map(o=>{const saved=state.saved.includes(o.id);return `<article class="opportunity-card"><span class="provider">${o.provider}</span><h3>${o.title}</h3><p>${o.desc}</p><div class="details">${o.type} · ${o.location}<br><br>Deadline: ${o.deadline}</div>${button(saved?"★ Saved":"☆ Save opportunity",`data-save="${o.id}" class="${saved?"secondary-button saved":"secondary-button"}`)}</article>`;}).join(""):'<div class="empty-state"><strong>No matching opportunities</strong><p>Try a different search or filter.</p></div>';
  }
  function applicationsView() {
    return `${heading("Application preparation","Track preparation separately from any actual submission or provider decision.")}<div class="content-grid"><div class="panel"><h3>Preparation checklist</h3><p class="panel-subtitle">Your progress is candidate-reported, not an independently verified outcome. ${workspacePersistenceAvailable?"Saved to your verified candidate workspace.":"Progress remains local until an authorised reviewer verifies your candidate identity link."}</p><div class="task-list">${taskList()}</div><p class="muted-note">Checking an item records your own demo progress. It does not certify a document, submit an application or change provider status.</p></div><div class="panel"><h3>Application tracker</h3><p class="panel-subtitle">Create a local preparation record from a saved opportunity.</p>${state.saved.length?state.saved.map(id=>{const o=opportunities.find(x=>x.id===id);if(!o)return "";return `<div class="task-row"><div class="task-info"><strong>${o.title}</strong><small>${state.applicationNotes[id]?"Preparation record created":"Saved opportunity · not submitted"}</small></div>${button(state.applicationNotes[id]?"Prepared":"Start prep",`data-application="${id}"`)}</div>`;}).join(""):'<div class="empty-state"><strong>No saved opportunities yet</strong><p>Save a demo opportunity first, then create a preparation record here.</p></div>'}<p class="muted-note">“Prepared” means you created a local prep record only. No provider has received an application.</p></div></div>`;
  }
  function documentsView() {
    const docs=[["identity","Identity document","Prepare a clear copy. Identity matching requires authorised review."],["results","Academic results","Gather your latest official results or transcripts."],["cv","CV / résumé","Check contact details, dates and relevant experience."],["proof-address","Proof of address","Check the receiving organisation's current requirements."]];
    return `${heading("Document readiness","A readiness checklist—not a document vault. No files are uploaded or stored in this demo.")}<div class="document-grid">${docs.map(([id,title,desc])=>{const status=state.documents[id]||"not-started";return `<article class="doc-card"><div class="card-icon">▧</div><h3>${title}</h3><p>${desc}</p><span class="tag doc-status ${status==="prepared"?"done":"pending"}">${status==="prepared"?"Candidate marked prepared":"Not prepared"}</span>${button(status==="prepared"?"Mark not prepared":"Mark prepared",`data-document="${id}"`)}</article>`;}).join("")}</div><div class="notice"><span>ⓘ</span><p>Real document upload must use private storage, authenticated access and reviewer-controlled verification. Never upload sensitive documents to this demo.</p></div>`;
  }
  function activityView() {
    const events=[...state.tasks.filter(t=>t.done).map(t=>({title:"Candidate marked preparation item complete",detail:t.title,kind:"Candidate-reported",date:"This browser session"})),...state.saved.map(id=>({title:"Opportunity saved",detail:opportunities.find(o=>o.id===id)?.title||id,kind:"Candidate action",date:"This browser session"})),...Object.keys(state.applicationNotes).map(id=>({title:"Preparation record created",detail:opportunities.find(o=>o.id===id)?.title||id,kind:"Candidate-reported",date:"This browser session"}))];
    return `${heading("Activity & evidence","See what you reported or prepared. Independently verified evidence is not available in demo mode.")}<div class="panel"><h3>Recent activity</h3><p class="panel-subtitle">Local actions only · no server-side audit record</p>${events.length?'<div class="activity-list">'+events.reverse().map(e=>`<div class="activity-item"><span class="activity-dot"></span><div><strong>${e.title}</strong><p>${e.detail}</p><small>${e.kind} · ${e.date}</small></div></div>`).join("")+'</div>':'<div class="empty-state"><strong>No activity yet</strong><p>Save an opportunity or complete a preparation item to see local activity here.</p></div>'}<p class="muted-note">Candidate-reported progress is not the same as reviewer-verified evidence or a provider-confirmed outcome.</p></div>`;
  }
  const views={home,account:accountView,profile:profileView,pathways:pathwaysView,opportunities:opportunitiesView,applications:applicationsView,documents:documentsView,activity:activityView};
  function render(view=activeView) {
    activeView=view; const labels={home:"Overview",account:"Sign in / account",profile:"My profile",pathways:"My pathways",opportunities:"Opportunities",applications:"Applications",documents:"Documents",activity:"Activity & evidence"};
    crumb.textContent=labels[view]||"Overview";
    document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
    document.getElementById("welcome").classList.toggle("hidden",view!=="home");
    root.innerHTML=(views[view]||home)();
    if(view==="opportunities"){renderOpportunityCards();loadVerifiedOpportunities();document.getElementById("opportunity-search").addEventListener("input",renderOpportunityCards);document.getElementById("opportunity-filter").addEventListener("change",renderOpportunityCards);} if(view==="profile"&&authSession?.user) void loadOfficialProfile();
  }
  document.addEventListener("submit",async e=>{
    if(e.target.id==="identity-review-form") {
      e.preventDefault();
      if(!supabaseClient||!authSession?.user){toast("Sign in before requesting identity review.");render("account");return;}
      const form=new FormData(e.target);
      const payload={
        candidate_reference:String(form.get("candidate_reference")||"").trim(),
        claimant_name:String(form.get("claimant_name")||"").trim(),
        claimant_message:String(form.get("claimant_message")||"").trim()
      };
      const button=e.target.querySelector('button[type="submit"]');
      const status=document.getElementById("identity-review-message");
      if(button)button.disabled=true;
      if(status)status.textContent="Submitting your request for manual review…";
      try {
        const {data,error}=await supabaseClient.functions.invoke("candidate-identity-review-request",{body:payload});
        if(error)throw error;
        if(status)status.textContent=(data?.message||"Request submitted for manual review.")+" Reference: "+(data?.request_id||"not returned");
        e.target.reset();
      } catch(error) {
        if(status)status.textContent=error.message||"Request failed. Check your session and try again.";
      } finally {if(button)button.disabled=false;}
      return;
    }
    if(e.target.id==="auth-form") {
      e.preventDefault();
      if(!supabaseClient){toast("Account service unavailable.");return;}
      const form=new FormData(e.target), email=String(form.get("email")||"").trim(), password=String(form.get("password")||"");
      const action=e.submitter?.value||"signin";
      authBusy=true;authMessage="Working securely with Supabase Auth…";render("account");
      try {
        const result=action==="signup"
          ? await supabaseClient.auth.signUp({email,password})
          : await supabaseClient.auth.signInWithPassword({email,password});
        if(result.error) throw result.error;
        authSession=result.data.session||null;
        authBusy=false;
        authMessage=action==="signup"&&!authSession?"Account created if permitted. Check your email for a confirmation link before signing in.": "Sign-in successful.";
        if(authSession) authMessage="Account authenticated. Candidate identity has not been linked or verified.";
        render("account");updateAuthStatus();
      } catch(error) { authBusy=false;authMessage=error.message||"Account action failed.";render("account"); }
      finally {authBusy=false;}
      const msg=document.getElementById("auth-message");if(msg)msg.textContent=authMessage;
      return;
    }
    if(e.target.id!=="profile-form")return;
    e.preventDefault();
    const form=new FormData(e.target);
    const next={fullName:String(form.get("fullName")||"").trim(),province:String(form.get("province")||""),qualification:String(form.get("qualification")||""),interests:form.getAll("interest").map(String)};
    if(profileReviewAvailable&&supabaseClient&&authSession?.user){
      const reason=String(form.get("changeReason")||"").trim(),changes=[];
      if((officialProfile?.province||"")!==next.province&&next.province)changes.push({field_name:"province",requested_value:next.province,reason});
      if((officialProfile?.highest_grade||"")!==next.qualification&&next.qualification)changes.push({field_name:"highest_grade",requested_value:next.qualification,reason});
      if(changes.length&&reason.length<5){const msg=document.getElementById("profile-review-message");if(msg)msg.textContent="Enter a reason of at least 5 characters for official corrections.";return;}
      const msg=document.getElementById("profile-review-message"),submit=e.target.querySelector('button[type="submit"]');if(submit)submit.disabled=true;
      try{
        for(const change of changes){const {data,error}=await supabaseClient.functions.invoke("candidate-profile-review",{body:{action:"request_change",...change}});if(error)throw error;}
        state.profile={...(state.profile||{}),fullName:next.fullName,interests:next.interests};save();
        if(changes.length) await loadOfficialProfile(true);
        if(msg)msg.textContent=changes.length?`${changes.length} correction request(s) submitted. The official profile has not been changed.`:"No official field changes detected. Preferred name and interests are local only.";
        toast(changes.length?"Correction submitted for review.":"Local preferences saved.");
      }catch(error){if(msg)msg.textContent=error.message||"Could not submit correction request.";}finally{if(submit)submit.disabled=false;}
      return;
    }
    state.profile=next;save();render("profile");toast("Demo profile saved in this browser.");
  });
  document.addEventListener("click",async e=>{
    if(e.target.closest("#sign-out-button")) {
      if(supabaseClient){const {error}=await supabaseClient.auth.signOut();if(error){toast("Could not sign out.");return;}}
      authSession=null;authMessage="Signed out.";render("account");updateAuthStatus();return;
    }
    if(e.target.closest("#reset-password-button")) {
      if(!supabaseClient){toast("Account service unavailable.");return;}
      const email=String(document.getElementById("auth-email")?.value||"").trim();
      if(!email){authMessage="Enter your email address first.";const m=document.getElementById("auth-message");if(m)m.textContent=authMessage;return;}
      const {error}=await supabaseClient.auth.resetPasswordForEmail(email);
      authMessage=error?(error.message||"Password reset could not be requested."):"If the account exists, a password reset email will be sent.";
      const m=document.getElementById("auth-message");if(m)m.textContent=authMessage;return;
    }
    const nav=e.target.closest("[data-view]");if(nav){e.preventDefault();render(nav.dataset.view);return;}
    const task=e.target.closest("[data-task]");if(task){const t=state.tasks.find(x=>x.id===task.dataset.task);if(t){t.done=!t.done;save();render();if(workspacePersistenceAvailable)await persistReadiness();toast(workspacePersistenceAvailable?"Preparation progress updated.":"Demo preparation progress updated.");}return;}
    const saveButton=e.target.closest("[data-save]");if(saveButton){const id=saveButton.dataset.save;state.saved=state.saved.includes(id)?state.saved.filter(x=>x!==id):[...state.saved,id];save();renderOpportunityCards();toast(state.saved.includes(id)?"Saved in this browser.":"Removed from saved opportunities.");return;}
    const liveSave=e.target.closest("[data-save-route]");
    if(liveSave){
      if(!supabaseClient||!authSession?.user){toast("Sign in first to save a verified opportunity to your account.");render("account");return;}
      liveSave.disabled=true;
      try {
        const result=await supabaseClient.from("candidate_saved_routes").insert({user_id:authSession.user.id,route_programme_id:liveSave.dataset.saveRoute});
        if(result.error) {
          if(result.error.code==="23505"){toast("This opportunity is already saved to your account.");}
          else throw result.error;
        } else toast("Verified opportunity saved to your account.");
      } catch(error) {toast(error.message||"Could not save this opportunity. Your account policy may block it.");}
      finally {liveSave.disabled=false;}
      return;
    }
    const app=e.target.closest("[data-application]");if(app){state.applicationNotes[app.dataset.application]=true;save();render();toast("Local preparation record created—not submitted.");return;}
    const doc=e.target.closest("[data-document]");if(doc){const id=doc.dataset.document;state.documents[id]=state.documents[id]==="prepared"?"not-started":"prepared";save();render();toast("Demo readiness state updated.");return;}
    const path=e.target.closest("[data-path]");if(path){
      const id=path.dataset.path;
      if(!state.profile)state.profile={fullName:"",province:"",qualification:"",interests:[]};
      state.profile.interests=Array.from(new Set([...(state.profile.interests||[]),id]));
      state.priorityPathway=id;
      const routeTask=state.tasks.find(t=>t.id==="route");if(routeTask)routeTask.done=true;
      save();render("profile");if(workspacePersistenceAvailable)await persistReadiness();toast("Pathway interest saved. Check official eligibility before applying.");return;
    }
  });
  document.getElementById("dismiss-notice").addEventListener("click",()=>{document.querySelector(".notice").classList.add("hidden");state.noticeVisible=false;save();});
  document.getElementById("reset-demo").addEventListener("click",()=>{if(confirm("Reset all Kingsmen One demo progress saved in this browser?")){state=initial();save();render("home");document.querySelector(".notice").classList.remove("hidden");toast("Demo state reset.");}});
  if(supabaseClient) {
    supabaseClient.auth.onAuthStateChange((_event,session)=>{
      authSession=session;
      updateAuthStatus();
      if(session?.user) {void loadPersistentReadiness();void loadOfficialProfile(true);}
      else {workspacePersistenceAvailable=false;workspaceLoadedForUser=null;profileReviewAvailable=false;officialProfile=null;profileChangeRequests=[];profileLoadedForUser=null;}
      if(activeView==="account")render("account");
    });
    refreshAuthSession();
  }
  render();
})();