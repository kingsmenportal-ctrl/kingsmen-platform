-- Expand official South African opportunity source discovery anchors.
-- Authority records are not live listings; each programme/deadline remains separately verified.
INSERT INTO public.source_authorities (
  source_key, source_name, source_type, base_url, default_confidence_band,
  verification_required, verification_notes
)
VALUES
  ('govza_government_jobs', 'South African Government Jobs and Learnerships', 'government_jobs_directory', 'https://www.gov.za/about-government/government-jobs', 'A', true, 'Official government directory for departmental vacancies, learnerships, and youth employment initiatives; verify each advert and deadline at its issuing department.'),
  ('labour_vacancies', 'Department of Employment and Labour Vacancies', 'government_employment', 'https://www.labour.gov.za/vacancies/Pages/Vacancies-List.aspx', 'A', true, 'Official department vacancy list. A listing is not an application outcome; recheck the advert and closing date before presenting it as open.'),
  ('etdp_seta_official', 'Education Training and Development Practices SETA', 'seta', 'https://www.etdpseta.org.za/', 'A', true, 'Official ETDP SETA source anchor. Programme availability, eligibility, provider accreditation, and closing dates require per-programme verification.'),
  ('services_seta_official', 'Services SETA', 'seta', 'https://www.serviceseta.org.za/', 'A', true, 'Official Services SETA source anchor for skills programmes, learnerships, internships and funding notices; verify each programme separately.'),
  ('merseta_official', 'Manufacturing, Engineering and Related Services SETA', 'seta', 'https://www.merseta.org.za/', 'A', true, 'Official merSETA source anchor. This record does not assert an open learnership or apprenticeship.'),
  ('ewseta_official', 'Energy and Water Sector Education and Training Authority', 'seta', 'https://ewseta.org.za/', 'A', true, 'Official EWSETA source anchor. Verify the individual programme and its live status before candidate-facing publication.'),
  ('agriseta_official', 'Agricultural Sector Education and Training Authority', 'seta', 'https://www.agriseta.co.za/', 'A', true, 'Official AgriSETA source anchor. Do not infer active opportunities from the authority record alone.'),
  ('bankseta_official', 'Banking Sector Education and Training Authority', 'seta', 'https://www.bankseta.org.za/', 'A', true, 'Official BANKSETA source anchor. Programme and deadline evidence must be captured per listing.'),
  ('teta_official', 'Transport Education Training Authority', 'seta', 'https://www.teta.org.za/', 'A', true, 'Official TETA source anchor. No vacancy or training intake is implied by this record.'),
  ('foodbev_seta_official', 'Food and Beverage Manufacturing SETA', 'seta', 'https://www.foodbev.co.za/', 'A', true, 'Official FoodBev SETA source anchor. Confirm individual programme status and deadline at source.'),
  ('fasset_official', 'Finance and Accounting Services SETA', 'seta', 'https://www.fasset.org.za/', 'A', true, 'Official FASSET source anchor. This is not evidence that a learnership or funding window is open.'),
  ('ceta_official', 'Construction Education and Training Authority', 'seta', 'https://www.ceta.org.za/', 'A', true, 'Official CETA source anchor. Verify each provider, programme, eligibility rule and closing date separately.'),
  ('mict_seta_official', 'Media, Information and Communication Technologies SETA', 'seta', 'https://www.mict.org.za/', 'A', true, 'Official MICT SETA source anchor. No active internship or learnership is asserted by this record.'),
  ('dhet_career_advice', 'DHET Career Development Services', 'government_career_guidance', 'https://www.careerhelp.org.za/', 'A', true, 'Career guidance resource referenced by the South African Government. Use for guidance only, not as evidence of a live vacancy or admission opening.')
ON CONFLICT (source_key) DO UPDATE SET
  source_name = EXCLUDED.source_name,
  source_type = EXCLUDED.source_type,
  base_url = EXCLUDED.base_url,
  default_confidence_band = EXCLUDED.default_confidence_band,
  verification_required = EXCLUDED.verification_required,
  verification_notes = EXCLUDED.verification_notes,
  updated_at = now();
