-- 0101 Cross-sector institution registry extension.
-- Review-gated proposal. Do not apply until PR #233 migrations are reconciled and approved.

begin;

alter table public.route_providers
  add column if not exists sector_code text,
  add column if not exists provider_subtype text,
  add column if not exists registration_authority text,
  add column if not exists registration_reference text,
  add column if not exists parent_provider_id uuid references public.route_providers(id) on delete set null,
  add column if not exists alias_keys text[] not null default '{}'::text[],
  add column if not exists capabilities text[] not null default '{}'::text[],
  add column if not exists service_area text[] not null default '{}'::text[],
  add column if not exists official_source_url text,
  add column if not exists source_observed_at timestamptz,
  add column if not exists source_refresh_after_days integer;

update public.route_providers
set sector_code = case
  when provider_type in ('UNIVERSITY','TVET','SETA','PRIVATE_COLLEGE','QUALITY_AUTHORITY') then 'EDUCATION_SKILLS'
  when provider_type in ('LEARNERSHIP_PROVIDER','EMPLOYER') then 'EMPLOYMENT_ENTERPRISE'
  when provider_type = 'BURSARY_PROVIDER' then 'FUNDING_SOCIAL_SUPPORT'
  when provider_type = 'ACCOMMODATION_PROVIDER' then 'HOUSING_ACCOMMODATION'
  when provider_type = 'GOVERNMENT_AUTHORITY' then 'GOVERNMENT_PUBLIC_SERVICE'
  when provider_type = 'APPLICATION_PORTAL' then 'TECHNOLOGY_DELIVERY'
  else 'OTHER_SERVICES'
end
where sector_code is null;

alter table public.route_providers alter column sector_code set not null;
alter table public.route_providers alter column sector_code set default 'OTHER_SERVICES';

alter table public.route_providers drop constraint if exists route_providers_type_check;
alter table public.route_providers add constraint route_providers_type_check check (
  provider_type = any (array[
    'UNIVERSITY','TVET','SETA','LEARNERSHIP_PROVIDER','BURSARY_PROVIDER',
    'ACCOMMODATION_PROVIDER','EMPLOYER','PRIVATE_COLLEGE','APPLICATION_PORTAL',
    'GOVERNMENT_AUTHORITY','QUALITY_AUTHORITY','GOVERNMENT_DEPARTMENT',
    'MUNICIPALITY','PUBLIC_ENTITY','REGULATOR','HEALTH_AUTHORITY',
    'HEALTH_FACILITY','COMPANY_REGISTRAR','NONPROFIT_ORGANISATION',
    'FINANCIAL_INSTITUTION','SOCIAL_HOUSING_PROVIDER','LEGAL_AID_PROVIDER',
    'COMMUNITY_SERVICE_PROVIDER','TECHNOLOGY_VENDOR','OTHER_SERVICE_PROVIDER'
  ]::text[])
);

alter table public.route_providers add constraint route_providers_sector_code_check
  check (sector_code = any (array[
    'GOVERNMENT_PUBLIC_SERVICE','PUBLIC_ENTITIES','EDUCATION_SKILLS','HEALTH_CARE',
    'EMPLOYMENT_ENTERPRISE','FUNDING_SOCIAL_SUPPORT','FINANCE_INSURANCE',
    'HOUSING_ACCOMMODATION','COMMUNITY_ESSENTIAL_SERVICES','TECHNOLOGY_DELIVERY',
    'OTHER_SERVICES'
  ]::text[]));

create index if not exists route_providers_sector_type_status_idx
  on public.route_providers (sector_code, provider_type, verification_status);
create index if not exists route_providers_parent_provider_idx
  on public.route_providers (parent_provider_id) where parent_provider_id is not null;
create index if not exists route_providers_alias_keys_gin_idx
  on public.route_providers using gin (alias_keys);
create index if not exists route_providers_capabilities_gin_idx
  on public.route_providers using gin (capabilities);

commit;
