-- Verified official DBE employment opportunity batch.
-- Source checked 2026-10-31 16:59:30 SAST. Deadline is date-only; no closing time is invented.
-- The import is idempotent, leaves candidate matching untouched, and requires fresh source evidence.
BEGIN;

ALTER TABLE public.opportunity_deadlines
  ADD COLUMN IF NOT EXISTS closes_on date;

INSERT INTO public.opportunity_providers
 (provider_ref,provider_name,provider_type,sector,province,official_url,accreditation_status,source_confidence,safe_to_recommend,evidence_refs)
VALUES
 ('dbe-basic-education','Department of Basic Education','GOVERNMENT_DEPARTMENT','EMPLOYMENT','Gauteng',
  'https://www.education.gov.za/Vacancies.aspx','NOT_APPLICABLE','OFFICIAL_VERIFIED',true,
  ARRAY['https://www.education.gov.za/Vacancies.aspx','https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241'])
ON CONFLICT (provider_ref) DO NOTHING;

INSERT INTO public.opportunity_programmes
 (programme_ref,provider_ref,programme_name,sector,location_text,opening_status,source_confidence,candidate_facing_safe,exact_link,evidence_refs)
VALUES
 ('dbe-74-2026','dbe-basic-education','Director: Public Examination — DBE/74/2026','EMPLOYMENT','Pretoria, Gauteng','OPEN','OFFICIAL_VERIFIED',true,
  'https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241',
  ARRAY['https://www.education.gov.za/Vacancies.aspx','https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241']),
 ('dbe-75-2026','dbe-basic-education','Deputy Director: Whole School Evaluation — DBE/75/2026','EMPLOYMENT','Pretoria, Gauteng','OPEN','OFFICIAL_VERIFIED',true,
  'https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241',
  ARRAY['https://www.education.gov.za/Vacancies.aspx','https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241']),
 ('dbe-76-2026','dbe-basic-education','Deputy Director — DBE/76/2026','EMPLOYMENT','Pretoria, Gauteng','OPEN','OFFICIAL_VERIFIED',true,
  'https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241',
  ARRAY['https://www.education.gov.za/Vacancies.aspx','https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241']),
 ('dbe-77-2026','dbe-basic-education','Assistant Director: Bids and Contract Administration — DBE/77/2026','EMPLOYMENT','Pretoria, Gauteng','OPEN','OFFICIAL_VERIFIED',true,
  'https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241',
  ARRAY['https://www.education.gov.za/Vacancies.aspx','https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241']),
 ('dbe-78-2026','dbe-basic-education','Senior Secretary — DBE/78/2026','EMPLOYMENT','Pretoria, Gauteng','OPEN','OFFICIAL_VERIFIED',true,
  'https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241',
  ARRAY['https://www.education.gov.za/Vacancies.aspx','https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241']),
 ('dbe-79-2026','dbe-basic-education','Senior Administration Clerk — DBE/79/2026','EMPLOYMENT','Pretoria, Gauteng','OPEN','OFFICIAL_VERIFIED',true,
  'https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241',
  ARRAY['https://www.education.gov.za/Vacancies.aspx','https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241'])
ON CONFLICT (programme_ref) DO NOTHING;

INSERT INTO public.opportunity_deadlines
 (deadline_ref,programme_ref,provider_ref,deadline_type,opens_at,closes_at,closes_on,deadline_status,source_confidence,timezone,evidence_refs)
VALUES
 ('dbe-74-2026-close','dbe-74-2026','dbe-basic-education','APPLICATION_CLOSE',NULL,NULL,DATE '2026-11-06','CONFIRMED','OFFICIAL_VERIFIED','Africa/Johannesburg',ARRAY['https://www.education.gov.za/Vacancies.aspx','https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241']),
 ('dbe-75-2026-close','dbe-75-2026','dbe-basic-education','APPLICATION_CLOSE',NULL,NULL,DATE '2026-11-06','CONFIRMED','OFFICIAL_VERIFIED','Africa/Johannesburg',ARRAY['https://www.education.gov.za/Vacancies.aspx','https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241']),
 ('dbe-76-2026-close','dbe-76-2026','dbe-basic-education','APPLICATION_CLOSE',NULL,NULL,DATE '2026-11-06','CONFIRMED','OFFICIAL_VERIFIED','Africa/Johannesburg',ARRAY['https://www.education.gov.za/Vacancies.aspx','https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241']),
 ('dbe-77-2026-close','dbe-77-2026','dbe-basic-education','APPLICATION_CLOSE',NULL,NULL,DATE '2026-11-06','CONFIRMED','OFFICIAL_VERIFIED','Africa/Johannesburg',ARRAY['https://www.education.gov.za/Vacancies.aspx','https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241']),
 ('dbe-78-2026-close','dbe-78-2026','dbe-basic-education','APPLICATION_CLOSE',NULL,NULL,DATE '2026-11-06','CONFIRMED','OFFICIAL_VERIFIED','Africa/Johannesburg',ARRAY['https://www.education.gov.za/Vacancies.aspx','https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241']),
 ('dbe-79-2026-close','dbe-79-2026','dbe-basic-education','APPLICATION_CLOSE',NULL,NULL,DATE '2026-11-06','CONFIRMED','OFFICIAL_VERIFIED','Africa/Johannesburg',ARRAY['https://www.education.gov.za/Vacancies.aspx','https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241'])
ON CONFLICT (deadline_ref) DO NOTHING;

-- Snapshot the evidence as verified only until 24 hours after the recorded check.
INSERT INTO public.external_source_observations
 (observation_ref,authority_ref,source_url,source_title,sector,observed_claim,source_confidence,observation_status,observed_at,valid_until,stale_after,last_checked_at,evidence_refs,review_reason)
VALUES
 ('dbe-vacancies-2026-11-06','dbe-basic-education',
  'https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241',
  'Department of Basic Education — vacancies closing 6 November 2026','EMPLOYMENT',
  'Official DBE vacancy advert lists DBE/74/2026 through DBE/79/2026 with a closing date of 6 November 2026. The advert specifies application by email in PDF format, post, or hand delivery. No exact closing time is stated.',
  'OFFICIAL_VERIFIED','VERIFIED',TIMESTAMPTZ '2026-10-31 16:59:30+02',NULL,
  TIMESTAMPTZ '2026-11-01 16:59:30+02',TIMESTAMPTZ '2026-10-31 16:59:30+02',
  ARRAY['https://www.education.gov.za/Vacancies.aspx','https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241'],
  'Recheck the official page and advert after the 24-hour freshness window. Eligibility is not inferred; no candidate matches are created.')
ON CONFLICT (observation_ref) DO UPDATE SET
 source_url=EXCLUDED.source_url,source_title=EXCLUDED.source_title,sector=EXCLUDED.sector,
 observed_claim=EXCLUDED.observed_claim,source_confidence=EXCLUDED.source_confidence,
 observation_status=EXCLUDED.observation_status,observed_at=EXCLUDED.observed_at,
 stale_after=EXCLUDED.stale_after,last_checked_at=EXCLUDED.last_checked_at,
 evidence_refs=EXCLUDED.evidence_refs,review_reason=EXCLUDED.review_reason
WHERE public.external_source_observations.source_url=EXCLUDED.source_url;

DO $postflight$
BEGIN
 IF (SELECT count(*) FROM public.opportunity_programmes WHERE programme_ref IN ('dbe-74-2026','dbe-75-2026','dbe-76-2026','dbe-77-2026','dbe-78-2026','dbe-79-2026'))<>6
 THEN RAISE EXCEPTION 'N15_DBE_PROGRAMME_POSTFLIGHT_FAILED'; END IF;
 IF (SELECT count(*) FROM public.opportunity_deadlines WHERE deadline_ref IN ('dbe-74-2026-close','dbe-75-2026-close','dbe-76-2026-close','dbe-77-2026-close','dbe-78-2026-close','dbe-79-2026-close') AND closes_on=DATE '2026-11-06' AND closes_at IS NULL AND deadline_status='CONFIRMED')<>6
 THEN RAISE EXCEPTION 'N15_DBE_DATE_ONLY_DEADLINE_POSTFLIGHT_FAILED'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.external_source_observations WHERE observation_ref='dbe-vacancies-2026-11-06' AND observation_status='VERIFIED' AND source_confidence='OFFICIAL_VERIFIED')
 THEN RAISE EXCEPTION 'N15_DBE_SOURCE_OBSERVATION_POSTFLIGHT_FAILED'; END IF;
 IF EXISTS (SELECT 1 FROM public.candidate_opportunity_matches WHERE programme_ref IN ('dbe-74-2026','dbe-75-2026','dbe-76-2026','dbe-77-2026','dbe-78-2026','dbe-79-2026'))
 THEN RAISE EXCEPTION 'N15_DBE_IMPORT_MUST_NOT_CREATE_CANDIDATE_MATCHES'; END IF;
END
$postflight$;
COMMIT;
