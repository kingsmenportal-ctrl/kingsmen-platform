create table if not exists public.public_website_runtime_config (
  config_key text primary key,
  config_value jsonb not null,
  config_scope text not null default 'PUBLIC_WEBSITE',
  locked boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.public_website_pages (
  id uuid primary key default gen_random_uuid(),
  page_key text unique not null,
  page_title text not null,
  page_slug text unique not null,
  page_type text not null,
  status text not null default 'DRAFT',
  seo_title text not null,
  seo_description text not null,
  noindex boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint public_website_page_type_chk check (page_type in ('HOME','DESTINY_MAP','PRICING','SECTORS','CV_REVAMP','ACCOMMODATION','HOW_IT_WORKS','TRUST_SAFETY','FAQ','CONTACT','LEGAL')),
  constraint public_website_page_status_chk check (status in ('DRAFT','REVIEW','APPROVED','PUBLISHED','ARCHIVED'))
);

create table if not exists public.public_website_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text unique not null,
  page_key text not null references public.public_website_pages(page_key),
  section_type text not null,
  section_order integer not null default 0,
  headline text not null,
  body text not null,
  call_to_action text,
  visibility text not null default 'PUBLIC',
  source_policy text not null default 'PROOF_SAFE_COPY',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint public_website_section_type_chk check (section_type in ('HERO','POSITIONING','SECTOR_PREVIEW','DESTINY_MAP_PREVIEW','PACKAGE_CARD','PROCESS','TRUST_BOUNDARY','FAQ','LEAD_CAPTURE','LEGAL_NOTICE','PROOF_SAFE_CLAIM')),
  constraint public_website_section_visibility_chk check (visibility in ('PUBLIC','SEALED_AFTER_PREVIEW','AUTHENTICATED_ONLY','ARCHIVED'))
);

create table if not exists public.public_website_package_cards (
  id uuid primary key default gen_random_uuid(),
  package_key text unique not null,
  package_name text not null,
  price_zar numeric(10,2) not null,
  price_label text not null,
  package_type text not null,
  managed_application_count integer not null default 0,
  included_cv_versions integer not null default 0,
  included_motivation_letters integer not null default 0,
  included_accommodation_routes integer not null default 0,
  route_visibility text not null default 'SEALED',
  package_boundary text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint public_website_package_type_chk check (package_type in ('FREE_PREVIEW','CV_SERVICE','ACCOMMODATION_SUPPORT','PAID_ROUTE_PACKAGE_BOUNDARY')),
  constraint public_website_route_visibility_chk check (route_visibility in ('PREVIEW_ONLY','SEALED','ACTIVATED'))
);

create table if not exists public.public_website_sector_cards (
  id uuid primary key default gen_random_uuid(),
  sector_key text unique not null,
  sector_name text not null,
  sector_group text not null,
  public_description text not null,
  preview_allowed boolean not null default true,
  exact_targets_sealed boolean not null default true,
  official_source_required boolean not null default true,
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint public_website_sector_group_chk check (sector_group in ('EDUCATION','FUNDING','WORK','ACCOMMODATION','SKILLS','PRIVATE_PROVIDER','CENTRAL_ROUTE'))
);

create table if not exists public.public_website_leads (
  id uuid primary key default gen_random_uuid(),
  lead_ref text unique not null,
  lead_status text not null default 'NEW',
  lead_source text not null default 'PUBLIC_WEBSITE',
  first_name text,
  last_name text,
  email text not null,
  phone text,
  province text,
  highest_grade text,
  desired_route text,
  urgency text not null default 'NORMAL',
  consent_popia boolean not null default false,
  consent_contact_email boolean not null default false,
  consent_whatsapp_urgent_only boolean not null default false,
  smart_form_prefill_requested boolean not null default true,
  cv_uploaded boolean not null default false,
  documents_uploaded boolean not null default false,
  candidate_ref text,
  handoff_status text not null default 'WAITING_CONSENT',
  evidence_refs text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint public_website_lead_status_chk check (lead_status in ('NEW','CONTACTABLE','WAITING_DOCUMENTS','HANDED_TO_CANDIDATE_CORE','UNQUALIFIED','DUPLICATE','CANCELLED')),
  constraint public_website_lead_urgency_chk check (urgency in ('LOW','NORMAL','HIGH','URGENT')),
  constraint public_website_handoff_status_chk check (handoff_status in ('WAITING_CONSENT','WAITING_EMAIL_CONFIRMATION','READY_FOR_N04','HANDED_TO_N04','BLOCKED','CANCELLED'))
);

create table if not exists public.public_destiny_map_requests (
  id uuid primary key default gen_random_uuid(),
  request_ref text unique not null,
  lead_ref text not null,
  request_status text not null default 'REQUESTED',
  preview_scope text not null default 'ALL_SECTOR_PREVIEW',
  managed_application_count integer not null default 0,
  sealed_targets boolean not null default true,
  aps_known boolean not null default false,
  document_readiness_known boolean not null default false,
  route_interest jsonb not null default '[]'::jsonb,
  generated_preview jsonb not null default '{}'::jsonb,
  activation_prompt text not null default 'Activate a package to unlock exact targets, links, manual route plans, and managed execution.',
  evidence_refs text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint public_destiny_map_status_chk check (request_status in ('REQUESTED','WAITING_PROFILE','WAITING_DOCUMENTS','PREVIEW_READY','ACTIVATION_REQUIRED','CANCELLED')),
  constraint public_destiny_map_scope_chk check (preview_scope in ('ALL_SECTOR_PREVIEW','CV_ONLY_PREVIEW','ACCOMMODATION_PREVIEW','WORK_SKILLS_PREVIEW'))
);

create table if not exists public.public_website_conversion_events (
  id uuid primary key default gen_random_uuid(),
  event_ref text unique not null,
  event_type text not null,
  lead_ref text,
  page_key text,
  package_key text,
  event_payload jsonb not null default '{}'::jsonb,
  evidence_refs text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  constraint public_website_conversion_type_chk check (event_type in ('PAGE_VIEW','CTA_CLICK','DESTINY_MAP_REQUEST','CV_REVAMP_INTEREST','ACCOMMODATION_INTEREST','PACKAGE_ACTIVATION_CLICK','CONTACT_SUBMIT','LEGAL_NOTICE_VIEW','PORTAL_HANDOFF'))
);

create table if not exists public.public_website_content_guardrails (
  guardrail_key text primary key,
  guardrail_name text not null,
  guardrail_type text not null,
  severity text not null default 'BLOCK',
  rule_text text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint public_website_guardrail_type_chk check (guardrail_type in ('BRAND','LEGAL','SOURCE','PRICING','COMMS','PRIVACY','SEALED_INTELLIGENCE','PROOF','CLAIMS')),
  constraint public_website_guardrail_severity_chk check (severity in ('INFO','WARN','BLOCK'))
);

create table if not exists public.public_website_content_versions (
  id uuid primary key default gen_random_uuid(),
  content_ref text unique not null,
  page_key text not null,
  version_number integer not null default 1,
  status text not null default 'DRAFT',
  content_hash text not null,
  review_notes text,
  approved_by text,
  guardrail_results jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  constraint public_website_content_status_chk check (status in ('DRAFT','REVIEW','APPROVED','REJECTED','PUBLISHED','ARCHIVED'))
);

create table if not exists public.public_website_source_disclosures (
  disclosure_key text primary key,
  disclosure_title text not null,
  disclosure_text text not null,
  disclosure_type text not null,
  required_on_pages text[] not null default array[]::text[],
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint public_website_disclosure_type_chk check (disclosure_type in ('NOT_OFFICIAL','NO_GUARANTEE','SOURCE_CONFIDENCE','PRIVACY_POPIA','EMAIL_FIRST','SEALED_ROUTES','PAYMENT_PROVIDER','SMART_FORM'))
);

create index if not exists idx_public_website_pages_status on public.public_website_pages(status, page_type);
create index if not exists idx_public_website_sections_page on public.public_website_sections(page_key, section_order);
create index if not exists idx_public_website_leads_status on public.public_website_leads(lead_status, handoff_status, created_at desc);
create index if not exists idx_public_destiny_map_lead on public.public_destiny_map_requests(lead_ref, request_status, created_at desc);
create index if not exists idx_public_conversion_events_type on public.public_website_conversion_events(event_type, created_at desc);
create index if not exists idx_public_content_versions_page on public.public_website_content_versions(page_key, status, version_number desc);

alter table public.public_website_runtime_config enable row level security;
alter table public.public_website_pages enable row level security;
alter table public.public_website_sections enable row level security;
alter table public.public_website_package_cards enable row level security;
alter table public.public_website_sector_cards enable row level security;
alter table public.public_website_leads enable row level security;
alter table public.public_destiny_map_requests enable row level security;
alter table public.public_website_conversion_events enable row level security;
alter table public.public_website_content_guardrails enable row level security;
alter table public.public_website_content_versions enable row level security;
alter table public.public_website_source_disclosures enable row level security;

drop policy if exists public_website_runtime_config_all on public.public_website_runtime_config;
create policy public_website_runtime_config_all on public.public_website_runtime_config for all TO service_role using (true) with check (true);
drop policy if exists public_website_pages_all on public.public_website_pages;
create policy public_website_pages_all on public.public_website_pages for all TO service_role using (true) with check (true);
drop policy if exists public_website_sections_all on public.public_website_sections;
create policy public_website_sections_all on public.public_website_sections for all TO service_role using (true) with check (true);
drop policy if exists public_website_package_cards_all on public.public_website_package_cards;
create policy public_website_package_cards_all on public.public_website_package_cards for all TO service_role using (true) with check (true);
drop policy if exists public_website_sector_cards_all on public.public_website_sector_cards;
create policy public_website_sector_cards_all on public.public_website_sector_cards for all TO service_role using (true) with check (true);
drop policy if exists public_website_leads_all on public.public_website_leads;
create policy public_website_leads_all on public.public_website_leads for all TO service_role using (true) with check (true);
drop policy if exists public_destiny_map_requests_all on public.public_destiny_map_requests;
create policy public_destiny_map_requests_all on public.public_destiny_map_requests for all TO service_role using (true) with check (true);
drop policy if exists public_website_conversion_events_all on public.public_website_conversion_events;
create policy public_website_conversion_events_all on public.public_website_conversion_events for all TO service_role using (true) with check (true);
drop policy if exists public_website_content_guardrails_all on public.public_website_content_guardrails;
create policy public_website_content_guardrails_all on public.public_website_content_guardrails for all TO service_role using (true) with check (true);
drop policy if exists public_website_content_versions_all on public.public_website_content_versions;
create policy public_website_content_versions_all on public.public_website_content_versions for all TO service_role using (true) with check (true);
drop policy if exists public_website_source_disclosures_all on public.public_website_source_disclosures;
create policy public_website_source_disclosures_all on public.public_website_source_disclosures for all TO service_role using (true) with check (true);