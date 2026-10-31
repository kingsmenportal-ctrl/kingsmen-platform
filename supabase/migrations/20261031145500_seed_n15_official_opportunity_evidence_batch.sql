-- N15 official opportunity evidence batch observed on 2026-10-31.
-- Prepared for independent review only. Do not apply until protected encrypted backup,
-- isolated restore validation, independent review and formal change approval are complete.
-- Current listings are source-verified; eligibility and submission outcomes remain separate.
BEGIN;

DO $preflight$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.backup_restore_drills
    WHERE drill_type='database_backup' AND status='passed'
      AND last_tested_at >= now() - interval '7 days'
      AND evidence_ref IS NOT NULL AND metadata @> '{"encrypted":true}'::jsonb
  ) THEN
    RAISE EXCEPTION 'N15_OFFICIAL_EVIDENCE_IMPORT_BLOCKED: recent encrypted database backup evidence missing';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.backup_restore_drills
    WHERE drill_type='database_restore' AND status='passed'
      AND last_tested_at >= now() - interval '7 days'
      AND evidence_ref IS NOT NULL AND metadata @> '{"restore_isolated":true}'::jsonb
  ) THEN
    RAISE EXCEPTION 'N15_OFFICIAL_EVIDENCE_IMPORT_BLOCKED: recent isolated restore evidence missing';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.opportunity_providers p
    JOIN (VALUES
      ('ndoh','National Department of Health','https://www.health.gov.za/vacancies/'),
      ('dbe','Department of Basic Education','https://www.education.gov.za/Vacancies.aspx'),
      ('nwpg_victor_thebe_sifora_bursary','North West Provincial Government — Victor Thebe Sifora Provincial Bursary Scheme','https://bursaries.nwpg.gov.za/'),
      ('delabour','Department of Employment and Labour','https://www.labour.gov.za/Vacancies/Pages/Vacancies-List.aspx')
    ) AS s(provider_ref,provider_name,official_url) USING(provider_ref)
    WHERE p.provider_name IS DISTINCT FROM s.provider_name OR p.official_url IS DISTINCT FROM s.official_url
  ) THEN RAISE EXCEPTION 'N15_OFFICIAL_EVIDENCE_PROVIDER_IDENTITY_CONFLICT'; END IF;

  IF EXISTS (
    SELECT 1 FROM public.opportunity_programmes p
    JOIN (VALUES
      ('ndoh_forensic_mental_health_ndoh_82_2026','Director: Forensic Mental Health (12 Months Contract Post) — NDOH 82/2026','https://www.health.gov.za/wp-content/uploads/2026/10/Director.-Forensic-Mental-Health-contract-post.pdf'),
      ('ndoh_secretary_hospital_facilities_ndoh_87_2026','Secretary — Hospital Facilities Planning, NDOH 87/2026','https://www.health.gov.za/wp-content/uploads/2026/10/Secretary.-Hospital-Facilities-Planning.pdf'),
      ('dbe_public_examinations_dbe_74_2026','Director: Public Examination — DBE/74/2026','https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241'),
      ('dbe_whole_school_evaluation_dbe_75_2026','Deputy Director: Whole School Evaluation — DBE/75/2026','https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241'),
      ('dbe_health_promotion_dbe_76_2026','Deputy Director: Health Promotion — DBE/76/2026','https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241'),
      ('dbe_bids_contract_admin_dbe_77_2026','Assistant Director: Bids and Contract Administration — DBE/77/2026','https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241'),
      ('dbe_senior_secretary_dbe_78_2026','Senior Secretary — DBE/78/2026','https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241'),
      ('dbe_senior_admin_clerk_dbe_79_2026','Senior Administration Clerk — DBE/79/2026','https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241'),
      ('nwpg_victor_thebe_sifora_bursary_2027','Victor Thebe Sifora Provincial Bursary Scheme — 2027 Intake','https://bursaries.nwpg.gov.za/'),
      ('delabour_office_aid_phalaborwa_hr4_4_6_47','Office Aid — Phalaborwa Labour Centre, HR4/4/6/47','https://www.labour.gov.za/office-aid-%28x3-posts%29-%282%29'),
      ('delabour_office_aid_lebowakgomo_hr4_4_6_48','Office Aid — Lebowakgomo Labour Centre, HR4/4/6/48','https://www.labour.gov.za/office-aid-%28x3-posts%29-%282%29'),
      ('delabour_office_aid_carletonville_hr4_4_4_09_48','Office Aid — Carletonville Labour Centre, HR4/4/4/09/48','https://www.labour.gov.za/office-aid-%28x3-posts%29-%282%29'),
      ('delabour_registry_clerk_uif_hr4_4_9_28','Registry Clerk (UIF), HR4/4/9/28','https://www.labour.gov.za/registry-clerk-%28uif%29'),
      ('delabour_inspector_ies_hr4_4_4_08_03','Inspector: IES, HR4/4/4/08/03','https://www.labour.gov.za/inspector-ies-%283%29')
    ) AS s(programme_ref,programme_name,exact_link) USING(programme_ref)
    WHERE p.programme_name IS DISTINCT FROM s.programme_name OR p.exact_link IS DISTINCT FROM s.exact_link
  ) THEN RAISE EXCEPTION 'N15_OFFICIAL_EVIDENCE_PROGRAMME_IDENTITY_CONFLICT'; END IF;
END
$preflight$;

INSERT INTO public.opportunity_providers
(provider_ref,provider_name,provider_type,sector,province,official_url,accreditation_status,source_confidence,safe_to_recommend,evidence_refs)
VALUES
('ndoh','National Department of Health','GOVERNMENT_DEPARTMENT','EMPLOYMENT',NULL,'https://www.health.gov.za/vacancies/','NOT_APPLICABLE','OFFICIAL_VERIFIED',true,ARRAY['https://www.health.gov.za/vacancies/']),
('dbe','Department of Basic Education','GOVERNMENT_DEPARTMENT','EMPLOYMENT',NULL,'https://www.education.gov.za/Vacancies.aspx','NOT_APPLICABLE','OFFICIAL_VERIFIED',true,ARRAY['https://www.education.gov.za/Vacancies.aspx','https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241']),
('nwpg_victor_thebe_sifora_bursary','North West Provincial Government — Victor Thebe Sifora Provincial Bursary Scheme','PROVINCIAL_GOVERNMENT','BURSARY','North West','https://bursaries.nwpg.gov.za/','NOT_APPLICABLE','OFFICIAL_VERIFIED',true,ARRAY['https://bursaries.nwpg.gov.za/']),
('delabour','Department of Employment and Labour','GOVERNMENT_DEPARTMENT','EMPLOYMENT',NULL,'https://www.labour.gov.za/Vacancies/Pages/Vacancies-List.aspx','NOT_APPLICABLE','OFFICIAL_VERIFIED',true,ARRAY['https://www.labour.gov.za/Vacancies/Pages/Vacancies-List.aspx'])
ON CONFLICT(provider_ref) DO UPDATE SET
 provider_type=EXCLUDED.provider_type,sector=EXCLUDED.sector,province=EXCLUDED.province,
 accreditation_status=EXCLUDED.accreditation_status,source_confidence=EXCLUDED.source_confidence,
 safe_to_recommend=EXCLUDED.safe_to_recommend,evidence_refs=EXCLUDED.evidence_refs,updated_at=now()
WHERE public.opportunity_providers.provider_name=EXCLUDED.provider_name
  AND public.opportunity_providers.official_url IS NOT DISTINCT FROM EXCLUDED.official_url;

INSERT INTO public.opportunity_programmes
(programme_ref,provider_ref,programme_name,sector,location_text,opening_status,source_confidence,candidate_facing_safe,exact_link,evidence_refs)
VALUES
('ndoh_forensic_mental_health_ndoh_82_2026','ndoh','Director: Forensic Mental Health (12 Months Contract Post) — NDOH 82/2026','EMPLOYMENT','Pretoria','OPEN','OFFICIAL_VERIFIED',true,'https://www.health.gov.za/wp-content/uploads/2026/10/Director.-Forensic-Mental-Health-contract-post.pdf',ARRAY['https://www.health.gov.za/vacancies/','https://www.health.gov.za/wp-content/uploads/2026/10/Director.-Forensic-Mental-Health-contract-post.pdf']),
('ndoh_secretary_hospital_facilities_ndoh_87_2026','ndoh','Secretary — Hospital Facilities Planning, NDOH 87/2026','EMPLOYMENT','Pretoria','OPEN','OFFICIAL_VERIFIED',true,'https://www.health.gov.za/wp-content/uploads/2026/10/Secretary.-Hospital-Facilities-Planning.pdf',ARRAY['https://www.health.gov.za/vacancies/','https://www.health.gov.za/wp-content/uploads/2026/10/Secretary.-Hospital-Facilities-Planning.pdf']),
('dbe_public_examinations_dbe_74_2026','dbe','Director: Public Examination — DBE/74/2026','EMPLOYMENT','Pretoria','OPEN','OFFICIAL_VERIFIED',true,'https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241',ARRAY['https://www.education.gov.za/Vacancies.aspx','https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241']),
('dbe_whole_school_evaluation_dbe_75_2026','dbe','Deputy Director: Whole School Evaluation — DBE/75/2026','EMPLOYMENT','Pretoria','OPEN','OFFICIAL_VERIFIED',true,'https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241',ARRAY['https://www.education.gov.za/Vacancies.aspx','https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241']),
('dbe_health_promotion_dbe_76_2026','dbe','Deputy Director: Health Promotion — DBE/76/2026','EMPLOYMENT','Pretoria','OPEN','OFFICIAL_VERIFIED',true,'https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241',ARRAY['https://www.education.gov.za/Vacancies.aspx','https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241']),
('dbe_bids_contract_admin_dbe_77_2026','dbe','Assistant Director: Bids and Contract Administration — DBE/77/2026','EMPLOYMENT','Pretoria','OPEN','OFFICIAL_VERIFIED',true,'https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241',ARRAY['https://www.education.gov.za/Vacancies.aspx','https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241']),
('dbe_senior_secretary_dbe_78_2026','dbe','Senior Secretary — DBE/78/2026','EMPLOYMENT','Pretoria','OPEN','OFFICIAL_VERIFIED',true,'https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241',ARRAY['https://www.education.gov.za/Vacancies.aspx','https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241']),
('dbe_senior_admin_clerk_dbe_79_2026','dbe','Senior Administration Clerk — DBE/79/2026','EMPLOYMENT','Pretoria','OPEN','OFFICIAL_VERIFIED',true,'https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241',ARRAY['https://www.education.gov.za/Vacancies.aspx','https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241']),
('nwpg_victor_thebe_sifora_bursary_2027','nwpg_victor_thebe_sifora_bursary','Victor Thebe Sifora Provincial Bursary Scheme — 2027 Intake','BURSARY','North West','OPEN','OFFICIAL_VERIFIED',true,'https://bursaries.nwpg.gov.za/',ARRAY['https://bursaries.nwpg.gov.za/']),
('delabour_office_aid_phalaborwa_hr4_4_6_47','delabour','Office Aid — Phalaborwa Labour Centre, HR4/4/6/47','EMPLOYMENT','Phalaborwa, Limpopo','OPEN','OFFICIAL_VERIFIED',true,'https://www.labour.gov.za/office-aid-%28x3-posts%29-%282%29',ARRAY['https://www.labour.gov.za/Vacancies/Pages/Vacancies-List.aspx','https://www.labour.gov.za/office-aid-%28x3-posts%29-%282%29']),
('delabour_office_aid_lebowakgomo_hr4_4_6_48','delabour','Office Aid — Lebowakgomo Labour Centre, HR4/4/6/48','EMPLOYMENT','Lebowakgomo, Limpopo','OPEN','OFFICIAL_VERIFIED',true,'https://www.labour.gov.za/office-aid-%28x3-posts%29-%282%29',ARRAY['https://www.labour.gov.za/Vacancies/Pages/Vacancies-List.aspx','https://www.labour.gov.za/office-aid-%28x3-posts%29-%282%29']),
('delabour_office_aid_carletonville_hr4_4_4_09_48','delabour','Office Aid — Carletonville Labour Centre, HR4/4/4/09/48','EMPLOYMENT','Carletonville, Gauteng','OPEN','OFFICIAL_VERIFIED',true,'https://www.labour.gov.za/office-aid-%28x3-posts%29-%282%29',ARRAY['https://www.labour.gov.za/Vacancies/Pages/Vacancies-List.aspx','https://www.labour.gov.za/office-aid-%28x3-posts%29-%282%29']),
('delabour_registry_clerk_uif_hr4_4_9_28','delabour','Registry Clerk (UIF), HR4/4/9/28','EMPLOYMENT','KwaZulu-Natal','OPEN','OFFICIAL_VERIFIED',true,'https://www.labour.gov.za/registry-clerk-%28uif%29',ARRAY['https://www.labour.gov.za/Vacancies/Pages/Vacancies-List.aspx','https://www.labour.gov.za/registry-clerk-%28uif%29']),
('delabour_inspector_ies_hr4_4_4_08_03','delabour','Inspector: IES, HR4/4/4/08/03','EMPLOYMENT','Pretoria, Gauteng','OPEN','OFFICIAL_VERIFIED',true,'https://www.labour.gov.za/inspector-ies-%283%29',ARRAY['https://www.labour.gov.za/Vacancies/Pages/Vacancies-List.aspx','https://www.labour.gov.za/inspector-ies-%283%29'])
ON CONFLICT(programme_ref) DO UPDATE SET
 programme_name=EXCLUDED.programme_name,sector=EXCLUDED.sector,location_text=EXCLUDED.location_text,
 opening_status=EXCLUDED.opening_status,source_confidence=EXCLUDED.source_confidence,
 candidate_facing_safe=EXCLUDED.candidate_facing_safe,exact_link=EXCLUDED.exact_link,
 evidence_refs=EXCLUDED.evidence_refs,updated_at=now()
WHERE public.opportunity_programmes.provider_ref=EXCLUDED.provider_ref
  AND public.opportunity_programmes.programme_name=EXCLUDED.programme_name
  AND public.opportunity_programmes.exact_link IS NOT DISTINCT FROM EXCLUDED.exact_link;

-- Source observations are intentionally short-lived; after 24 hours, a fresh
-- official-page check is required before candidate delivery can continue.
INSERT INTO public.external_source_observations
(observation_ref,authority_ref,source_url,source_title,sector,observed_claim,source_confidence,observation_status,observed_at,valid_until,stale_after,last_checked_at,evidence_refs,review_reason)
VALUES
('n15_ndoh_forensic_mental_health_2026_10_31',NULL,'https://www.health.gov.za/wp-content/uploads/2026/10/Director.-Forensic-Mental-Health-contract-post.pdf','National Department of Health vacancies — NDOH 82/2026','EMPLOYMENT','Official NDoH vacancy PDF identifies Director: Forensic Mental Health (12-month contract), ref NDOH 82/2026, with closing date 9 November 2026. Exact closing time is not stated; no time is inferred.','OFFICIAL_VERIFIED','VERIFIED','2026-10-31T14:55:00+02:00','2026-11-01T14:55:00+02:00','2026-11-01T14:55:00+02:00','2026-10-31T14:55:00+02:00',ARRAY['https://www.health.gov.za/vacancies/','https://www.health.gov.za/wp-content/uploads/2026/10/Director.-Forensic-Mental-Health-contract-post.pdf'],'Closing date is date-verified; exact cutoff time requires manual check.'),
('n15_ndoh_secretary_facilities_2026_10_31',NULL,'https://www.health.gov.za/wp-content/uploads/2026/10/Secretary.-Hospital-Facilities-Planning.pdf','National Department of Health vacancies — NDOH 87/2026','EMPLOYMENT','Official NDoH vacancy PDF identifies Secretary, Hospital Facilities Planning, ref NDOH 87/2026, with closing date 9 November 2026. Exact closing time is not stated; no time is inferred.','OFFICIAL_VERIFIED','VERIFIED','2026-10-31T14:55:00+02:00','2026-11-01T14:55:00+02:00','2026-11-01T14:55:00+02:00','2026-10-31T14:55:00+02:00',ARRAY['https://www.health.gov.za/vacancies/','https://www.health.gov.za/wp-content/uploads/2026/10/Secretary.-Hospital-Facilities-Planning.pdf'],'Closing date is date-verified; exact cutoff time requires manual check.'),
('n15_dbe_vacancy_bulletin_2026_10_31',NULL,'https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241','Department of Basic Education vacancies — DBE/74/2026 to DBE/79/2026','EMPLOYMENT','Official DBE vacancy bulletin lists six posts DBE/74/2026 through DBE/79/2026, each with closing date 6 November 2026. Exact closing time is not stated; no time is inferred.','OFFICIAL_VERIFIED','VERIFIED','2026-10-31T14:55:00+02:00','2026-11-01T14:55:00+02:00','2026-11-01T14:55:00+02:00','2026-10-31T14:55:00+02:00',ARRAY['https://www.education.gov.za/Vacancies.aspx','https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241'],'Closing date is date-verified; exact cutoff time requires manual check.'),
('n15_nwpg_bursary_2027_2026_10_31',NULL,'https://bursaries.nwpg.gov.za/','Victor Thebe Sifora Provincial Bursary Scheme — 2027 Intake','BURSARY','Official North West Provincial Government bursary portal states 2027 applications are open, opened 13 October 2026, and close 13 November 2026 at 23:59 SAST. It warns that current intake requirements may differ from the retained previous advert.','OFFICIAL_VERIFIED','VERIFIED','2026-10-31T14:55:00+02:00','2026-11-01T14:55:00+02:00','2026-11-01T14:55:00+02:00','2026-10-31T14:55:00+02:00',ARRAY['https://bursaries.nwpg.gov.za/'],'Current intake requirements remain subject to candidate-side confirmation with the bursary office.'),
('n15_delabour_office_aid_2026_10_31',NULL,'https://www.labour.gov.za/office-aid-%28x3-posts%29-%282%29','Department of Employment and Labour — Office Aid (three posts)','EMPLOYMENT','Official Department of Employment and Labour vacancy page lists three Office Aid posts at Phalaborwa (HR4/4/6/47), Lebowakgomo (HR4/4/6/48), and Carletonville (HR4/4/4/09/48). Closing date is 6 November 2026 at 16:00 for walk-in and 23:59 for online applications.','OFFICIAL_VERIFIED','VERIFIED','2026-10-31T14:55:00+02:00','2026-11-01T14:55:00+02:00','2026-11-01T14:55:00+02:00','2026-10-31T14:55:00+02:00',ARRAY['https://www.labour.gov.za/Vacancies/Pages/Vacancies-List.aspx','https://www.labour.gov.za/office-aid-%28x3-posts%29-%282%29'],'Multiple work sites and application channels have different submission instructions; candidate must follow the exact advert.'),
('n15_delabour_registry_clerk_uif_2026_10_31',NULL,'https://www.labour.gov.za/registry-clerk-%28uif%29','Department of Employment and Labour — Registry Clerk (UIF)','EMPLOYMENT','Official Department of Employment and Labour vacancy page identifies Registry Clerk (UIF), ref HR4/4/9/28, KwaZulu-Natal, and closing date 6 November 2026 at 16:00 for walk-in and 23:59 for online applications.','OFFICIAL_VERIFIED','VERIFIED','2026-10-31T14:55:00+02:00','2026-11-01T14:55:00+02:00','2026-11-01T14:55:00+02:00','2026-10-31T14:55:00+02:00',ARRAY['https://www.labour.gov.za/Vacancies/Pages/Vacancies-List.aspx','https://www.labour.gov.za/registry-clerk-%28uif%29'],'Candidate must use the current Z83 and the advert-specific application route.'),
('n15_delabour_inspector_ies_2026_10_31',NULL,'https://www.labour.gov.za/inspector-ies-%283%29','Department of Employment and Labour — Inspector: IES','EMPLOYMENT','Official Department of Employment and Labour vacancy page identifies Inspector: IES, ref HR4/4/4/08/03, Pretoria Labour Centre, and closing date 6 November 2026 at 16:00 for walk-in and 23:59 for online applications.','OFFICIAL_VERIFIED','VERIFIED','2026-10-31T14:55:00+02:00','2026-11-01T14:55:00+02:00','2026-11-01T14:55:00+02:00','2026-10-31T14:55:00+02:00',ARRAY['https://www.labour.gov.za/Vacancies/Pages/Vacancies-List.aspx','https://www.labour.gov.za/inspector-ies-%283%29'],'Candidate must use the current Z83 and the advert-specific application route.')
ON CONFLICT(observation_ref) DO UPDATE SET
 source_url=EXCLUDED.source_url,source_title=EXCLUDED.source_title,sector=EXCLUDED.sector,
 observed_claim=EXCLUDED.observed_claim,source_confidence=EXCLUDED.source_confidence,
 observation_status=EXCLUDED.observation_status,observed_at=EXCLUDED.observed_at,
 valid_until=EXCLUDED.valid_until,stale_after=EXCLUDED.stale_after,
 last_checked_at=EXCLUDED.last_checked_at,evidence_refs=EXCLUDED.evidence_refs,
 review_reason=EXCLUDED.review_reason
WHERE public.external_source_observations.source_url=EXCLUDED.source_url;

INSERT INTO public.opportunity_deadlines
(deadline_ref,programme_ref,provider_ref,deadline_type,closes_at,deadline_status,source_confidence,timezone,evidence_refs)
VALUES
('ndoh_forensic_mental_health_deadline_2026_11_09','ndoh_forensic_mental_health_ndoh_82_2026','ndoh','APPLICATION_CLOSE',NULL,'MANUAL_CHECK_REQUIRED','OFFICIAL_VERIFIED','Africa/Johannesburg',ARRAY['https://www.health.gov.za/wp-content/uploads/2026/10/Director.-Forensic-Mental-Health-contract-post.pdf']),
('ndoh_secretary_facilities_deadline_2026_11_09','ndoh_secretary_hospital_facilities_ndoh_87_2026','ndoh','APPLICATION_CLOSE',NULL,'MANUAL_CHECK_REQUIRED','OFFICIAL_VERIFIED','Africa/Johannesburg',ARRAY['https://www.health.gov.za/wp-content/uploads/2026/10/Secretary.-Hospital-Facilities-Planning.pdf']),
('dbe_public_examinations_deadline_2026_11_06','dbe_public_examinations_dbe_74_2026','dbe','APPLICATION_CLOSE',NULL,'MANUAL_CHECK_REQUIRED','OFFICIAL_VERIFIED','Africa/Johannesburg',ARRAY['https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241']),
('dbe_whole_school_evaluation_deadline_2026_11_06','dbe_whole_school_evaluation_dbe_75_2026','dbe','APPLICATION_CLOSE',NULL,'MANUAL_CHECK_REQUIRED','OFFICIAL_VERIFIED','Africa/Johannesburg',ARRAY['https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241']),
('dbe_health_promotion_deadline_2026_11_06','dbe_health_promotion_dbe_76_2026','dbe','APPLICATION_CLOSE',NULL,'MANUAL_CHECK_REQUIRED','OFFICIAL_VERIFIED','Africa/Johannesburg',ARRAY['https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241']),
('dbe_bids_contract_admin_deadline_2026_11_06','dbe_bids_contract_admin_dbe_77_2026','dbe','APPLICATION_CLOSE',NULL,'MANUAL_CHECK_REQUIRED','OFFICIAL_VERIFIED','Africa/Johannesburg',ARRAY['https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241']),
('dbe_senior_secretary_deadline_2026_11_06','dbe_senior_secretary_dbe_78_2026','dbe','APPLICATION_CLOSE',NULL,'MANUAL_CHECK_REQUIRED','OFFICIAL_VERIFIED','Africa/Johannesburg',ARRAY['https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241']),
('dbe_senior_admin_clerk_deadline_2026_11_06','dbe_senior_admin_clerk_dbe_79_2026','dbe','APPLICATION_CLOSE',NULL,'MANUAL_CHECK_REQUIRED','OFFICIAL_VERIFIED','Africa/Johannesburg',ARRAY['https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241']),
('nwpg_victor_thebe_sifora_bursary_deadline_2026_11_13','nwpg_victor_thebe_sifora_bursary_2027','nwpg_victor_thebe_sifora_bursary','APPLICATION_CLOSE','2026-11-13T23:59:00+02:00','CONFIRMED','OFFICIAL_VERIFIED','Africa/Johannesburg',ARRAY['https://bursaries.nwpg.gov.za/']),
('delabour_office_aid_phalaborwa_deadline_2026_11_06','delabour_office_aid_phalaborwa_hr4_4_6_47','delabour','APPLICATION_CLOSE_CHANNEL_DEPENDENT',NULL,'MANUAL_CHECK_REQUIRED','OFFICIAL_VERIFIED','Africa/Johannesburg',ARRAY['https://www.labour.gov.za/office-aid-%28x3-posts%29-%282%29']),
('delabour_office_aid_lebowakgomo_deadline_2026_11_06','delabour_office_aid_lebowakgomo_hr4_4_6_48','delabour','APPLICATION_CLOSE_CHANNEL_DEPENDENT',NULL,'MANUAL_CHECK_REQUIRED','OFFICIAL_VERIFIED','Africa/Johannesburg',ARRAY['https://www.labour.gov.za/office-aid-%28x3-posts%29-%282%29']),
('delabour_office_aid_carletonville_deadline_2026_11_06','delabour_office_aid_carletonville_hr4_4_4_09_48','delabour','APPLICATION_CLOSE_CHANNEL_DEPENDENT',NULL,'MANUAL_CHECK_REQUIRED','OFFICIAL_VERIFIED','Africa/Johannesburg',ARRAY['https://www.labour.gov.za/office-aid-%28x3-posts%29-%282%29']),
('delabour_registry_clerk_uif_deadline_2026_11_06','delabour_registry_clerk_uif_hr4_4_9_28','delabour','APPLICATION_CLOSE_CHANNEL_DEPENDENT',NULL,'MANUAL_CHECK_REQUIRED','OFFICIAL_VERIFIED','Africa/Johannesburg',ARRAY['https://www.labour.gov.za/registry-clerk-%28uif%29']),
('delabour_inspector_ies_deadline_2026_11_06','delabour_inspector_ies_hr4_4_4_08_03','delabour','APPLICATION_CLOSE_CHANNEL_DEPENDENT',NULL,'MANUAL_CHECK_REQUIRED','OFFICIAL_VERIFIED','Africa/Johannesburg',ARRAY['https://www.labour.gov.za/inspector-ies-%283%29'])
ON CONFLICT(deadline_ref) DO UPDATE SET
 programme_ref=EXCLUDED.programme_ref,provider_ref=EXCLUDED.provider_ref,
 deadline_type=EXCLUDED.deadline_type,opens_at=EXCLUDED.opens_at,closes_at=EXCLUDED.closes_at,
 deadline_status=EXCLUDED.deadline_status,source_confidence=EXCLUDED.source_confidence,
 timezone=EXCLUDED.timezone,evidence_refs=EXCLUDED.evidence_refs
WHERE public.opportunity_deadlines.programme_ref IS NOT DISTINCT FROM EXCLUDED.programme_ref
  AND public.opportunity_deadlines.provider_ref IS NOT DISTINCT FROM EXCLUDED.provider_ref;

DO $postflight$
BEGIN
  IF (SELECT count(*) FROM public.opportunity_providers WHERE provider_ref IN ('ndoh','dbe','nwpg_victor_thebe_sifora_bursary','delabour'))<>4
  THEN RAISE EXCEPTION 'N15_OFFICIAL_EVIDENCE_PROVIDER_POSTFLIGHT_FAILED'; END IF;
  IF (SELECT count(*) FROM public.opportunity_programmes WHERE programme_ref IN (
    'ndoh_forensic_mental_health_ndoh_82_2026','ndoh_secretary_hospital_facilities_ndoh_87_2026',
    'dbe_public_examinations_dbe_74_2026','dbe_whole_school_evaluation_dbe_75_2026',
    'dbe_health_promotion_dbe_76_2026','dbe_bids_contract_admin_dbe_77_2026',
    'dbe_senior_secretary_dbe_78_2026','dbe_senior_admin_clerk_dbe_79_2026',
    'nwpg_victor_thebe_sifora_bursary_2027','delabour_office_aid_phalaborwa_hr4_4_6_47',
    'delabour_office_aid_lebowakgomo_hr4_4_6_48','delabour_office_aid_carletonville_hr4_4_4_09_48',
    'delabour_registry_clerk_uif_hr4_4_9_28','delabour_inspector_ies_hr4_4_4_08_03'))<>14
  THEN RAISE EXCEPTION 'N15_OFFICIAL_EVIDENCE_PROGRAMME_POSTFLIGHT_FAILED'; END IF;
  IF (SELECT count(*) FROM public.external_source_observations WHERE observation_ref IN (
    'n15_ndoh_forensic_mental_health_2026_10_31','n15_ndoh_secretary_facilities_2026_10_31',
    'n15_dbe_vacancy_bulletin_2026_10_31','n15_nwpg_bursary_2027_2026_10_31',
    'n15_delabour_office_aid_2026_10_31','n15_delabour_registry_clerk_uif_2026_10_31',
    'n15_delabour_inspector_ies_2026_10_31'))<>7
  THEN RAISE EXCEPTION 'N15_OFFICIAL_EVIDENCE_OBSERVATION_POSTFLIGHT_FAILED'; END IF;
  IF EXISTS (SELECT 1 FROM public.opportunity_programmes WHERE programme_ref IN (
    'ndoh_forensic_mental_health_ndoh_82_2026','ndoh_secretary_hospital_facilities_ndoh_87_2026',
    'dbe_public_examinations_dbe_74_2026','dbe_whole_school_evaluation_dbe_75_2026',
    'dbe_health_promotion_dbe_76_2026','dbe_bids_contract_admin_dbe_77_2026',
    'dbe_senior_secretary_dbe_78_2026','dbe_senior_admin_clerk_dbe_79_2026',
    'nwpg_victor_thebe_sifora_bursary_2027','delabour_office_aid_phalaborwa_hr4_4_6_47',
    'delabour_office_aid_lebowakgomo_hr4_4_6_48','delabour_office_aid_carletonville_hr4_4_4_09_48',
    'delabour_registry_clerk_uif_hr4_4_9_28','delabour_inspector_ies_hr4_4_4_08_03')
    AND (opening_status<>'OPEN' OR source_confidence<>'OFFICIAL_VERIFIED' OR candidate_facing_safe IS NOT TRUE
      OR exact_link IS NULL OR cardinality(evidence_refs)=0))
  THEN RAISE EXCEPTION 'N15_OFFICIAL_EVIDENCE_PROGRAMME_SAFETY_POSTFLIGHT_FAILED'; END IF;
  -- Candidate-specific matches are intentionally not created by a source import.
END
$postflight$;
COMMIT;
