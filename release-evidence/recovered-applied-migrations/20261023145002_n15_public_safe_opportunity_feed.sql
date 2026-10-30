-- Public-safe N15 feed contract and candidate-facing read access.
-- The view exposes only vetted opportunity/provider metadata, never candidate data.
begin;
create or replace view public.current_verified_route_opportunities
with (security_invoker = true)
as
select
  p.id as programme_id,
  p.programme_key,
  p.programme_name,
  p.route_type,
  p.qualification_type,
  p.province,
  p.delivery_mode,
  p.application_method,
  p.source_url,
  p.eligibility_summary,
  p.availability_status,
  p.updated_at as last_verified_record_update,
  v.id as provider_id,
  v.provider_key,
  v.provider_name,
  v.provider_type,
  v.base_url as provider_url,
  v.verification_status as provider_verification_status,
  p.source_confidence_band
from public.route_programmes p
join public.route_providers v on v.id = p.provider_id
where p.route_status = 'VERIFIED'
  and p.availability_status = 'OPEN'
  and p.source_confidence_band in ('A','B','HIGH','OFFICIAL_VERIFIED')
  and p.source_url ~ '^https://'
  and p.updated_at >= now() - interval '90 days'
  and v.verification_status = 'VERIFIED'
  and v.public_safe = true
  and (
    not v.private_provider_requires_accreditation_check
    or v.metadata @> '{"accreditation_verified": true}'::jsonb
  )
  and not exists (
    select 1 from public.route_deadlines d
    where d.programme_id = p.id
      and d.verification_status = 'VERIFIED'
      and d.deadline_date < (now() at time zone 'Africa/Johannesburg')::date
  );
revoke all on public.current_verified_route_opportunities from public;
grant select on public.current_verified_route_opportunities to anon, authenticated, service_role;
comment on view public.current_verified_route_opportunities is
'Public-safe read model of verified, fresh, open HTTPS opportunities only; no candidate data, guarantees, or provider-confirmed outcome claims.';
commit;
