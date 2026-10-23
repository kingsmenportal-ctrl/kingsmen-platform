-- N15 bridge: reuse the already curated source-authority catalogue without
-- promoting its records into claims that any specific opportunity is open.
insert into public.opportunity_source_authorities
  (authority_ref, authority_name, authority_type, base_url, sector_scope,
   confidence_band, active, notes)
select
  sa.source_key,
  sa.source_name,
  sa.source_type,
  sa.base_url,
  case
    when lower(sa.source_key) like '%nsfas%' or lower(sa.source_type) like '%funding%'
      then array['NSFAS','BURSARY']::text[]
    when lower(sa.source_key) like '%cao%' or lower(sa.source_type) like '%application_portal%'
      then array['CAO','UNIVERSITY','TVET']::text[]
    when lower(sa.source_type) like '%seta%'
      then array['SETA','LEARNERSHIP','APPRENTICESHIP']::text[]
    when lower(sa.source_key) like '%vacanc%' or lower(sa.source_key) like '%jobs%'
      or lower(sa.source_type) like '%employment%'
      then array['EMPLOYER','INTERNSHIP','APPRENTICESHIP','LEARNERSHIP']::text[]
    when lower(sa.source_type) like '%qualification%' or lower(sa.source_type) like '%quality_authority%'
      then array['QCTO','PRIVATE_COLLEGE','LEARNERSHIP']::text[]
    when lower(sa.source_type) like '%university%' or lower(sa.source_type) like '%education%'
      then array['UNIVERSITY','TVET','PRIVATE_COLLEGE']::text[]
    else array['UNIVERSITY','TVET','SETA','QCTO','LEARNERSHIP','APPRENTICESHIP',
                'BURSARY','ACCOMMODATION','EMPLOYER','INTERNSHIP','NSFAS','CAO',
                'PRIVATE_COLLEGE']::text[]
  end,
  'HIGH',
  true,
  'Registry anchor bridged from public.source_authorities. This confirms only the curated source directory entry; it is not proof of an open opportunity, deadline, eligibility, accreditation, or outcome. Each claim requires separate dated evidence and review. Source verification required: '
    || sa.verification_required::text
from public.source_authorities sa
where sa.base_url is not null
  and sa.base_url like 'https://%'
on conflict (authority_ref) do update set
  authority_name = excluded.authority_name,
  authority_type = excluded.authority_type,
  base_url = excluded.base_url,
  sector_scope = excluded.sector_scope,
  confidence_band = case
    when public.opportunity_source_authorities.confidence_band = 'OFFICIAL_VERIFIED'
      then public.opportunity_source_authorities.confidence_band
    else 'HIGH'
  end,
  active = true,
  notes = excluded.notes,
  updated_at = now();
