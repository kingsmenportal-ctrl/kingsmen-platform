insert into public.public_website_runtime_config (config_key, config_value, config_scope, locked) values
('PUBLIC_IDENTITY_PRIVATE_ROUTE_COMMAND_HOUSE','true'::jsonb,'BRAND',true),
('NOT_CHEAP_APPLICATION_HELP_SERVICE','true'::jsonb,'BRAND',true),
('FREE_DESTINY_MAP_PRICE_ZAR','0'::jsonb,'PRICING',true),
('FREE_DESTINY_MAP_MANAGED_APPLICATIONS','0'::jsonb,'PRICING',true),
('FREE_DESTINY_MAP_EXACT_TARGETS_SEALED','true'::jsonb,'SEALED_INTELLIGENCE',true),
('CV_REVAMP_PRICE_ZAR','49.99'::jsonb,'PRICING',true),
('CV_REVAMP_INCLUDED_CV_VERSIONS','15'::jsonb,'PRICING',true),
('CV_REVAMP_INCLUDED_MOTIVATION_LETTERS','15'::jsonb,'PRICING',true),
('ACCOMMODATION_SUPPORT_SEPARATE_FEE','false'::jsonb,'PRICING',true),
('ACCOMMODATION_SUPPORT_COUNTS_TOWARD_MANAGED_ROUTE_ALLOWANCE','true'::jsonb,'PRICING',true),
('PUBLIC_SITE_EMAIL_FIRST_WHATSAPP_URGENT_ONLY','true'::jsonb,'COMMS',true),
('SMART_FORM_DOCUMENT_AWARE_PREFILL','true'::jsonb,'INTAKE',true),
('PUBLIC_SITE_ORACLE_LITE_STATIC_FIRST','true'::jsonb,'RUNTIME',true)
on conflict (config_key) do update set config_value = excluded.config_value, updated_at = now();

insert into public.public_website_pages
(page_key, page_title, page_slug, page_type, status, seo_title, seo_description, noindex)
values
('home','Kingsmen Route Command House','/','HOME','PUBLISHED','Kingsmen - Private Route Command House','South African route intelligence, document readiness, opportunity direction, and managed execution for study, work, funding, and accommodation routes.',false),
('destiny-map','Free Destiny Map','/destiny-map','DESTINY_MAP','PUBLISHED','Free Destiny Map - Kingsmen','Get an all-sector preview of possible study, work, funding, CV, and accommodation routes. Exact targets unlock after package activation.',false),
('pricing','Kingsmen Packages','/pricing','PRICING','PUBLISHED','Kingsmen Packages and Pricing','Seven package options with versioned route allowances and service terms; accommodation support where relevant is part of the managed-route allowance.',false),
('sectors','Route Universe','/sectors','SECTORS','PUBLISHED','Kingsmen Route Universe','Universities, TVET, SETA, learnerships, employers, bursaries, NSFAS, CAO, accommodation, and verified private provider route visibility.',false),
('trust-safety','Trust and Safety','/trust-safety','TRUST_SAFETY','PUBLISHED','Kingsmen Trust and Safety','How Kingsmen protects truth, privacy, official-source confidence, route integrity, communication evidence, and candidate dignity.',false),
('contact','Start With Kingsmen','/contact','CONTACT','PUBLISHED','Start With Kingsmen','Start with a smart form and document-aware route preview.',false)
on conflict (page_key) do update set
  page_title = excluded.page_title,
  page_slug = excluded.page_slug,
  page_type = excluded.page_type,
  status = excluded.status,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  updated_at = now();

insert into public.public_website_sections
(section_key, page_key, section_type, section_order, headline, body, call_to_action, visibility, source_policy)
values
('home_hero','home','HERO',10,'Your private route command house','Kingsmen helps South Africans move with direction, evidence, document readiness, route intelligence, fallback planning, and managed execution across study, work, funding, skills, CV, and accommodation routes.','Start with the Free Destiny Map','PUBLIC','PROOF_SAFE_COPY'),
('home_positioning','home','POSITIONING',20,'Not cheap application help','Kingsmen is not selling rushed form filling. Kingsmen sells positioning, protection, confidence, readiness, route command, source-aware decisions, and execution discipline.','See how it works','PUBLIC','PROOF_SAFE_COPY'),
('home_sector_preview','home','SECTOR_PREVIEW',30,'All sectors remain visible','Universities, TVET, SETA/QCTO routes, learnerships, employers, internships, bursaries, scholarships, NSFAS support, CAO planning, accommodation, and verified private colleges stay visible to every user.','View route universe','PUBLIC','PROOF_SAFE_COPY'),
('destiny_preview','destiny-map','DESTINY_MAP_PREVIEW',10,'Free Destiny Map is a preview','The R0 Destiny Map gives an all-sector preview with 0 managed applications. Exact institutions, companies, portals, programmes, links, manual plans, bursary targets, and accommodation targets remain sealed until package activation.','Request Free Destiny Map','SEALED_AFTER_PREVIEW','SEALED_INTELLIGENCE'),
('pricing_boundary','pricing','PACKAGE_CARD',10,'Packages control campaign weight, not dignity','Packages affect managed count, monitoring, priority, route intensity, document support, and execution weight. They do not decide whether a person deserves access to a sector.','Choose a package','PUBLIC','PRICING_LOCK'),
('trust_not_official','trust-safety','TRUST_BOUNDARY',10,'Kingsmen is not an official portal','Kingsmen is not a university, TVET, SETA, NSFAS, CAO, employer, bursary provider, accommodation provider, payment provider, or government portal. We support and route; we do not replace official decisions.','Read safety rules','PUBLIC','LEGAL_BOUNDARY'),
('trust_no_guarantee','trust-safety','TRUST_BOUNDARY',20,'No false guarantees','Kingsmen does not guarantee admission, funding, employment, accommodation, official portal acceptance, or official response speed.','Read safety rules','PUBLIC','LEGAL_BOUNDARY'),
('contact_smart_form','contact','LEAD_CAPTURE',10,'Smart form, not repeated typing','Kingsmen intake should use CVs and uploaded documents to prefill what can be extracted, then ask only for missing or uncertain information with candidate confirmation.','Begin intake','PUBLIC','PRIVACY_POPIA')
on conflict (section_key) do update set
  page_key = excluded.page_key,
  section_type = excluded.section_type,
  section_order = excluded.section_order,
  headline = excluded.headline,
  body = excluded.body,
  call_to_action = excluded.call_to_action,
  visibility = excluded.visibility,
  source_policy = excluded.source_policy,
  updated_at = now();

insert into public.public_website_package_cards
(package_key, package_name, price_zar, price_label, package_type, managed_application_count, included_cv_versions, included_motivation_letters, included_accommodation_routes, route_visibility, package_boundary, active)
values
('FREE_DESTINY_MAP','Free Destiny Map',0.00,'R0','FREE_PREVIEW',0,0,0,0,'PREVIEW_ONLY','All-sector preview only. Exact targets, links, portals, manual plans, bursary targets, and accommodation targets remain sealed until package activation.',true),
('CV_REVAMP','CV Revamp',49.99,'R49.99','CV_SERVICE',0,15,15,0,'SEALED','Includes 15 personalised CV versions and 15 matching motivation letters. Must remain truthful and may never invent experience, qualifications, references, certificates, or skills.',true),
('ACCOMMODATION_SUPPORT','Accommodation Support Package',179.00,'R179.00','ACCOMMODATION_SUPPORT',8,0,0,8,'ACTIVATED','Standalone support for 8 accommodation applications/routes. Every paid Kingsmen package includes up to 8 ACC-01 accommodation routes.',true)
on conflict (package_key) do update set
  package_name = excluded.package_name,
  price_zar = excluded.price_zar,
  price_label = excluded.price_label,
  package_type = excluded.package_type,
  managed_application_count = excluded.managed_application_count,
  included_cv_versions = excluded.included_cv_versions,
  included_motivation_letters = excluded.included_motivation_letters,
  included_accommodation_routes = excluded.included_accommodation_routes,
  route_visibility = excluded.route_visibility,
  package_boundary = excluded.package_boundary,
  active = excluded.active,
  updated_at = now();

insert into public.public_website_sector_cards
(sector_key, sector_name, sector_group, public_description, preview_allowed, exact_targets_sealed, official_source_required, display_order, active)
values
('UNIVERSITY','Universities','EDUCATION','Public university route visibility, readiness, deadline awareness, document positioning, and application pathway support.',true,true,true,10,true),
('TVET','TVET Colleges','EDUCATION','TVET route visibility, programme fit, document readiness, campus/portal awareness, and fallback support.',true,true,true,20,true),
('SETA_QCTO','SETA / QCTO / Skills','SKILLS','Skills programmes, SETA routes, QCTO-aligned opportunities, and learnership pipeline visibility.',true,true,true,30,true),
('LEARNERSHIP','Learnerships','WORK','Learnership opportunity intelligence, eligibility readiness, document preparation, and employer intake tracking.',true,true,true,40,true),
('EMPLOYER_INTERNSHIP','Employers / Internships','WORK','Employer, internship, entry-level work, and campaign route visibility with CV/motivation positioning.',true,true,true,50,true),
('BURSARY_SCHOLARSHIP','Bursaries / Scholarships','FUNDING','Funding route preview, document readiness, deadline watch, and evidence-backed target activation.',true,true,true,60,true),
('NSFAS','NSFAS Support','FUNDING','NSFAS document support, submission support, and appeal tracking boundaries without approval guarantees.',true,true,true,70,true),
('CAO','CAO Route Planning','CENTRAL_ROUTE','CAO is treated as one Kingsmen application with internal choices tracked as child items.',true,true,true,80,true),
('ACCOMMODATION','Accommodation','ACCOMMODATION','Accommodation route preview, readiness, application routing, and stability support.',true,true,true,90,true),
('PRIVATE_COLLEGE','Verified Private Colleges','PRIVATE_PROVIDER','Private provider route visibility only after accreditation/source-confidence checks.',true,true,true,100,true)
on conflict (sector_key) do update set
  sector_name = excluded.sector_name,
  sector_group = excluded.sector_group,
  public_description = excluded.public_description,
  preview_allowed = excluded.preview_allowed,
  exact_targets_sealed = excluded.exact_targets_sealed,
  official_source_required = excluded.official_source_required,
  display_order = excluded.display_order,
  active = excluded.active,
  updated_at = now();

insert into public.public_website_content_guardrails
(guardrail_key, guardrail_name, guardrail_type, severity, rule_text, active)
values
('BRAND_ROUTE_COMMAND_HOUSE','Route command house language','BRAND','BLOCK','Public copy must present Kingsmen as a private route house / private route command house, not cheap application help.',true),
('NO_FAKE_GUARANTEES','No fake guarantees','CLAIMS','BLOCK','Public copy must not guarantee admission, funding, employment, accommodation, official acceptance, or official response speed.',true),
('NO_OFFICIAL_IMPERSONATION','No official impersonation','LEGAL','BLOCK','Public copy must never imply Kingsmen is an official government, university, TVET, SETA, NSFAS, CAO, employer, bursary, accommodation, or payment portal.',true),
('SEALED_ROUTE_INTELLIGENCE','Seal exact route intelligence','SEALED_INTELLIGENCE','BLOCK','Free public pages may preview sectors but must not expose exact activated-package targets, links, portal plans, or manual route plans.',true),
('PRICING_CANONICAL','Canonical public pricing','PRICING','BLOCK','Free Destiny Map R0, CV Revamp R49.99, Accommodation Support R179.00, and 8 ACC-01 routes included in every paid package must remain exact unless founder changes pricing.',true),
('TRUTHFUL_CV_BOUNDARY','Truthful CV boundary','PROOF','BLOCK','CV service copy must never invent fake experience, qualifications, references, certificates, skills, or achievements.',true),
('EMAIL_FIRST_COMMS','Email-first communication doctrine','COMMS','WARN','Public copy must set email as primary communication and WhatsApp as urgent-only.',true),
('POPIA_CONSENT','POPIA consent','PRIVACY','BLOCK','Lead capture and smart intake must request consent before profile handoff and document processing.',true),
('SOURCE_CONFIDENCE','Official source confidence','SOURCE','BLOCK','Deadlines, fees, requirements, and official route claims must be official-source-backed or marked for review.',true)
on conflict (guardrail_key) do update set
  guardrail_name = excluded.guardrail_name,
  guardrail_type = excluded.guardrail_type,
  severity = excluded.severity,
  rule_text = excluded.rule_text,
  active = excluded.active,
  updated_at = now();

insert into public.public_website_source_disclosures
(disclosure_key, disclosure_title, disclosure_text, disclosure_type, required_on_pages, active)
values
('NOT_OFFICIAL','Not an official portal','Kingsmen is a private route command house. Kingsmen is not an official university, TVET, SETA, NSFAS, CAO, employer, bursary provider, accommodation provider, payment provider, or government portal.','NOT_OFFICIAL',array['home','destiny-map','pricing','sectors','trust-safety','contact'],true),
('NO_GUARANTEE','No guarantee','Kingsmen supports direction, readiness, routing, evidence, and execution discipline. Kingsmen does not guarantee admission, funding, employment, accommodation, approval, or official response speed.','NO_GUARANTEE',array['home','destiny-map','pricing','trust-safety'],true),
('SEALED_ROUTES','Sealed route intelligence','Free previews do not reveal exact activated-package targets, links, manual plans, or route execution details.','SEALED_ROUTES',array['destiny-map','pricing','sectors'],true),
('EMAIL_FIRST','Email-first communication','Kingsmen uses email as the primary evidence channel. WhatsApp is reserved for urgent-only escalation.','EMAIL_FIRST',array['home','contact','trust-safety'],true),
('SMART_FORM','Smart form prefill','Kingsmen intake is document-aware. CVs and uploaded documents may prefill fields, but candidates must confirm extracted details.','SMART_FORM',array['contact','destiny-map'],true)
on conflict (disclosure_key) do update set
  disclosure_title = excluded.disclosure_title,
  disclosure_text = excluded.disclosure_text,
  disclosure_type = excluded.disclosure_type,
  required_on_pages = excluded.required_on_pages,
  active = excluded.active,
  updated_at = now();