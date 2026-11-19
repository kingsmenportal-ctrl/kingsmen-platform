-- Seed only currently-open employment adverts observed on the official Department of Employment and Labour vacancy list on 2026-10-23.
-- Do not infer eligibility or application outcome; each advert still requires the candidate to review its official details.
WITH source AS (
  SELECT id FROM public.source_authorities WHERE source_key = 'labour_vacancies'
), provider AS (
  INSERT INTO public.route_providers (
    provider_key, provider_name, provider_type, base_url, source_authority_id,
    default_confidence_band, verification_status, public_safe, notes, metadata
  )
  SELECT
    'labour_department_vacancies',
    'Department of Employment and Labour — Official Vacancies',
    'GOVERNMENT_AUTHORITY',
    'https://www.labour.gov.za/vacancies/Pages/Vacancies-List.aspx',
    source.id, 'A', 'VERIFIED', true,
    'Official Department of Employment and Labour vacancy listing. Verify each advert details and closing date before applying.',
    jsonb_build_object('last_listing_check','2026-10-23','evidence_url','https://www.labour.gov.za/vacancies/Pages/Vacancies-List.aspx?PageFirstRow=31&Paged=TRUE&PagedPrev=TRUE&View=%7BF01EEABA-46DC-4830-90E3-2E7A96B86015%7D&p_Created=20250711+15%3A39%3A14&p_ID=2370')
  FROM source
  ON CONFLICT (provider_key) DO UPDATE SET
    provider_name=EXCLUDED.provider_name,
    base_url=EXCLUDED.base_url,
    source_authority_id=EXCLUDED.source_authority_id,
    default_confidence_band='A',
    verification_status='VERIFIED',
    public_safe=true,
    notes=EXCLUDED.notes,
    metadata=EXCLUDED.metadata,
    updated_at=now()
  RETURNING id
)
INSERT INTO public.route_programmes (
  provider_id, programme_key, programme_name, route_type, qualification_type,
  province, delivery_mode, application_method, source_url, source_confidence_band,
  route_status, availability_status, eligibility_summary, metadata, updated_at
)
SELECT provider.id, v.programme_key, v.programme_name, 'EMPLOYER', NULL,
       NULL, 'UNKNOWN', 'MANUAL',
       'https://www.labour.gov.za/vacancies/Pages/Vacancies-List.aspx?PageFirstRow=31&Paged=TRUE&PagedPrev=TRUE&View=%7BF01EEABA-46DC-4830-90E3-2E7A96B86015%7D&p_Created=20250711+15%3A39%3A14&p_ID=2370',
       'A', 'VERIFIED', 'OPEN',
       'Official listing showed this reference as Open with closing date 30 October 2026. Review the official advert for qualifications, eligibility, required documents and exact submission method.',
       jsonb_build_object(
         'reference_no',v.reference_no,
         'closing_date','2026-10-30',
         'last_source_checked_at','2026-10-23T13:45:00Z',
         'source_authority','South African Department of Employment and Labour',
         'source_evidence','Official vacancy list reported status Open and closing date 30 October 2026.',
         'verification_scope','Listing status and closing date only; individual eligibility requirements must be checked in the advert.',
         'source_url','https://www.labour.gov.za/vacancies/Pages/Vacancies-List.aspx?PageFirstRow=31&Paged=TRUE&PagedPrev=TRUE&View=%7BF01EEABA-46DC-4830-90E3-2E7A96B86015%7D&p_Created=20250711+15%3A39%3A14&p_ID=2370'
       ), now()
FROM provider
CROSS JOIN (VALUES
  ('labour_hr4_4_8_194_2026','Client Service Officer: Public Employment Services','HR4/4/8/194'),
  ('labour_hr4_4_8_190_2026','BCEA Inspector (X4 Posts)','HR 4/4/8/190'),
  ('labour_hr4_4_9_29_2026','Administration Officer: Employer Service','HR4/4/9/29'),
  ('labour_hr4_26_10_02ho_2026','Senior State Accountant: Financial Reporting','HR4/26/10/02HO'),
  ('labour_hr4_4_8_192_2026','BCEA Inspector','HR4/4/8/192'),
  ('labour_hr4_4_8_193_2026','Assistant Director: Labour Activation Programme','HR4/4/8/193')
) AS v(programme_key,programme_name,reference_no)
ON CONFLICT (programme_key) DO UPDATE SET
  provider_id=EXCLUDED.provider_id,
  programme_name=EXCLUDED.programme_name,
  source_url=EXCLUDED.source_url,
  source_confidence_band='A',
  route_status='VERIFIED',
  availability_status='OPEN',
  eligibility_summary=EXCLUDED.eligibility_summary,
  metadata=EXCLUDED.metadata,
  updated_at=now();

UPDATE public.source_authorities
SET last_verified_at=now(),
    verification_notes='Official Department of Employment and Labour vacancy listing checked 2026-10-23. Only explicitly listed open adverts with closing date 2026-10-30 were seeded; each candidate must check the official advert for detailed requirements.',
    updated_at=now()
WHERE source_key='labour_vacancies';
