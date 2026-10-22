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
  const initial = () => ({profile:{fullName:"",province:"",qualification:"",interests:[]},tasks:[{id:"profile",title:"Review your candidate profile",detail:"Keep contact and education details up to date.",done:false},{id:"id",title:"Prepare identity document",detail:"A reviewer must verify identity through the authorised process.",done:false},{id:"results",title:"Gather academic results",detail:"Prepare readable copies; upload is available after authorised identity verification.",done:false},{id:"route",title:"Choose a pathway to explore",detail:"Review eligibility and official source requirements.",done:false}],saved:[],applicationNotes:{},documents:{},noticeVisible:true});
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
  let privateDocuments = [];
  let privateDocumentsLoadedForUser = null;
  let privateDocumentsLoadingForUser = null;
  let privateDocumentsError = "";
  // Browser-local demo data must never follow a session from one account to another.
  function setAuthSession(session) {
    const previousUserId = authSession?.user?.id || null;
    const nextUserId = session?.user?.id || null;
    authSession = session;
    if (previousUserId !== nextUserId) {
      state = initial();
      privateDocuments = [];
      privateDocumentsLoadedForUser = null;
      privateDocumentsLoadingForUser = null;
      privateDocumentsError = "";
      reviewerQueue=[]; reviewerQueueLoadedForUser=null; reviewerQueueLoadingForUser=null; reviewerQueueError="";
      save();
    }
  }
  let authMessage = "";
  let authBusy = false;
  let workspacePersistenceAvailable = false;
  let workspaceLoadedForUser = null;
  let officialProfile = null;
  let profileChangeRequests = [];
  let profileReviewAvailable = false;
  let profileLoadedForUser = null;
  let applicationTrackers = [];
  let applicationItems = [];
  let applicationSavedRoutes = [];
  let applicationWorkspaceLoadedForUser = null;
  let applicationWorkspaceAvailable = false;
  async function loadOfficialProfile(force = false) {
    const userId=authSession?.user?.id;
    if(!supabaseClient||!userId){profileReviewAvailable=false;officialProfile=null;profileChangeRequests=[];profileLoadedForUser=null;return false;}
    if(!force&&profileLoadedForUser===userId)return profileReviewAvailable;
    try {
      const {data,error}=await supabaseClient.functions.invoke('candidate-profile-review',{body:{action:'load'}});
      if (authSession?.user?.id !== userId) return false;
      if(error||data?.ready!==true)throw error||new Error('Official profile access unavailable.');
      officialProfile=data.profile||null;profileChangeRequests=Array.isArray(data.change_requests)?data.change_requests:[];profileReviewAvailable=true;profileLoadedForUser=userId;
      if(officialProfile){state.profile={...(state.profile||{}),province:officialProfile.province||'',qualification:officialProfile.highest_grade||''};save();}
      if(activeView==='profile')render('profile');return true;
    } catch {
      if (authSession?.user?.id !== userId) return false;
      profileReviewAvailable=false;profileLoadedForUser=userId;return false;
    }
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
      if (authSession?.user?.id !== userId) return false;
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
      if (authSession?.user?.id !== userId) return false;
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
      setAuthSession(data.session);
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
    if (user) return `${heading("Your account","Your Supabase Auth session is active. This does not establish candidate identity.")}<div class="panel"><span class="tag done">Authenticated</span><h3 style="margin-top:14px">${escapeHtml(user.email||"Signed-in user")}</h3><p class="panel-subtitle">Account ID: ${escapeHtml(user.id)}</p><div class="notice"><span>ⓘ</span><p>Your account is not yet linked to an authorised Kingsmen candidate record. No existing candidate data is loaded or changed. Do not enter sensitive information in the local preview.</p></div><button class="primary-button" id="sign-out-button" type="button" ${authBusy?"disabled":""}>Sign out</button><h3 style="margin-top:24px">Request candidate identity review</h3><p class="panel-subtitle">Enter the candidate reference from your Kingsmen records. A reviewer must verify the match; this request does not grant access.</p><form id="identity-review-form"><label class="form-label" for="identity-candidate-reference">Existing candidate reference</label><input class="filter-input form-control" id="identity-candidate-reference" name="candidate_reference" required minlength="2" maxlength="120" autocomplete="off" placeholder="Your Kingsmen candidate reference"><label class="form-label" for="identity-claimant-name">Your full name</label><input class="filter-input form-control" id="identity-claimant-name" name="claimant_name" required minlength="2" maxlength="160" autocomplete="name" placeholder="Name for the reviewer"><label class="form-label" for="identity-claimant-message">Message for the reviewer (required)</label><textarea class="filter-input form-control" id="identity-claimant-message" name="claimant_message" required minlength="3" maxlength="1200" rows="3" placeholder="Add context without sending identity document numbers"></textarea><button class="primary-button" type="submit">Submit for manual review</button><p id="identity-review-message" class="muted-note" role="status" aria-live="polite"></p></form><p class="muted-note">Email matching alone will never link your account. Do not enter ID numbers or upload documents through this form.</p></div>`;
    return `${heading("Sign in or create an account","Use a real account session. Signing in does not automatically claim an existing candidate record.")}<div class="content-grid"><form class="panel" id="auth-form"><h3>Account access</h3><p class="panel-subtitle">Use an email you control. A confirmation email may be required.</p><label class="form-label" for="auth-email">Email address</label><input class="filter-input form-control" type="email" id="auth-email" name="email" autocomplete="email" required maxlength="254" placeholder="you@example.com"><label class="form-label" for="auth-password">Password</label><input class="filter-input form-control" type="password" id="auth-password" name="password" autocomplete="current-password" required minlength="8" maxlength="128" placeholder="At least 8 characters"><div class="auth-actions"><button class="primary-button" type="submit" name="auth-action" value="signin" ${authBusy?"disabled":""}>Sign in</button><button class="secondary-button" type="submit" name="auth-action" value="signup" ${authBusy?"disabled":""}>Create account</button></div><button class="text-button" type="button" id="reset-password-button">Send password reset email</button><p id="auth-message" class="muted-note" role="status" aria-live="polite">${escapeHtml(authMessage||"")}</p></form><div class="panel"><h3>Identity protection</h3><div class="task-list"><div class="task-row"><span class="task-check done">✓</span><div class="task-info"><strong>Secure account session</strong><small>Handled by Supabase Auth.</small></div></div><div class="task-row"><span class="task-check done">✓</span><div class="task-info"><strong>No automatic candidate matching</strong><small>An email match alone cannot establish identity.</small></div></div><div class="task-row"><span class="task-check">!</span><div class="task-info"><strong>Authorised identity review still required</strong><small>Candidate records stay locked until the link is verified.</small></div></div></div><p class="muted-note">Do not upload identity documents to this preview. Private uploads are available after authorised candidate identity verification.</p></div></div>`;
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
    const correctionHistory = profileReviewAvailable
      ? "<div class=\"panel\" style=\"margin-top:18px\"><h3>Correction request history</h3><p class=\"panel-subtitle\">Requests are reviewed by an authorised operator. Submitting a request never changes the official profile by itself.</p>" +
        (profileChangeRequests.length
          ? "<div class=\"task-list\">" + profileChangeRequests.map(r => "<div class=\"task-row\"><span class=\"task-check\" aria-hidden=\"true\">↻</span><div class=\"task-info\"><strong>" + escapeHtml(r.field_name || "Profile field") + ": " + escapeHtml(r.requested_value || "") + "</strong><small>" + escapeHtml(r.reason || "") + " · " + escapeHtml(r.requested_at ? new Date(r.requested_at).toLocaleDateString() : "Date unavailable") + "</small></div><span class=\"tag pending\">" + escapeHtml(r.status || "PENDING") + "</span></div>").join("") + "</div>"
          : "<div class=\"empty-state\"><strong>No correction requests yet</strong><p>Submitted requests will appear here with their current review status.</p></div>") + "</div>"
      : "";
    return `${heading("My profile",profileReviewAvailable?"Official candidate profile is read-only; request authorised corrections.":"Until your identity link is verified, profile details stay in this browser.")}<div class="content-grid"><form class="panel" id="profile-form"><h3>Candidate details</h3><p class="panel-subtitle">${profileReviewAvailable?"Official profile access verified. Corrections remain pending until a reviewer decides them.":"Preview mode: this is not an official identity profile."}</p><label class="form-label" for="profile-name">Preferred name</label><input class="filter-input form-control" id="profile-name" name="fullName" maxlength="80" autocomplete="name" value="${escapeHtml(p.fullName)}" placeholder="How should we address you?"><label class="form-label" for="profile-province">Province</label><select class="filter-select form-control" id="profile-province" name="province"><option value="">Choose province</option>${["Eastern Cape","Free State","Gauteng","KwaZulu-Natal","Limpopo","Mpumalanga","Northern Cape","North West","Western Cape"].map(v=>`<option ${p.province===v?"selected":""}>${v}</option>`).join("")}</select><label class="form-label" for="profile-qualification">Highest qualification / current study</label><select class="filter-select form-control" id="profile-qualification" name="qualification"><option value="">Choose an option</option>${["Still at school","Matric / Grade 12","Certificate","Diploma","Degree","Postgraduate","TVET / occupational qualification","Other / not sure"].map(v=>`<option ${p.qualification===v?"selected":""}>${v}</option>`).join("")}</select><fieldset class="interest-fieldset"><legend>What would you like help with?</legend>${fields.map(([id,label])=>`<label class="interest-option"><input type="checkbox" name="interest" value="${id}" ${interests.includes(id)?"checked":""}> <span>${label}</span></label>`).join("")}</fieldset><label class="form-label" for="profile-change-reason">Reason for correction</label><textarea class="filter-input form-control" id="profile-change-reason" name="changeReason" maxlength="800" rows="3" placeholder="Explain why the official field needs correction"></textarea><button class="primary-button" type="submit">${profileReviewAvailable?"Submit correction requests":"Save demo profile"}</button><p id="profile-review-message" class="muted-note" role="status" aria-live="polite">${profileReviewAvailable?"Official province and qualification changes require review. Preferred name and interests remain local preferences.":"Saving records your own input only. It does not verify identity, eligibility or qualifications."}</p></form><div class="panel"><h3>Profile readiness</h3><p class="panel-subtitle">A quick guide to what you have filled in.</p><div class="stat-value">${Math.round(completed/4*100)}%</div><div class="progress-track"><div class="progress-fill" style="width:${completed/4*100}%"></div></div><div class="task-list"><div class="task-row"><span class="task-check ${p.fullName?"done":""}">${p.fullName?"✓":""}</span><div class="task-info"><strong>Preferred name</strong><small>Helps personalise your workspace.</small></div></div><div class="task-row"><span class="task-check ${p.province?"done":""}">${p.province?"✓":""}</span><div class="task-info"><strong>Province</strong><small>Can help narrow relevant opportunities.</small></div></div><div class="task-row"><span class="task-check ${p.qualification?"done":""}">${p.qualification?"✓":""}</span><div class="task-info"><strong>Study / qualification</strong><small>Useful for preparation and eligibility checks.</small></div></div><div class="task-row"><span class="task-check ${interests.length?"done":""}">${interests.length?"✓":""}</span><div class="task-info"><strong>Pathway interests</strong><small>Choose at least one route to explore.</small></div></div></div><div class="next-step"><strong>Keep your information in your control.</strong><p>Real Kingsmen will need secure sign-in, authorised candidate matching and correction review before this becomes an official profile.</p>${button("Explore pathways",'data-view="pathways"',false)}</div></div>${correctionHistory}</div>`;
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
      const freshSince=new Date(Date.now()-90*24*60*60*1000).toISOString();
      const result=await supabaseClient.from("route_programmes")
        .select("id,programme_name,route_type,province,source_url,source_confidence_band,route_status,availability_status,eligibility_summary,updated_at,route_providers!inner(provider_name,public_safe,verification_status,default_confidence_band)")
        .eq("route_status","VERIFIED")
        .in("availability_status",["OPEN","FUTURE"])
        .in("source_confidence_band",["A","B"])
        .eq("route_providers.public_safe",true)
        .eq("route_providers.verification_status","VERIFIED")
        .in("route_providers.default_confidence_band",["A","B"])
        .gte("updated_at",freshSince)
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
  async function loadApplicationWorkspace(force = false) {
    const userId=authSession?.user?.id;
    if(!supabaseClient||!userId){applicationTrackers=[];applicationItems=[];applicationSavedRoutes=[];applicationWorkspaceAvailable=false;applicationWorkspaceLoadedForUser=null;return false;}
    if(!force&&applicationWorkspaceLoadedForUser===userId)return applicationWorkspaceAvailable;
    try {
      const [workspace, saved] = await Promise.all([
        supabaseClient.functions.invoke("candidate-application-preparation",{body:{action:"load"}}),
        supabaseClient.from("candidate_saved_routes").select("route_programme_id,route_programmes(id,programme_name,route_type,source_url,route_status,availability_status)").eq("user_id",userId)
      ]);
      if (authSession?.user?.id !== userId) return false;
      if(workspace.error)throw workspace.error;
      if(workspace.data?.ready!==true)throw new Error("Verified candidate identity is required.");
      if(saved.error)throw saved.error;
      applicationTrackers=Array.isArray(workspace.data.trackers)?workspace.data.trackers:[];
      applicationItems=Array.isArray(workspace.data.items)?workspace.data.items:[];
      applicationSavedRoutes=(saved.data||[]).map(row=>row.route_programmes).filter(route=>route&&route.route_status==="VERIFIED"&&route.source_url);
      applicationWorkspaceAvailable=true;applicationWorkspaceLoadedForUser=userId;
      return true;
    } catch {
      if (authSession?.user?.id !== userId) return false;
      applicationWorkspaceAvailable=false;applicationWorkspaceLoadedForUser=userId;
      applicationTrackers=[];applicationItems=[];applicationSavedRoutes=[];
      return false;
    }
  }
  function applicationWorkspaceView() {
    const routeCards=applicationSavedRoutes.map(route=>{
      const tracked=applicationTrackers.some(t=>t.candidate_workspace_saved_opportunities?.official_url===route.source_url);
      return `<div class="task-row"><div class="task-info"><strong>${escapeHtml(route.programme_name)}</strong><small>Verified catalogue entry · saved to your account · not submitted</small></div>${button(tracked?"Tracker created":"Create tracker",`data-start-tracker="${escapeHtml(route.id)}"`,!tracked)}</div>`;
    }).join("");
    const trackerCards=applicationTrackers.map(t=>{
      const opp=Array.isArray(t.candidate_workspace_saved_opportunities)?t.candidate_workspace_saved_opportunities[0]:t.candidate_workspace_saved_opportunities;
      const items=applicationItems.filter(i=>i.tracker_id===t.id).map(i=>`<div class="task-row"><div class="task-info"><strong>${escapeHtml(i.title)}</strong><small>${escapeHtml(i.item_type)} · ${escapeHtml(i.status.replaceAll("_"," "))}${i.evidence_reference?" · evidence reference recorded":""}</small></div>${button(i.status==="NOT_STARTED"?"Start":i.status==="IN_PROGRESS"?"Mark ready":"Update",`data-update-item="${escapeHtml(i.id)}" data-item-status="${escapeHtml(i.status)}"`)}</div>`).join("");
      return `<article class="panel application-tracker-card"><h3>${escapeHtml(opp?.title||"Saved opportunity")}</h3><p class="panel-subtitle">${escapeHtml(opp?.organisation||"Official provider")} · ${escapeHtml(t.status.replaceAll("_"," "))}</p><label class="form-label" for="tracker-status-${t.id}">Candidate-reported tracker status</label><select class="filter-select form-control" id="tracker-status-${t.id}">${[["SAVED","Saved"],["PREPARING","Preparing"],["READY_TO_APPLY","Ready to apply"],["SUBMITTED_CANDIDATE_REPORTED","I report that I submitted"],["RESPONSE_RECEIVED","I report a response"],["INTERVIEW","I report an interview"],["OFFER_RECEIVED","I report an offer"],["REJECTED","I report a rejection"],["CLOSED","Closed by me"]].map(([value,label])=>`<option value="${value}" ${t.status===value?"selected":""}>${label}</option>`).join("")}</select><label class="form-label" for="tracker-note-${t.id}">Preparation note</label><textarea class="filter-input form-control" id="tracker-note-${t.id}" maxlength="1200" rows="2">${escapeHtml(t.candidate_note||"")}</textarea><button class="secondary-button" data-save-tracker-note="${escapeHtml(t.id)}">Save tracker status + note</button><div class="task-list">${items||'<p class="muted-note">No checklist items yet.</p>'}</div><form class="add-preparation-item" data-add-item="${escapeHtml(t.id)}"><label class="form-label">Add checklist item</label><input class="filter-input form-control" name="title" required minlength="2" maxlength="160" placeholder="e.g. Request certified academic results"><select class="filter-select form-control" name="item_type"><option value="TASK">Task</option><option value="DOCUMENT">Document</option></select><label class="form-label">Official source URL (optional)</label><input class="filter-input form-control" type="url" name="official_source_url" placeholder="https://…"><button class="secondary-button" type="submit">Add item</button></form><p class="muted-note">Checklist progress and evidence references are candidate-reported. Creating a tracker never submits an application to a provider.</p></article>`;
    }).join("");
    return `<div class="panel"><h3>Saved verified opportunities</h3><p class="panel-subtitle">Start a persistent tracker only from a saved, verified catalogue entry. Demo listings are excluded.</p><div class="task-list">${routeCards||'<p class="muted-note">No verified opportunities are saved to this account yet. Save one from Opportunities first.</p>'}</div></div><div class="application-tracker-list">${trackerCards||'<div class="panel"><h3>No persistent trackers yet</h3><p>Choose a saved verified opportunity above to create a tracker and its preparation checklist.</p></div>'}</div>`;
  }
  function applicationsView() {
    return `${heading("Application preparation","Persistent trackers connect saved verified opportunities to checklists and candidate-reported evidence references.")}<div class="content-grid"><div class="panel"><h3>General readiness checklist</h3><p class="panel-subtitle">${workspacePersistenceAvailable?"Saved to your verified candidate workspace.":"Local preview only until candidate identity is verified."}</p><div class="task-list">${taskList()}</div><p class="muted-note">Completing a task does not certify documents or submit an application.</p></div><div class="panel"><h3>Persistent application tracker</h3><p class="panel-subtitle">${applicationWorkspaceAvailable?"Connected to your verified candidate workspace.":"Sign in and complete authorised candidate identity review to access persistent trackers."}</p>${applicationWorkspaceAvailable?applicationWorkspaceView():'<p class="muted-note">Your tracker records are not available in preview mode. No candidate data is shown until the server verifies your identity link.</p>'}</div></div>`;
  }
  async function loadPrivateDocuments(force=false) {
    const userId=authSession?.user?.id;
    if(!supabaseClient||!userId){privateDocuments=[];privateDocumentsLoadedForUser=null;privateDocumentsError="Sign in to access private documents.";return;}
    if(privateDocumentsLoadingForUser===userId||(!force&&privateDocumentsLoadedForUser===userId))return;
    privateDocumentsLoadingForUser=userId;privateDocumentsError="";
    try{
      const {data,error}=await supabaseClient.functions.invoke("candidate-private-documents",{body:{action:"list"}});
      if(authSession?.user?.id!==userId)return;
      if(error||data?.ready!==true)throw error||new Error(data?.error||"Private document service is unavailable.");
      privateDocuments=Array.isArray(data.documents)?data.documents:[];
      privateDocumentsLoadedForUser=userId;
    }catch(error){
      if(authSession?.user?.id===userId){privateDocumentsError=error.message||"Could not load private documents.";privateDocumentsLoadedForUser=userId;}
    }finally{
      if(privateDocumentsLoadingForUser===userId)privateDocumentsLoadingForUser=null;
      if(activeView==="documents"&&authSession?.user?.id===userId)render("documents");
    }
  }
  function documentsView() {
    const docs=[["identity","Identity document","Prepare a clear copy. Identity matching requires authorised review."],["results","Academic results","Gather your latest official results or transcripts."],["cv","CV / résumé","Check contact details, dates and relevant experience."],["proof-address","Proof of address","Check the receiving organisation's current requirements."]];
    const identityReady=privateDocumentsLoadedForUser===authSession?.user?.id&&!!authSession?.user&&!privateDocumentsError;
    const statusText=s=>({"UPLOAD_PENDING":"Upload pending","UPLOADED_CANDIDATE_REPORTED":"Uploaded · awaiting review","UNDER_REVIEW":"Under review","VERIFIED":"Reviewer verified","REJECTED":"Reviewer requested correction","UPLOAD_FAILED":"Upload failed"}[s]||s);
    const documentChecklistItems=applicationWorkspaceAvailable&&applicationWorkspaceLoadedForUser===authSession?.user?.id?applicationItems.filter(i=>i.item_type==="DOCUMENT"):[];
    const checklistOptions='<option value="">Do not link to a checklist item</option>'+documentChecklistItems.map(i=>'<option value="'+escapeHtml(i.id)+'">'+escapeHtml(i.title)+'</option>').join("");
    const liveDocs=identityReady?privateDocuments.map(d=>`<div class="task-row"><span class="task-check ${d.status==="VERIFIED"?"done":""}">${d.status==="VERIFIED"?"✓":"▧"}</span><div class="task-info"><strong>${escapeHtml(d.original_filename)}</strong><small>${escapeHtml(d.mime_type)} · ${Math.ceil(Number(d.size_bytes||0)/1024)} KB · ${escapeHtml(statusText(d.status))} · ${d.uploaded_at?escapeHtml(new Date(d.uploaded_at).toLocaleDateString()):"Not finalized"}</small></div>${["UPLOADED_CANDIDATE_REPORTED","UNDER_REVIEW","VERIFIED","REJECTED"].includes(d.status)?button("Download",`data-private-download="${escapeHtml(d.id)}"`):""}</div>`).join(""):'<p class="muted-note">Private records load only after the server verifies your candidate identity.</p>';
    const livePanel=authSession?.user?`<div class="panel"><h3>Private document vault</h3><p class="panel-subtitle">Private storage · verified identity required · candidate uploads are not treated as verified evidence.</p>${privateDocumentsError?`<p class="muted-note" role="status">${escapeHtml(privateDocumentsError)}</p>`:''}<button class="secondary-button" type="button" id="refresh-private-documents">Refresh private documents</button><form id="private-document-upload-form" style="margin-top:18px"><label class="form-label" for="private-document-file">Choose a document (PDF, JPEG or PNG; max 10 MiB)</label><input class="filter-input form-control" id="private-document-file" name="file" type="file" accept="application/pdf,image/jpeg,image/png" required><label class="form-label" for="private-document-preparation-item">Link to a document checklist item (optional)</label><select class="filter-select form-control" id="private-document-preparation-item" name="preparation_item_id">${checklistOptions}</select>${documentChecklistItems.length?'':'<p class="muted-note">No document checklist items are loaded. Add a DOCUMENT item in Application preparation to link uploads to it.</p>'}<button class="primary-button" type="submit">Upload securely</button><p class="muted-note" id="private-document-upload-status" role="status" aria-live="polite">The server checks your verified identity before creating a private upload link.</p></form><h4 style="margin-top:22px">Your uploaded files</h4><div class="task-list">${liveDocs||'<p class="muted-note">No private documents uploaded yet.</p>'}</div></div>`:'<div class="panel"><h3>Private document vault</h3><p class="panel-subtitle">Sign in and complete authorised candidate identity verification before uploading private documents.</p><button class="primary-button" type="button" data-view="account">Sign in / request identity review</button></div>';
    return `${heading("Document readiness","Prepare your application documents and securely upload them after your candidate identity is verified.")}<div class="document-grid">${docs.map(([id,title,desc])=>{const status=state.documents[id]||"not-started";return `<article class="doc-card"><div class="card-icon">▧</div><h3>${title}</h3><p>${desc}</p><span class="tag doc-status ${status==="prepared"?"done":"pending"}">${status==="prepared"?"Candidate marked prepared":"Not prepared"}</span>${button(status==="prepared"?"Mark not prepared":"Mark prepared",`data-document="${id}"`)}</article>`;}).join("")}</div>${livePanel}<div class="notice"><span>ⓘ</span><p>Uploaded files remain candidate-reported until an authorised reviewer changes the status. Do not upload documents you are not authorised to share.</p></div>`;
  }
  function activityView() {
    const events=[...state.tasks.filter(t=>t.done).map(t=>({title:"Candidate marked preparation item complete",detail:t.title,kind:"Candidate-reported",date:"This browser session"})),...state.saved.map(id=>({title:"Opportunity saved",detail:opportunities.find(o=>o.id===id)?.title||id,kind:"Candidate action",date:"This browser session"})),...Object.keys(state.applicationNotes).map(id=>({title:"Preparation record created",detail:opportunities.find(o=>o.id===id)?.title||id,kind:"Candidate-reported",date:"This browser session"}))];
    return `${heading("Activity & evidence","See what you reported or prepared. Independently verified evidence is not available in demo mode.")}<div class="panel"><h3>Recent activity</h3><p class="panel-subtitle">Local actions only · no server-side audit record</p>${events.length?'<div class="activity-list">'+events.reverse().map(e=>`<div class="activity-item"><span class="activity-dot"></span><div><strong>${e.title}</strong><p>${e.detail}</p><small>${e.kind} · ${e.date}</small></div></div>`).join("")+'</div>':'<div class="empty-state"><strong>No activity yet</strong><p>Save an opportunity or complete a preparation item to see local activity here.</p></div>'}<p class="muted-note">Candidate-reported progress is not the same as reviewer-verified evidence or a provider-confirmed outcome.</p></div>`;
  }

  let reviewerQueue = [];
  let reviewerQueueLoadedForUser = null;
  let reviewerQueueLoadingForUser = null;
  let reviewerQueueError = "";
  async function loadReviewerQueue(force = false) {
    const userId=authSession?.user?.id;
    if(!supabaseClient||!userId){reviewerQueue=[];reviewerQueueLoadedForUser=null;reviewerQueueError="Sign in with an authorised reviewer account to access the review queue.";return false;}
    if(!force&&reviewerQueueLoadedForUser===userId)return true;
    if(reviewerQueueLoadingForUser===userId)return false;
    reviewerQueueLoadingForUser=userId;reviewerQueueError="";
    try {
      const {data,error}=await supabaseClient.functions.invoke("candidate-private-documents",{body:{action:"list_review_queue"}});
      if(authSession?.user?.id!==userId)return false;
      if(error||data?.ready!==true)throw error||new Error(data?.error||"Reviewer queue unavailable.");
      reviewerQueue=Array.isArray(data.documents)?data.documents:[];
      reviewerQueueLoadedForUser=userId;
      return true;
    } catch(error) {
      reviewerQueue=[];reviewerQueueLoadedForUser=null;
      reviewerQueueError=error?.message||"Reviewer queue unavailable.";
      return false;
    } finally {
      if(reviewerQueueLoadingForUser===userId)reviewerQueueLoadingForUser=null;
      if(activeView==="reviewer"&&authSession?.user?.id===userId)render("reviewer");
    }
  }
  function reviewerView() {
    if(!authSession?.user) return `${heading("Reviewer console","Private evidence review is restricted to authorised reviewers.")}<div class="panel"><p>Sign in using your assigned reviewer account. Candidate accounts cannot access the review queue.</p><button class="primary-button" type="button" data-view="account">Sign in</button></div>`;
    const rows=reviewerQueueLoadedForUser===authSession.user.id?reviewerQueue.map(d=>{
      const date=d.created_at?new Date(d.created_at).toLocaleString():"Date unavailable";
      const decisionOptions='<option value="" selected disabled>Select a decision…</option><option value="START_REVIEW">Start review</option><option value="VERIFIED">Verify evidence</option><option value="CORRECTION_REQUIRED">Request correction</option><option value="REJECTED">Reject document</option>';
      return `<article class="panel reviewer-document" data-reviewer-card data-reviewer-search="${escapeHtml(String(d.original_filename||"")+" "+String(d.id||"")+" "+String(d.candidate_id||""))}" data-reviewer-status="${escapeHtml(d.status||"")}" style="margin-bottom:14px"><div class="section-head"><div><h3>${escapeHtml(d.original_filename||"Private document")}</h3><p>${escapeHtml(d.mime_type||"Unknown type")} · ${Math.ceil(Number(d.size_bytes||0)/1024)} KB · Added ${escapeHtml(date)}</p></div><span class="tag ${d.status==="UNDER_REVIEW"?"done":"pending"}">${escapeHtml(d.status||"Unknown status")}</span></div><p class="panel-subtitle">Document ID: <code>${escapeHtml(d.id)}</code></p><p class="panel-subtitle">Candidate record: <code>${escapeHtml(d.candidate_id||"Not available")}</code></p><div class="auth-actions"><button class="secondary-button" type="button" data-reviewer-download="${escapeHtml(d.id)}">Open secure download (60 sec)</button></div><form data-review-decision data-document-id="${escapeHtml(d.id)}"><label class="form-label" for="review-decision-${escapeHtml(d.id)}">Decision</label><select class="filter-select form-control" id="review-decision-${escapeHtml(d.id)}" name="decision" required>${decisionOptions}</select><label class="form-label" for="review-note-${escapeHtml(d.id)}">Reviewer note (required for final decisions)</label><textarea class="filter-input form-control" id="review-note-${escapeHtml(d.id)}" name="reviewer_note" rows="2" maxlength="1200" placeholder="Explain the decision and any correction required"></textarea><label class="form-label" for="review-evidence-${escapeHtml(d.id)}">Evidence reference (required for final decisions)</label><input class="filter-input form-control" id="review-evidence-${escapeHtml(d.id)}" name="evidence_reference" maxlength="500" placeholder="Reference to the evidence checked"><button class="primary-button" type="submit">Save reviewer decision</button><p class="muted-note">Final decisions and audit events are saved transactionally. A candidate-reported upload is not verified until an authorised reviewer confirms it.</p></form></article>`;
    }).join(""):'<p class="muted-note">Load the queue to retrieve authorised review records.</p>';
    return `${heading("Reviewer console","Review candidate-reported evidence with permission-checked access and an auditable decision history.",'<button class="secondary-button" id="refresh-reviewer-queue" type="button">Refresh queue</button>')}<div class="panel"><span class="tag ${reviewerQueueLoadedForUser===authSession.user.id?"done":"pending"}"><div class="filter-row" style="display:flex;gap:10px;flex-wrap:wrap;margin:12px 0"><label class="sr-only" for="reviewer-queue-search">Search review queue</label><input class="filter-input" id="reviewer-queue-search" type="search" placeholder="Search filename, document or candidate ID" autocomplete="off"><label class="sr-only" for="reviewer-queue-status">Filter by status</label><select class="filter-select" id="reviewer-queue-status"><option value="">All review statuses</option><option value="UPLOADED_CANDIDATE_REPORTED">Candidate reported</option><option value="UNDER_REVIEW">Under review</option></select></div>${reviewerQueueLoadedForUser===authSession.user.id?"Queue loaded":"Authorisation required"}</span><p class="panel-subtitle">Signed in as ${escapeHtml(authSession.user.email||"authenticated user")}. The server checks reviewer permissions for every action; sign-in alone does not grant reviewer access.</p>${reviewerQueueError?`<p class="muted-note" role="status">${escapeHtml(reviewerQueueError)}</p>`:""}${reviewerQueueLoadedForUser===authSession.user.id&&!reviewerQueue.length?'<p>No documents are awaiting review. This may mean the queue is empty, or staging has no review fixtures.</p>':""}</div><div style="margin-top:16px">${rows}</div><div class="notice"><span>ⓘ</span><p>Only access documents for an authorised review purpose. Downloads expire after 60 seconds. Decision notes and evidence references are retained in the review audit trail.</p></div>`;
  }

  const views={home,account:accountView,profile:profileView,pathways:pathwaysView,opportunities:opportunitiesView,applications:applicationsView,documents:documentsView,activity:activityView,reviewer:reviewerView};
  function render(view=activeView) {
    activeView=view; const labels={home:"Overview",account:"Sign in / account",profile:"My profile",pathways:"My pathways",opportunities:"Opportunities",applications:"Applications",documents:"Documents",activity:"Activity & evidence",reviewer:"Reviewer console"};
    crumb.textContent=labels[view]||"Overview";
    document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
    document.getElementById("welcome").classList.toggle("hidden",view!=="home");
    root.innerHTML=(views[view]||home)();
    if(view==="opportunities"){renderOpportunityCards();loadVerifiedOpportunities();document.getElementById("opportunity-search").addEventListener("input",renderOpportunityCards);document.getElementById("opportunity-filter").addEventListener("change",renderOpportunityCards);} if(view==="profile"&&authSession?.user) void loadOfficialProfile(); if(view==="applications"&&authSession?.user&&applicationWorkspaceLoadedForUser!==authSession.user.id) void loadApplicationWorkspace().then(()=>{if(activeView==="applications")render("applications");}); if(view==="documents"&&authSession?.user&&privateDocumentsLoadedForUser!==authSession.user.id&&privateDocumentsLoadingForUser!==authSession.user.id) void loadPrivateDocuments(); if(view==="documents"&&authSession?.user&&applicationWorkspaceLoadedForUser!==authSession.user.id) void loadApplicationWorkspace().then(()=>{if(activeView==="documents")render("documents");}); if(view==="reviewer"&&authSession?.user&&reviewerQueueLoadedForUser!==authSession.user.id&&reviewerQueueLoadingForUser!==authSession.user.id&&!reviewerQueueError) void loadReviewerQueue();
  }
  document.addEventListener("submit",async e=>{
    if(e.target.matches("[data-review-decision]")) {
      e.preventDefault();
      const userId=authSession?.user?.id;
      if(!supabaseClient||!userId){toast("Sign in with an authorised reviewer account.");return;}
      const form=e.target, fields=new FormData(form);
      const decision=String(fields.get("decision")||"");
      const reviewerNote=String(fields.get("reviewer_note")||"").trim();
      const evidenceReference=String(fields.get("evidence_reference")||"").trim();
      if(decision!=="START_REVIEW"&&(reviewerNote.length<3||reviewerNote.length>1200||evidenceReference.length<3||evidenceReference.length>500)){
        toast("Final decisions require a reviewer note and evidence reference.");return;
      }
      const submit=form.querySelector('button[type="submit"]');if(submit)submit.disabled=true;
      try{
        const {data,error}=await supabaseClient.functions.invoke("candidate-private-documents",{body:{action:"review_document",document_id:form.dataset.documentId,decision,reviewer_note:reviewerNote,evidence_reference:evidenceReference}});
        if(authSession?.user?.id!==userId)throw new Error("Your account changed. Sign in again before continuing.");
        if(error||data?.ready!==true)throw error||new Error(data?.error||"Could not save reviewer decision.");
        toast(data.message||"Reviewer decision saved.");
        await loadReviewerQueue(true);
      }catch(error){toast(error?.message||"Could not save reviewer decision.");if(submit)submit.disabled=false;}
      return;
    }
    if(e.target.id==="private-document-upload-form") {
      e.preventDefault();
      const userId=authSession?.user?.id;
      const file=e.target.elements.file?.files?.[0];
      const status=document.getElementById("private-document-upload-status");
      const submit=e.target.querySelector('button[type="submit"]');
      if(!supabaseClient||!userId){if(status)status.textContent="Sign in before uploading.";return;}
      if(!file){if(status)status.textContent="Choose a file first.";return;}
      const allowed=["application/pdf","image/jpeg","image/png"];
      if(!allowed.includes(file.type)||file.size<1||file.size>10*1024*1024){if(status)status.textContent="Choose a PDF, JPEG or PNG between 1 byte and 10 MiB.";return;}
      if(submit)submit.disabled=true;
      if(status)status.textContent="Checking identity and preparing secure upload…";
      try{
        const {data:ticket,error:ticketError}=await supabaseClient.functions.invoke("candidate-private-documents",{body:{action:"create_upload",filename:file.name,mime_type:file.type,size_bytes:file.size,preparation_item_id:String(new FormData(e.target).get("preparation_item_id")||"").trim()||null}});
        if(authSession?.user?.id!==userId)throw new Error("Your account changed. Sign in again before retrying.");
        if(ticketError||ticket?.ready!==true)throw ticketError||new Error(ticket?.error||"Could not prepare the upload.");
        const {error:uploadError}=await supabaseClient.storage.from(ticket.bucket).uploadToSignedUrl(ticket.path,ticket.upload_token,file,{contentType:file.type,upsert:false});
        if(uploadError)throw uploadError;
        if(status)status.textContent="File uploaded to private storage. Confirming file size and recording the upload…";
        const {data:finalized,error:finalizeError}=await supabaseClient.functions.invoke("candidate-private-documents",{body:{action:"finalize_upload",document_id:ticket.document.id}});
        if(finalizeError||finalized?.ready!==true)throw finalizeError||new Error(finalized?.error||"Upload is stored but could not be finalized. Refresh and retry.");
        if(status)status.textContent="Upload recorded as candidate-reported. It is not independently verified.";
        e.target.reset();await loadPrivateDocuments(true);toast("Private document uploaded; reviewer verification is still required.");
      }catch(error){if(status)status.textContent=error.message||"Private upload failed. Retry after checking your session."; }
      finally{if(submit)submit.disabled=false;}
      return;
    }
    if(e.target.matches("[data-add-item]")) {
      e.preventDefault();
      if(!applicationWorkspaceAvailable){toast("Verified candidate workspace required.");return;}
      const form=new FormData(e.target), trackerId=e.target.dataset.addItem;
      const payload={action:"add_item",tracker_id:trackerId,title:String(form.get("title")||"").trim(),item_type:String(form.get("item_type")||"TASK"),official_source_url:String(form.get("official_source_url")||"").trim()};
      const submit=e.target.querySelector('button[type="submit"]');if(submit)submit.disabled=true;
      try{const {data,error}=await supabaseClient.functions.invoke("candidate-application-preparation",{body:payload});if(error||data?.ready!==true)throw error||new Error(data?.error||"Could not add item.");await loadApplicationWorkspace(true);render("applications");toast("Checklist item saved.");}
      catch(error){toast(error.message||"Could not add checklist item.");if(submit)submit.disabled=false;}
      return;
    }
    if(e.target.id==="identity-review-form") {
      e.preventDefault();
      if(!supabaseClient||!authSession?.user){toast("Sign in before requesting identity review.");render("account");return;}
      const form=new FormData(e.target);
      const submittingUserId=authSession.user.id;
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
        if(authSession?.user?.id!==submittingUserId)throw new Error("Your account changed. Sign in again before continuing.");
        if(error)throw error;
        if(status)status.textContent=(data?.message||"Request submitted for manual review.")+" Reference: "+(data?.request_id||"not returned");
        e.target.reset();
      } catch(error) {
        let message=error?.message||"Request failed. Check your session and try again.";
        try {
          const response=error?.context;
          if(response&&typeof response.json==="function") {
            const body=await response.json();
            if(body?.code==="IDENTITY_REVIEW_ALREADY_OPEN") message="An identity review is already open for this account. Check back for an update rather than submitting another request.";
            else if(body?.error) message=body.error;
          }
        } catch {}
        if(status)status.textContent=message;
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
  document.addEventListener("input",e=>{if(e.target.id==="reviewer-queue-search")applyReviewerQueueFilters();});
  document.addEventListener("change",e=>{if(e.target.id==="reviewer-queue-status")applyReviewerQueueFilters();});
  function applyReviewerQueueFilters(){
    const query=(document.getElementById("reviewer-queue-search")?.value||"").trim().toLowerCase();
    const status=document.getElementById("reviewer-queue-status")?.value||"";
    document.querySelectorAll("[data-reviewer-card]").forEach(card=>{
      const matchesText=!query||(card.dataset.reviewerSearch||"").toLowerCase().includes(query);
      card.hidden=!matchesText||Boolean(status&&card.dataset.reviewerStatus!==status);
    });
  }
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
    if(e.target.closest("#refresh-reviewer-queue")){await loadReviewerQueue(true);return;}
    const reviewerDownload=e.target.closest("[data-reviewer-download]");
    if(reviewerDownload){
      const userId=authSession?.user?.id;
      if(!supabaseClient||!userId){toast("Sign in with an authorised reviewer account.");return;}
      reviewerDownload.disabled=true;
      try{
        const {data,error}=await supabaseClient.functions.invoke("candidate-private-documents",{body:{action:"create_reviewer_download_url",document_id:reviewerDownload.dataset.reviewerDownload}});
        if(authSession?.user?.id!==userId)throw new Error("Your account changed. Sign in again before continuing.");
        if(error||data?.ready!==true||!data?.signed_download_url)throw error||new Error(data?.error||"Could not create a reviewer download link.");
        const anchor=document.createElement("a");anchor.href=data.signed_download_url;anchor.target="_blank";anchor.rel="noopener noreferrer";anchor.click();
        toast("Temporary reviewer download link issued and audited.");
      }catch(error){toast(error?.message||"Reviewer download unavailable.");}
      finally{reviewerDownload.disabled=false;}
      return;
    }
    if(e.target.closest("#refresh-private-documents")){await loadPrivateDocuments(true);return;}
    const privateDownload=e.target.closest("[data-private-download]");
    if(privateDownload){
      if(!supabaseClient||!authSession?.user){toast("Sign in before downloading.");return;}
      privateDownload.disabled=true;
      try{
        const {data,error}=await supabaseClient.functions.invoke("candidate-private-documents",{body:{action:"create_download_url",document_id:privateDownload.dataset.privateDownload}});
        if(error||data?.ready!==true||!data?.signed_download_url)throw error||new Error(data?.error||"Could not create a download link.");
        const anchor=document.createElement("a");anchor.href=data.signed_download_url;anchor.target="_blank";anchor.rel="noopener noreferrer";anchor.click();
      }catch(error){toast(error.message||"Download unavailable.");}
      finally{privateDownload.disabled=false;}
      return;
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
    const startTracker=e.target.closest("[data-start-tracker]");
    if(startTracker){
      if(!applicationWorkspaceAvailable){toast("Verified candidate identity is required.");return;}
      startTracker.disabled=true;
      try{const {data,error}=await supabaseClient.functions.invoke("candidate-application-preparation",{body:{action:"start_from_saved_route",route_programme_id:startTracker.dataset.startTracker}});if(error||data?.ready!==true)throw error||new Error(data?.error||"Could not create tracker.");await loadApplicationWorkspace(true);render("applications");toast(data.message||"Persistent tracker created.");}
      catch(error){toast(error.message||"Could not create tracker.");startTracker.disabled=false;}
      return;
    }
    const saveNote=e.target.closest("[data-save-tracker-note]");
    if(saveNote){
      const note=document.getElementById("tracker-note-"+saveNote.dataset.saveTracker)?.value||"";
      const tracker=applicationTrackers.find(t=>t.id===saveNote.dataset.saveTracker);if(!tracker)return;
      const status=document.getElementById("tracker-status-"+tracker.id)?.value||tracker.status;
      let evidence=tracker.evidence_reference||"";
      if(status==="SUBMITTED_CANDIDATE_REPORTED"&&!evidence.trim()){evidence=prompt("Add a reference to your submission evidence. This is candidate-reported and is not proof of provider receipt:","")||"";if(!evidence.trim()){toast("Evidence reference required to record a candidate-reported submission.");return;}}
      try{const {data,error}=await supabaseClient.functions.invoke("candidate-application-preparation",{body:{action:"update_tracker",tracker_id:tracker.id,status,candidate_note:note,evidence_reference:evidence}});if(error||data?.ready!==true)throw error||new Error(data?.error||"Could not save note.");await loadApplicationWorkspace(true);render("applications");toast("Preparation note saved.");}
      catch(error){toast(error.message||"Could not save note.");}
      return;
    }
    const updateItem=e.target.closest("[data-update-item]");
    if(updateItem){
      const item=applicationItems.find(i=>i.id===updateItem.dataset.updateItem);if(!item)return;
      let status=item.status==="NOT_STARTED"?"IN_PROGRESS":item.status==="IN_PROGRESS"?"READY_CANDIDATE_REPORTED":"IN_PROGRESS";
      let evidence=item.evidence_reference||"";
      if(status==="READY_CANDIDATE_REPORTED"){evidence=prompt("Add a reference to the evidence you prepared (not the document itself):",evidence)||"";if(!evidence.trim()){toast("Evidence reference is required to mark this item ready.");return;}}
      try{const {data,error}=await supabaseClient.functions.invoke("candidate-application-preparation",{body:{action:"update_item",item_id:item.id,status,candidate_note:item.candidate_note||"",evidence_reference:evidence}});if(error||data?.ready!==true)throw error||new Error(data?.error||"Could not update item.");await loadApplicationWorkspace(true);render("applications");toast(data.message||"Checklist updated.");}
      catch(error){toast(error.message||"Could not update checklist.");}
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
      setAuthSession(session);
      updateAuthStatus();
      if(session?.user) {void loadPersistentReadiness();void loadOfficialProfile(true);void loadApplicationWorkspace(true);}
      else {privateDocuments=[];privateDocumentsLoadedForUser=null;privateDocumentsLoadingForUser=null;privateDocumentsError="";reviewerQueue=[];reviewerQueueLoadedForUser=null;reviewerQueueLoadingForUser=null;reviewerQueueError="";workspacePersistenceAvailable=false;workspaceLoadedForUser=null;applicationTrackers=[];applicationItems=[];applicationSavedRoutes=[];applicationWorkspaceAvailable=false;applicationWorkspaceLoadedForUser=null;profileReviewAvailable=false;officialProfile=null;profileChangeRequests=[];profileLoadedForUser=null;}
      if(activeView==="account")render("account");
    });
    refreshAuthSession();
  }
  render();
})();