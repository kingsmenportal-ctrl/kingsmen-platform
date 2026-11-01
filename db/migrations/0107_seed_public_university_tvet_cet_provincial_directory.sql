-- 0107: canonical public university, TVET, CET and provincial education directory.
-- Discovery records only. No current programme/intake, eligibility, partnership,
-- API connection, candidate submission, provider receipt or outcome is asserted.
-- Safe to re-run: stable provider keys, source-evidence merge, and collision checks.
BEGIN;

ALTER TABLE public.route_providers DROP CONSTRAINT IF EXISTS route_providers_type_check;
ALTER TABLE public.route_providers
  ADD CONSTRAINT route_providers_type_check
  CHECK (provider_type = ANY (ARRAY[
    'UNIVERSITY','TVET','CET_COLLEGE','SETA','LEARNERSHIP_PROVIDER',
    'BURSARY_PROVIDER','ACCOMMODATION_PROVIDER','EMPLOYER','PRIVATE_COLLEGE',
    'APPLICATION_PORTAL','GOVERNMENT_AUTHORITY','QUALITY_AUTHORITY'
  ]));
  
INSERT INTO public.source_authorities
  (source_key,source_name,source_type,base_url,default_confidence_band,verification_required,last_verified_at,verification_notes)
VALUES
  ('dhet_public_universities','DHET Public Universities Directory','government_institution_list','https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx','C',true,NULL,'Official public-university directory. Listing and institution identity only; recheck exact programme, intake, eligibility, closing date and application channel.'),
  ('dhet_public_tvet_colleges','DHET Public TVET Colleges Directory','government_institution_list','https://www.dhet.gov.za/SitePages/TVETlinks.aspx','C',true,NULL,'Official public TVET college directory. College listing and domain only; recheck exact programme, intake, eligibility, closing date and application channel.'),
  ('dhet_public_cet_colleges','DHET Community Education and Training Colleges','government_institution_list','https://www.dhet.gov.za/SitePages/CommunityCollege.aspx','C',true,NULL,'DHET states nine CET colleges, one per province. Community Learning Centres are delivery substructures and not independent legal-college provider records.'),
  ('dbe_provincial_education_departments','DBE Provincial Departments of Education Directory','government_institution_list','https://www.education.gov.za/ProvincialDepartments.aspx','C',true,NULL,'Official DBE provincial department index. Individual provincial department identity and directory link only; vacancies, admission, eligibility and application channels require notice-level verification.')
ON CONFLICT (source_key) DO NOTHING;

DO $source_preflight$
BEGIN
  IF EXISTS (
    SELECT 1 FROM (VALUES
      ('dhet_public_universities','https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_public_tvet_colleges','https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_public_cet_colleges','https://www.dhet.gov.za/SitePages/CommunityCollege.aspx'),
      ('dbe_provincial_education_departments','https://www.education.gov.za/ProvincialDepartments.aspx')
    ) expected(source_key,base_url)
    LEFT JOIN public.source_authorities actual USING (source_key)
    WHERE actual.id IS NULL OR actual.base_url IS DISTINCT FROM expected.base_url OR actual.verification_required IS DISTINCT FROM true
  ) THEN
    RAISE EXCEPTION 'INSTITUTION_SOURCE_AUTHORITY_MISSING_OR_CONFLICTING';
  END IF;
END
$source_preflight$;

DO $provider_identity_preflight$
DECLARE conflict_count integer;
BEGIN
  WITH expected(provider_key,provider_name,provider_type,province,base_url,source_key,source_profile_url) AS (
    VALUES
      ('dhet_university_cput', 'Cape Peninsula University of Technology', 'UNIVERSITY', 'Western Cape', 'https://www.cput.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_cut', 'Central University of Technology, Free State', 'UNIVERSITY', 'Free State', 'https://www.cut.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_dut', 'Durban University of Technology', 'UNIVERSITY', 'KwaZulu-Natal', 'https://www.dut.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_mut', 'Mangosuthu University of Technology', 'UNIVERSITY', 'KwaZulu-Natal', 'https://www.mut.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_mandela', 'Nelson Mandela University', 'UNIVERSITY', 'Eastern Cape', 'https://www.mandela.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_nwu', 'North-West University', 'UNIVERSITY', 'North West', 'https://www.nwu.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_rhodes', 'Rhodes University', 'UNIVERSITY', 'Eastern Cape', 'https://www.ru.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_smu', 'Sefako Makgatho Health Sciences University', 'UNIVERSITY', 'Gauteng', 'https://www.smu.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_spu', 'Sol Plaatje University', 'UNIVERSITY', 'Northern Cape', 'https://www.spu.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_stellenbosch', 'Stellenbosch University', 'UNIVERSITY', 'Western Cape', 'https://www.sun.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_tut', 'Tshwane University of Technology', 'UNIVERSITY', 'Gauteng', 'https://www.tut.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_uct', 'University of Cape Town', 'UNIVERSITY', 'Western Cape', 'https://www.uct.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_ufh', 'University of Fort Hare', 'UNIVERSITY', 'Eastern Cape', 'https://www.ufh.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_uj', 'University of Johannesburg', 'UNIVERSITY', 'Gauteng', 'https://www.uj.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_ukzn', 'University of KwaZulu-Natal', 'UNIVERSITY', 'KwaZulu-Natal', 'https://www.ukzn.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_ul', 'University of Limpopo', 'UNIVERSITY', 'Limpopo', 'https://www.ul.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_ump', 'University of Mpumalanga', 'UNIVERSITY', 'Mpumalanga', 'https://www.ump.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_up', 'University of Pretoria', 'UNIVERSITY', 'Gauteng', 'https://www.up.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_unisa', 'University of South Africa', 'UNIVERSITY', 'Gauteng', NULL, 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_ufs', 'University of the Free State', 'UNIVERSITY', 'Free State', 'https://www.ufs.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_uwc', 'University of the Western Cape', 'UNIVERSITY', 'Western Cape', 'https://www.uwc.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_wits', 'University of the Witwatersrand', 'UNIVERSITY', 'Gauteng', 'https://www.wits.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_vut', 'Vaal University of Technology', 'UNIVERSITY', 'Gauteng', 'https://www.vut.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_unizulu', 'University of Zululand', 'UNIVERSITY', 'KwaZulu-Natal', 'https://www.unizulu.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_wsu', 'Walter Sisulu University', 'UNIVERSITY', 'Eastern Cape', 'https://www.wsu.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_univen', 'University of Venda', 'UNIVERSITY', 'Limpopo', 'https://www.univen.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_tvet_buffalo-city', 'Buffalo City TVET College', 'TVET', 'Eastern Cape', 'https://www.bccollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_eastcape-midlands', 'Eastcape Midlands TVET College', 'TVET', 'Eastern Cape', 'https://www.emcol.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_ikhala', 'Ikhala TVET College', 'TVET', 'Eastern Cape', 'https://www.ikhalacollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_ingwe', 'Ingwe TVET College', 'TVET', 'Eastern Cape', 'https://www.ingwecollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_king-hintsa', 'King Hintsa TVET College', 'TVET', 'Eastern Cape', 'https://www.kinghintsacollege.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_king-sabata-dalindyebo', 'King Sabata Dalindyebo TVET College', 'TVET', 'Eastern Cape', 'https://www.ksdcollege.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_lovedale', 'Lovedale TVET College', 'TVET', 'Eastern Cape', 'https://www.lovedalecollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_port-elizabeth', 'Port Elizabeth TVET College', 'TVET', 'Eastern Cape', 'https://www.pecollege.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_flavius-mareka', 'Flavius Mareka TVET College', 'TVET', 'Free State', NULL, 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_goldfields', 'Goldfields TVET College', 'TVET', 'Free State', 'https://www.goldfieldsfet.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_maluti', 'Maluti TVET College', 'TVET', 'Free State', 'https://www.malutifet.org.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_motheo', 'Motheo TVET College', 'TVET', 'Free State', 'https://www.motheotvet.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_central-johannesburg', 'Central Johannesburg TVET College', 'TVET', 'Gauteng', 'https://www.cjc.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_ekurhuleni-east', 'Ekurhuleni East TVET College', 'TVET', 'Gauteng', 'https://www.eec.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_ekurhuleni-west', 'Ekurhuleni West TVET College', 'TVET', 'Gauteng', 'https://www.ewc.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_sedibeng', 'Sedibeng TVET College', 'TVET', 'Gauteng', 'https://www.sedcol.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_south-west-gauteng', 'South West Gauteng TVET College', 'TVET', 'Gauteng', 'https://www.swgc.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_tshwane-north', 'Tshwane North TVET College', 'TVET', 'Gauteng', 'https://www.tnc4fet.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_tshwane-south', 'Tshwane South TVET College', 'TVET', 'Gauteng', 'https://www.tsc.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_western', 'Western TVET College', 'TVET', 'Gauteng', 'https://www.westcol.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_coastal-kzn', 'Coastal TVET College', 'TVET', 'KwaZulu-Natal', 'https://www.coastalkzn.cao.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_elangeni', 'Elangeni TVET College', 'TVET', 'KwaZulu-Natal', 'https://www.efet.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_esayidi', 'Esayidi TVET College', 'TVET', 'KwaZulu-Natal', 'https://www.esayidifet.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_majuba', 'Majuba TVET College', 'TVET', 'KwaZulu-Natal', 'https://www.majuba.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_mnambithi', 'Mnambithi TVET College', 'TVET', 'KwaZulu-Natal', 'https://www.mnambithicollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_mthashana', 'Mthashana TVET College', 'TVET', 'KwaZulu-Natal', 'https://www.mthashanafet.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_thekwini', 'Thekwini TVET College', 'TVET', 'KwaZulu-Natal', 'https://www.thekwinicollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_umfolozi', 'Umfolozi TVET College', 'TVET', 'KwaZulu-Natal', 'https://www.umfolozicollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_umgungundlovu', 'Umgungundlovu TVET College', 'TVET', 'KwaZulu-Natal', 'https://www.ufetc.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_capricorn', 'Capricorn TVET College', 'TVET', 'Limpopo', 'https://www.capricorncollege.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_lephalale', 'Lephalale TVET College', 'TVET', 'Limpopo', 'https://www.lephalalefetcollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_letaba', 'Letaba TVET College', 'TVET', 'Limpopo', 'https://www.letabafet.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_mopani-south-east', 'Mopani South East TVET College', 'TVET', 'Limpopo', 'https://www.mopanicollege.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_sekhukhune', 'Sekhukhune TVET College', 'TVET', 'Limpopo', 'https://www.sekfetcol.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_vhembe', 'Vhembe TVET College', 'TVET', 'Limpopo', 'https://www.vhembefet.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_waterberg', 'Waterberg TVET College', 'TVET', 'Limpopo', 'https://www.waterbergcollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_ehlanzeni', 'Ehlanzeni TVET College', 'TVET', 'Mpumalanga', 'https://www.ehlanzenicollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_gert-sibande', 'Gert Sibande TVET College', 'TVET', 'Mpumalanga', 'https://www.gscollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_nkangala', 'Nkangala TVET College', 'TVET', 'Mpumalanga', 'https://www.nkangalafet.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_northern-cape-rural', 'Northern Cape Rural TVET College', 'TVET', 'Northern Cape', 'https://www.ncrfet.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_northern-cape-urban', 'Northern Cape Urban TVET College', 'TVET', 'Northern Cape', 'https://www.ncufetcollege.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_orbit', 'ORBIT TVET College', 'TVET', 'North West', 'https://www.orbitcollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_taletso', 'Taletso TVET College', 'TVET', 'North West', 'https://www.taletsofetcollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_vuselela', 'Vuselela TVET College', 'TVET', 'North West', 'https://www.vuselelacollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_boland', 'Boland TVET College', 'TVET', 'Western Cape', 'https://www.bolandcollege.com/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_college-of-cape-town', 'College of Cape Town for TVET', 'TVET', 'Western Cape', 'https://www.cct.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_false-bay', 'False Bay TVET College', 'TVET', 'Western Cape', 'https://www.falsebaycollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_northlink', 'Northlink TVET College', 'TVET', 'Western Cape', 'https://www.northlink.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_south-cape', 'South Cape TVET College', 'TVET', 'Western Cape', 'https://www.sccollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_west-coast', 'West Coast TVET College', 'TVET', 'Western Cape', 'https://www.westcoastcollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_cet_eastern-cape', 'Eastern Cape Community Education and Training College', 'CET_COLLEGE', 'Eastern Cape', NULL, 'dhet_public_cet_colleges', 'https://www.dhet.gov.za/SitePages/CommunityCollege.aspx'),
      ('dhet_cet_free-state', 'Free State Community Education and Training College', 'CET_COLLEGE', 'Free State', NULL, 'dhet_public_cet_colleges', 'https://www.dhet.gov.za/SitePages/CommunityCollege.aspx'),
      ('dhet_cet_gauteng', 'Gauteng Community Education and Training College', 'CET_COLLEGE', 'Gauteng', NULL, 'dhet_public_cet_colleges', 'https://www.dhet.gov.za/SitePages/CommunityCollege.aspx'),
      ('dhet_cet_kwazulu-natal', 'KwaZulu-Natal Community Education and Training College', 'CET_COLLEGE', 'KwaZulu-Natal', NULL, 'dhet_public_cet_colleges', 'https://www.dhet.gov.za/SitePages/CommunityCollege.aspx'),
      ('dhet_cet_limpopo', 'Limpopo Community Education and Training College', 'CET_COLLEGE', 'Limpopo', NULL, 'dhet_public_cet_colleges', 'https://www.dhet.gov.za/SitePages/CommunityCollege.aspx'),
      ('dhet_cet_mpumalanga', 'Mpumalanga Community Education and Training College', 'CET_COLLEGE', 'Mpumalanga', NULL, 'dhet_public_cet_colleges', 'https://www.dhet.gov.za/SitePages/CommunityCollege.aspx'),
      ('dhet_cet_north-west', 'North West Community Education and Training College', 'CET_COLLEGE', 'North West', NULL, 'dhet_public_cet_colleges', 'https://www.dhet.gov.za/SitePages/CommunityCollege.aspx'),
      ('dhet_cet_northern-cape', 'Northern Cape Community Education and Training College', 'CET_COLLEGE', 'Northern Cape', NULL, 'dhet_public_cet_colleges', 'https://www.dhet.gov.za/SitePages/CommunityCollege.aspx'),
      ('dhet_cet_western-cape', 'Western Cape Community Education and Training College', 'CET_COLLEGE', 'Western Cape', NULL, 'dhet_public_cet_colleges', 'https://www.dhet.gov.za/SitePages/CommunityCollege.aspx'),
      ('prov_education_eastern_cape', 'Eastern Cape Department of Education', 'GOVERNMENT_AUTHORITY', 'Eastern Cape', 'https://www.ecdoe.gov.za/', 'dbe_provincial_education_departments', 'https://www.education.gov.za/ProvincialDepartments.aspx'),
      ('prov_education_free_state', 'Free State Department of Education', 'GOVERNMENT_AUTHORITY', 'Free State', NULL, 'dbe_provincial_education_departments', 'https://www.education.gov.za/ProvincialDepartments.aspx'),
      ('prov_education_gauteng', 'Gauteng Department of Education', 'GOVERNMENT_AUTHORITY', 'Gauteng', NULL, 'dbe_provincial_education_departments', 'https://www.education.gov.za/ProvincialDepartments.aspx'),
      ('prov_education_kwazulu_natal', 'KwaZulu-Natal Department of Education', 'GOVERNMENT_AUTHORITY', 'KwaZulu-Natal', 'https://www.kzneducation.gov.za/', 'dbe_provincial_education_departments', 'https://www.education.gov.za/ProvincialDepartments.aspx'),
      ('prov_education_limpopo', 'Limpopo Department of Education', 'GOVERNMENT_AUTHORITY', 'Limpopo', 'https://www.edu.limpopo.gov.za/', 'dbe_provincial_education_departments', 'https://www.education.gov.za/ProvincialDepartments.aspx'),
      ('prov_education_mpumalanga', 'Mpumalanga Department of Education', 'GOVERNMENT_AUTHORITY', 'Mpumalanga', 'https://mpeducation.mpg.gov.za/', 'dbe_provincial_education_departments', 'https://www.education.gov.za/ProvincialDepartments.aspx'),
      ('prov_education_north_west', 'North West Department of Education', 'GOVERNMENT_AUTHORITY', 'North West', 'https://education.nwpg.gov.za/', 'dbe_provincial_education_departments', 'https://www.education.gov.za/ProvincialDepartments.aspx'),
      ('prov_education_northern_cape', 'Northern Cape Department of Education', 'GOVERNMENT_AUTHORITY', 'Northern Cape', 'https://ncdoe.ncpg.gov.za/', 'dbe_provincial_education_departments', 'https://www.education.gov.za/ProvincialDepartments.aspx'),
      ('prov_education_western_cape', 'Western Cape Education Department', 'GOVERNMENT_AUTHORITY', 'Western Cape', 'https://wcedonline.westerncape.gov.za/', 'dbe_provincial_education_departments', 'https://www.education.gov.za/ProvincialDepartments.aspx')
  )
  SELECT count(*) INTO conflict_count
  FROM expected e
  JOIN public.route_providers p USING (provider_key)
  WHERE p.provider_name IS DISTINCT FROM e.provider_name
     OR p.provider_type IS DISTINCT FROM e.provider_type
     OR (p.province IS NOT NULL AND e.province IS NOT NULL AND p.province IS DISTINCT FROM e.province)
     OR (p.base_url IS NOT NULL AND e.base_url IS NOT NULL AND p.base_url IS DISTINCT FROM e.base_url);
  IF conflict_count > 0 THEN
    RAISE EXCEPTION 'PUBLIC_INSTITUTION_DIRECTORY_PROVIDER_CONFLICT %', conflict_count;
  END IF;
END
$provider_identity_preflight$;



WITH provider_seed(provider_key,provider_name,provider_type,province,base_url,source_key,source_profile_url,provider_homepage_url,source_id,institution_classes) AS (
  VALUES
    ('dhet_university_cput', 'Cape Peninsula University of Technology', 'UNIVERSITY', 'Western Cape', 'https://www.cput.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx', 'https://www.cput.ac.za/', 'university-cput', 'EDUCATION_AND_SKILLS'),
    ('dhet_university_cut', 'Central University of Technology, Free State', 'UNIVERSITY', 'Free State', 'https://www.cut.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx', 'https://www.cut.ac.za/', 'university-cut', 'EDUCATION_AND_SKILLS'),
    ('dhet_university_dut', 'Durban University of Technology', 'UNIVERSITY', 'KwaZulu-Natal', 'https://www.dut.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx', 'https://www.dut.ac.za/', 'university-dut', 'EDUCATION_AND_SKILLS'),
    ('dhet_university_mut', 'Mangosuthu University of Technology', 'UNIVERSITY', 'KwaZulu-Natal', 'https://www.mut.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx', 'https://www.mut.ac.za/', 'university-mut', 'EDUCATION_AND_SKILLS'),
    ('dhet_university_mandela', 'Nelson Mandela University', 'UNIVERSITY', 'Eastern Cape', 'https://www.mandela.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx', 'https://www.mandela.ac.za/', 'university-mandela', 'EDUCATION_AND_SKILLS'),
    ('dhet_university_nwu', 'North-West University', 'UNIVERSITY', 'North West', 'https://www.nwu.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx', 'https://www.nwu.ac.za/', 'university-nwu', 'EDUCATION_AND_SKILLS'),
    ('dhet_university_rhodes', 'Rhodes University', 'UNIVERSITY', 'Eastern Cape', 'https://www.ru.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx', 'https://www.ru.ac.za/', 'university-rhodes', 'EDUCATION_AND_SKILLS'),
    ('dhet_university_smu', 'Sefako Makgatho Health Sciences University', 'UNIVERSITY', 'Gauteng', 'https://www.smu.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx', 'https://www.smu.ac.za/', 'university-smu', 'EDUCATION_AND_SKILLS'),
    ('dhet_university_spu', 'Sol Plaatje University', 'UNIVERSITY', 'Northern Cape', 'https://www.spu.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx', 'https://www.spu.ac.za/', 'university-spu', 'EDUCATION_AND_SKILLS'),
    ('dhet_university_stellenbosch', 'Stellenbosch University', 'UNIVERSITY', 'Western Cape', 'https://www.sun.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx', 'https://www.sun.ac.za/', 'university-stellenbosch', 'EDUCATION_AND_SKILLS'),
    ('dhet_university_tut', 'Tshwane University of Technology', 'UNIVERSITY', 'Gauteng', 'https://www.tut.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx', 'https://www.tut.ac.za/', 'university-tut', 'EDUCATION_AND_SKILLS'),
    ('dhet_university_uct', 'University of Cape Town', 'UNIVERSITY', 'Western Cape', 'https://www.uct.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx', 'https://www.uct.ac.za/', 'university-uct', 'EDUCATION_AND_SKILLS'),
    ('dhet_university_ufh', 'University of Fort Hare', 'UNIVERSITY', 'Eastern Cape', 'https://www.ufh.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx', 'https://www.ufh.ac.za/', 'university-ufh', 'EDUCATION_AND_SKILLS'),
    ('dhet_university_uj', 'University of Johannesburg', 'UNIVERSITY', 'Gauteng', 'https://www.uj.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx', 'https://www.uj.ac.za/', 'university-uj', 'EDUCATION_AND_SKILLS'),
    ('dhet_university_ukzn', 'University of KwaZulu-Natal', 'UNIVERSITY', 'KwaZulu-Natal', 'https://www.ukzn.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx', 'https://www.ukzn.ac.za/', 'university-ukzn', 'EDUCATION_AND_SKILLS'),
    ('dhet_university_ul', 'University of Limpopo', 'UNIVERSITY', 'Limpopo', 'https://www.ul.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx', 'https://www.ul.ac.za/', 'university-ul', 'EDUCATION_AND_SKILLS'),
    ('dhet_university_ump', 'University of Mpumalanga', 'UNIVERSITY', 'Mpumalanga', 'https://www.ump.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx', 'https://www.ump.ac.za/', 'university-ump', 'EDUCATION_AND_SKILLS'),
    ('dhet_university_up', 'University of Pretoria', 'UNIVERSITY', 'Gauteng', 'https://www.up.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx', 'https://www.up.ac.za/', 'university-up', 'EDUCATION_AND_SKILLS'),
    ('dhet_university_unisa', 'University of South Africa', 'UNIVERSITY', 'Gauteng', NULL, 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx', NULL, 'university-unisa', 'EDUCATION_AND_SKILLS'),
    ('dhet_university_ufs', 'University of the Free State', 'UNIVERSITY', 'Free State', 'https://www.ufs.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx', 'https://www.ufs.ac.za/', 'university-ufs', 'EDUCATION_AND_SKILLS'),
    ('dhet_university_uwc', 'University of the Western Cape', 'UNIVERSITY', 'Western Cape', 'https://www.uwc.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx', 'https://www.uwc.ac.za/', 'university-uwc', 'EDUCATION_AND_SKILLS'),
    ('dhet_university_wits', 'University of the Witwatersrand', 'UNIVERSITY', 'Gauteng', 'https://www.wits.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx', 'https://www.wits.ac.za/', 'university-wits', 'EDUCATION_AND_SKILLS'),
    ('dhet_university_vut', 'Vaal University of Technology', 'UNIVERSITY', 'Gauteng', 'https://www.vut.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx', 'https://www.vut.ac.za/', 'university-vut', 'EDUCATION_AND_SKILLS'),
    ('dhet_university_unizulu', 'University of Zululand', 'UNIVERSITY', 'KwaZulu-Natal', 'https://www.unizulu.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx', 'https://www.unizulu.ac.za/', 'university-unizulu', 'EDUCATION_AND_SKILLS'),
    ('dhet_university_wsu', 'Walter Sisulu University', 'UNIVERSITY', 'Eastern Cape', 'https://www.wsu.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx', 'https://www.wsu.ac.za/', 'university-wsu', 'EDUCATION_AND_SKILLS'),
    ('dhet_university_univen', 'University of Venda', 'UNIVERSITY', 'Limpopo', 'https://www.univen.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx', 'https://www.univen.ac.za/', 'university-univen', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_buffalo-city', 'Buffalo City TVET College', 'TVET', 'Eastern Cape', 'https://www.bccollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.bccollege.co.za/', 'tvet-buffalo-city', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_eastcape-midlands', 'Eastcape Midlands TVET College', 'TVET', 'Eastern Cape', 'https://www.emcol.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.emcol.co.za/', 'tvet-eastcape-midlands', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_ikhala', 'Ikhala TVET College', 'TVET', 'Eastern Cape', 'https://www.ikhalacollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.ikhalacollege.co.za/', 'tvet-ikhala', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_ingwe', 'Ingwe TVET College', 'TVET', 'Eastern Cape', 'https://www.ingwecollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.ingwecollege.co.za/', 'tvet-ingwe', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_king-hintsa', 'King Hintsa TVET College', 'TVET', 'Eastern Cape', 'https://www.kinghintsacollege.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.kinghintsacollege.edu.za/', 'tvet-king-hintsa', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_king-sabata-dalindyebo', 'King Sabata Dalindyebo TVET College', 'TVET', 'Eastern Cape', 'https://www.ksdcollege.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.ksdcollege.edu.za/', 'tvet-king-sabata-dalindyebo', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_lovedale', 'Lovedale TVET College', 'TVET', 'Eastern Cape', 'https://www.lovedalecollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.lovedalecollege.co.za/', 'tvet-lovedale', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_port-elizabeth', 'Port Elizabeth TVET College', 'TVET', 'Eastern Cape', 'https://www.pecollege.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.pecollege.edu.za/', 'tvet-port-elizabeth', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_flavius-mareka', 'Flavius Mareka TVET College', 'TVET', 'Free State', NULL, 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', NULL, 'tvet-flavius-mareka', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_goldfields', 'Goldfields TVET College', 'TVET', 'Free State', 'https://www.goldfieldsfet.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.goldfieldsfet.edu.za/', 'tvet-goldfields', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_maluti', 'Maluti TVET College', 'TVET', 'Free State', 'https://www.malutifet.org.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.malutifet.org.za/', 'tvet-maluti', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_motheo', 'Motheo TVET College', 'TVET', 'Free State', 'https://www.motheotvet.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.motheotvet.co.za/', 'tvet-motheo', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_central-johannesburg', 'Central Johannesburg TVET College', 'TVET', 'Gauteng', 'https://www.cjc.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.cjc.co.za/', 'tvet-central-johannesburg', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_ekurhuleni-east', 'Ekurhuleni East TVET College', 'TVET', 'Gauteng', 'https://www.eec.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.eec.edu.za/', 'tvet-ekurhuleni-east', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_ekurhuleni-west', 'Ekurhuleni West TVET College', 'TVET', 'Gauteng', 'https://www.ewc.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.ewc.edu.za/', 'tvet-ekurhuleni-west', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_sedibeng', 'Sedibeng TVET College', 'TVET', 'Gauteng', 'https://www.sedcol.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.sedcol.co.za/', 'tvet-sedibeng', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_south-west-gauteng', 'South West Gauteng TVET College', 'TVET', 'Gauteng', 'https://www.swgc.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.swgc.co.za/', 'tvet-south-west-gauteng', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_tshwane-north', 'Tshwane North TVET College', 'TVET', 'Gauteng', 'https://www.tnc4fet.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.tnc4fet.co.za/', 'tvet-tshwane-north', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_tshwane-south', 'Tshwane South TVET College', 'TVET', 'Gauteng', 'https://www.tsc.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.tsc.edu.za/', 'tvet-tshwane-south', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_western', 'Western TVET College', 'TVET', 'Gauteng', 'https://www.westcol.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.westcol.co.za/', 'tvet-western', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_coastal-kzn', 'Coastal TVET College', 'TVET', 'KwaZulu-Natal', 'https://www.coastalkzn.cao.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.coastalkzn.cao.za/', 'tvet-coastal-kzn', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_elangeni', 'Elangeni TVET College', 'TVET', 'KwaZulu-Natal', 'https://www.efet.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.efet.co.za/', 'tvet-elangeni', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_esayidi', 'Esayidi TVET College', 'TVET', 'KwaZulu-Natal', 'https://www.esayidifet.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.esayidifet.co.za/', 'tvet-esayidi', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_majuba', 'Majuba TVET College', 'TVET', 'KwaZulu-Natal', 'https://www.majuba.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.majuba.edu.za/', 'tvet-majuba', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_mnambithi', 'Mnambithi TVET College', 'TVET', 'KwaZulu-Natal', 'https://www.mnambithicollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.mnambithicollege.co.za/', 'tvet-mnambithi', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_mthashana', 'Mthashana TVET College', 'TVET', 'KwaZulu-Natal', 'https://www.mthashanafet.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.mthashanafet.co.za/', 'tvet-mthashana', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_thekwini', 'Thekwini TVET College', 'TVET', 'KwaZulu-Natal', 'https://www.thekwinicollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.thekwinicollege.co.za/', 'tvet-thekwini', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_umfolozi', 'Umfolozi TVET College', 'TVET', 'KwaZulu-Natal', 'https://www.umfolozicollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.umfolozicollege.co.za/', 'tvet-umfolozi', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_umgungundlovu', 'Umgungundlovu TVET College', 'TVET', 'KwaZulu-Natal', 'https://www.ufetc.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.ufetc.edu.za/', 'tvet-umgungundlovu', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_capricorn', 'Capricorn TVET College', 'TVET', 'Limpopo', 'https://www.capricorncollege.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.capricorncollege.edu.za/', 'tvet-capricorn', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_lephalale', 'Lephalale TVET College', 'TVET', 'Limpopo', 'https://www.lephalalefetcollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.lephalalefetcollege.co.za/', 'tvet-lephalale', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_letaba', 'Letaba TVET College', 'TVET', 'Limpopo', 'https://www.letabafet.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.letabafet.co.za/', 'tvet-letaba', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_mopani-south-east', 'Mopani South East TVET College', 'TVET', 'Limpopo', 'https://www.mopanicollege.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.mopanicollege.edu.za/', 'tvet-mopani-south-east', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_sekhukhune', 'Sekhukhune TVET College', 'TVET', 'Limpopo', 'https://www.sekfetcol.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.sekfetcol.co.za/', 'tvet-sekhukhune', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_vhembe', 'Vhembe TVET College', 'TVET', 'Limpopo', 'https://www.vhembefet.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.vhembefet.co.za/', 'tvet-vhembe', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_waterberg', 'Waterberg TVET College', 'TVET', 'Limpopo', 'https://www.waterbergcollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.waterbergcollege.co.za/', 'tvet-waterberg', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_ehlanzeni', 'Ehlanzeni TVET College', 'TVET', 'Mpumalanga', 'https://www.ehlanzenicollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.ehlanzenicollege.co.za/', 'tvet-ehlanzeni', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_gert-sibande', 'Gert Sibande TVET College', 'TVET', 'Mpumalanga', 'https://www.gscollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.gscollege.co.za/', 'tvet-gert-sibande', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_nkangala', 'Nkangala TVET College', 'TVET', 'Mpumalanga', 'https://www.nkangalafet.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.nkangalafet.edu.za/', 'tvet-nkangala', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_northern-cape-rural', 'Northern Cape Rural TVET College', 'TVET', 'Northern Cape', 'https://www.ncrfet.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.ncrfet.edu.za/', 'tvet-northern-cape-rural', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_northern-cape-urban', 'Northern Cape Urban TVET College', 'TVET', 'Northern Cape', 'https://www.ncufetcollege.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.ncufetcollege.edu.za/', 'tvet-northern-cape-urban', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_orbit', 'ORBIT TVET College', 'TVET', 'North West', 'https://www.orbitcollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.orbitcollege.co.za/', 'tvet-orbit', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_taletso', 'Taletso TVET College', 'TVET', 'North West', 'https://www.taletsofetcollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.taletsofetcollege.co.za/', 'tvet-taletso', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_vuselela', 'Vuselela TVET College', 'TVET', 'North West', 'https://www.vuselelacollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.vuselelacollege.co.za/', 'tvet-vuselela', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_boland', 'Boland TVET College', 'TVET', 'Western Cape', 'https://www.bolandcollege.com/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.bolandcollege.com/', 'tvet-boland', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_college-of-cape-town', 'College of Cape Town for TVET', 'TVET', 'Western Cape', 'https://www.cct.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.cct.edu.za/', 'tvet-college-of-cape-town', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_false-bay', 'False Bay TVET College', 'TVET', 'Western Cape', 'https://www.falsebaycollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.falsebaycollege.co.za/', 'tvet-false-bay', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_northlink', 'Northlink TVET College', 'TVET', 'Western Cape', 'https://www.northlink.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.northlink.co.za/', 'tvet-northlink', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_south-cape', 'South Cape TVET College', 'TVET', 'Western Cape', 'https://www.sccollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.sccollege.co.za/', 'tvet-south-cape', 'EDUCATION_AND_SKILLS'),
    ('dhet_tvet_west-coast', 'West Coast TVET College', 'TVET', 'Western Cape', 'https://www.westcoastcollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx', 'https://www.westcoastcollege.co.za/', 'tvet-west-coast', 'EDUCATION_AND_SKILLS'),
    ('dhet_cet_eastern-cape', 'Eastern Cape Community Education and Training College', 'CET_COLLEGE', 'Eastern Cape', NULL, 'dhet_public_cet_colleges', 'https://www.dhet.gov.za/SitePages/CommunityCollege.aspx', NULL, 'cet-eastern-cape', 'EDUCATION_AND_SKILLS'),
    ('dhet_cet_free-state', 'Free State Community Education and Training College', 'CET_COLLEGE', 'Free State', NULL, 'dhet_public_cet_colleges', 'https://www.dhet.gov.za/SitePages/CommunityCollege.aspx', NULL, 'cet-free-state', 'EDUCATION_AND_SKILLS'),
    ('dhet_cet_gauteng', 'Gauteng Community Education and Training College', 'CET_COLLEGE', 'Gauteng', NULL, 'dhet_public_cet_colleges', 'https://www.dhet.gov.za/SitePages/CommunityCollege.aspx', NULL, 'cet-gauteng', 'EDUCATION_AND_SKILLS'),
    ('dhet_cet_kwazulu-natal', 'KwaZulu-Natal Community Education and Training College', 'CET_COLLEGE', 'KwaZulu-Natal', NULL, 'dhet_public_cet_colleges', 'https://www.dhet.gov.za/SitePages/CommunityCollege.aspx', NULL, 'cet-kwazulu-natal', 'EDUCATION_AND_SKILLS'),
    ('dhet_cet_limpopo', 'Limpopo Community Education and Training College', 'CET_COLLEGE', 'Limpopo', NULL, 'dhet_public_cet_colleges', 'https://www.dhet.gov.za/SitePages/CommunityCollege.aspx', NULL, 'cet-limpopo', 'EDUCATION_AND_SKILLS'),
    ('dhet_cet_mpumalanga', 'Mpumalanga Community Education and Training College', 'CET_COLLEGE', 'Mpumalanga', NULL, 'dhet_public_cet_colleges', 'https://www.dhet.gov.za/SitePages/CommunityCollege.aspx', NULL, 'cet-mpumalanga', 'EDUCATION_AND_SKILLS'),
    ('dhet_cet_north-west', 'North West Community Education and Training College', 'CET_COLLEGE', 'North West', NULL, 'dhet_public_cet_colleges', 'https://www.dhet.gov.za/SitePages/CommunityCollege.aspx', NULL, 'cet-north-west', 'EDUCATION_AND_SKILLS'),
    ('dhet_cet_northern-cape', 'Northern Cape Community Education and Training College', 'CET_COLLEGE', 'Northern Cape', NULL, 'dhet_public_cet_colleges', 'https://www.dhet.gov.za/SitePages/CommunityCollege.aspx', NULL, 'cet-northern-cape', 'EDUCATION_AND_SKILLS'),
    ('dhet_cet_western-cape', 'Western Cape Community Education and Training College', 'CET_COLLEGE', 'Western Cape', NULL, 'dhet_public_cet_colleges', 'https://www.dhet.gov.za/SitePages/CommunityCollege.aspx', NULL, 'cet-western-cape', 'EDUCATION_AND_SKILLS'),
    ('prov_education_eastern_cape', 'Eastern Cape Department of Education', 'GOVERNMENT_AUTHORITY', 'Eastern Cape', NULL, 'dbe_provincial_education_departments', 'https://www.education.gov.za/ProvincialDepartments.aspx', 'https://www.ecdoe.gov.za/', 'prov_education_eastern_cape', 'PUBLIC_ADMINISTRATION,EDUCATION_AND_SKILLS,PROVINCIAL_DEPARTMENT'),
    ('prov_education_free_state', 'Free State Department of Education', 'GOVERNMENT_AUTHORITY', 'Free State', NULL, 'dbe_provincial_education_departments', 'https://www.education.gov.za/ProvincialDepartments.aspx', NULL, 'prov_education_free_state', 'PUBLIC_ADMINISTRATION,EDUCATION_AND_SKILLS,PROVINCIAL_DEPARTMENT'),
    ('prov_education_gauteng', 'Gauteng Department of Education', 'GOVERNMENT_AUTHORITY', 'Gauteng', NULL, 'dbe_provincial_education_departments', 'https://www.education.gov.za/ProvincialDepartments.aspx', NULL, 'prov_education_gauteng', 'PUBLIC_ADMINISTRATION,EDUCATION_AND_SKILLS,PROVINCIAL_DEPARTMENT'),
    ('prov_education_kwazulu_natal', 'KwaZulu-Natal Department of Education', 'GOVERNMENT_AUTHORITY', 'KwaZulu-Natal', NULL, 'dbe_provincial_education_departments', 'https://www.education.gov.za/ProvincialDepartments.aspx', 'https://www.kzneducation.gov.za/', 'prov_education_kwazulu_natal', 'PUBLIC_ADMINISTRATION,EDUCATION_AND_SKILLS,PROVINCIAL_DEPARTMENT'),
    ('prov_education_limpopo', 'Limpopo Department of Education', 'GOVERNMENT_AUTHORITY', 'Limpopo', NULL, 'dbe_provincial_education_departments', 'https://www.education.gov.za/ProvincialDepartments.aspx', 'https://www.edu.limpopo.gov.za/', 'prov_education_limpopo', 'PUBLIC_ADMINISTRATION,EDUCATION_AND_SKILLS,PROVINCIAL_DEPARTMENT'),
    ('prov_education_mpumalanga', 'Mpumalanga Department of Education', 'GOVERNMENT_AUTHORITY', 'Mpumalanga', NULL, 'dbe_provincial_education_departments', 'https://www.education.gov.za/ProvincialDepartments.aspx', 'https://mpeducation.mpg.gov.za/', 'prov_education_mpumalanga', 'PUBLIC_ADMINISTRATION,EDUCATION_AND_SKILLS,PROVINCIAL_DEPARTMENT'),
    ('prov_education_north_west', 'North West Department of Education', 'GOVERNMENT_AUTHORITY', 'North West', NULL, 'dbe_provincial_education_departments', 'https://www.education.gov.za/ProvincialDepartments.aspx', 'https://education.nwpg.gov.za/', 'prov_education_north_west', 'PUBLIC_ADMINISTRATION,EDUCATION_AND_SKILLS,PROVINCIAL_DEPARTMENT'),
    ('prov_education_northern_cape', 'Northern Cape Department of Education', 'GOVERNMENT_AUTHORITY', 'Northern Cape', NULL, 'dbe_provincial_education_departments', 'https://www.education.gov.za/ProvincialDepartments.aspx', 'https://ncdoe.ncpg.gov.za/', 'prov_education_northern_cape', 'PUBLIC_ADMINISTRATION,EDUCATION_AND_SKILLS,PROVINCIAL_DEPARTMENT'),
    ('prov_education_western_cape', 'Western Cape Education Department', 'GOVERNMENT_AUTHORITY', 'Western Cape', NULL, 'dbe_provincial_education_departments', 'https://www.education.gov.za/ProvincialDepartments.aspx', 'https://wcedonline.westerncape.gov.za/', 'prov_education_western_cape', 'PUBLIC_ADMINISTRATION,EDUCATION_AND_SKILLS,PROVINCIAL_DEPARTMENT')
),
source_linked AS (
  SELECT p.*, a.id AS source_authority_id
  FROM provider_seed p
  JOIN public.source_authorities a ON a.source_key=p.source_key
)
INSERT INTO public.route_providers
  (provider_key,provider_name,provider_type,province,base_url,source_authority_id,
   default_confidence_band,verification_status,public_safe,
   private_provider_requires_accreditation_check,notes,metadata)
SELECT
  provider_key,provider_name,provider_type,province,base_url,source_authority_id,
  'D','NEEDS_REVIEW',false,false,
  'Official source-listed institution or provincial authority identity only. Current service, programme, intake, eligibility, application route, partnership and Kingsmen technical integration are unverified.',
  jsonb_build_object(
    'directory_seed',jsonb_build_object(
      'source_key',source_key,'source_profile_url',source_profile_url,
      'provider_homepage_url',provider_homepage_url,'source_id',source_id,
      'source_snapshot_date','2026-10-31','record_status','NEEDS_REVIEW',
      'identity_status','DIRECTORY_LISTED_NEEDS_REVIEW','programme_status','UNKNOWN',
      'intake_status','UNKNOWN','eligibility_status','UNKNOWN',
      'application_route_status','NOT_VERIFIED','integration_status','NOT_CONNECTED',
      'partnership_status','NOT_A_PARTNER','automation_authorized',false,
      'provider_submission_supported_by_kingsmen',false,'provider_receipt_supported',false,
      'evidence_scope','Official DHET/DBE directory listing only; no current programme, vacancy, intake, eligibility, direct application route, integration, partnership, submission or outcome is proven.'
    ),
    'institution_classes',to_jsonb(string_to_array(institution_classes,',')),
    'provider_source_evidence',jsonb_build_array(jsonb_build_object(
      'source_key',source_key,'source_authority_id',source_authority_id,
      'source_profile_url',source_profile_url,'provider_homepage_url',provider_homepage_url,
      'source_id',source_id,'province',province,'source_snapshot_date','2026-10-31',
      'evidence_scope','Official directory listing only; not opportunity or integration evidence.'
    ))
  )
FROM source_linked
ON CONFLICT (provider_key) DO UPDATE
SET
  province=COALESCE(public.route_providers.province,EXCLUDED.province),
  base_url=COALESCE(public.route_providers.base_url,EXCLUDED.base_url),
  metadata=jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(public.route_providers.metadata,'{}'::jsonb),
        '{provider_source_evidence}',
        (
          SELECT COALESCE(jsonb_agg(merged.evidence ORDER BY merged.evidence->>'source_key',merged.evidence->>'source_profile_url',merged.evidence->>'source_id'),'[]'::jsonb)
          FROM (
            SELECT DISTINCT prior.value AS evidence
            FROM jsonb_array_elements(CASE WHEN jsonb_typeof(public.route_providers.metadata->'provider_source_evidence')='array'
              THEN public.route_providers.metadata->'provider_source_evidence' ELSE '[]'::jsonb END) prior(value)
            UNION
            SELECT incoming.value AS evidence FROM jsonb_array_elements(EXCLUDED.metadata->'provider_source_evidence') incoming(value)
          ) merged
        ),true
      ),
      '{institution_classes}',
      (
        SELECT COALESCE(jsonb_agg(to_jsonb(classes.class_name) ORDER BY classes.class_name),'[]'::jsonb)
        FROM (
          SELECT DISTINCT existing.value AS class_name
          FROM jsonb_array_elements_text(CASE WHEN jsonb_typeof(public.route_providers.metadata->'institution_classes')='array'
            THEN public.route_providers.metadata->'institution_classes' ELSE '[]'::jsonb END) existing(value)
          UNION
          SELECT incoming.value AS class_name FROM jsonb_array_elements_text(EXCLUDED.metadata->'institution_classes') incoming(value)
        ) classes
      ),true
    ),
    '{directory_seed}',
    EXCLUDED.metadata->'directory_seed' || COALESCE(public.route_providers.metadata->'directory_seed','{}'::jsonb),
    true
  ),
  updated_at=now()
WHERE public.route_providers.provider_name=EXCLUDED.provider_name
  AND public.route_providers.provider_type=EXCLUDED.provider_type;

DO $postflight$
DECLARE
  expected_count integer := 94;
  actual_count integer;
  invalid_count integer;
  missing_evidence integer;
  identity_conflict_count integer;
BEGIN
  SELECT count(*) INTO actual_count FROM public.route_providers WHERE provider_key = ANY(ARRAY['dhet_university_cput','dhet_university_cut','dhet_university_dut','dhet_university_mut','dhet_university_mandela','dhet_university_nwu','dhet_university_rhodes','dhet_university_smu','dhet_university_spu','dhet_university_stellenbosch','dhet_university_tut','dhet_university_uct','dhet_university_ufh','dhet_university_uj','dhet_university_ukzn','dhet_university_ul','dhet_university_ump','dhet_university_up','dhet_university_unisa','dhet_university_ufs','dhet_university_uwc','dhet_university_wits','dhet_university_vut','dhet_university_unizulu','dhet_university_wsu','dhet_university_univen','dhet_tvet_buffalo-city','dhet_tvet_eastcape-midlands','dhet_tvet_ikhala','dhet_tvet_ingwe','dhet_tvet_king-hintsa','dhet_tvet_king-sabata-dalindyebo','dhet_tvet_lovedale','dhet_tvet_port-elizabeth','dhet_tvet_flavius-mareka','dhet_tvet_goldfields','dhet_tvet_maluti','dhet_tvet_motheo','dhet_tvet_central-johannesburg','dhet_tvet_ekurhuleni-east','dhet_tvet_ekurhuleni-west','dhet_tvet_sedibeng','dhet_tvet_south-west-gauteng','dhet_tvet_tshwane-north','dhet_tvet_tshwane-south','dhet_tvet_western','dhet_tvet_coastal-kzn','dhet_tvet_elangeni','dhet_tvet_esayidi','dhet_tvet_majuba','dhet_tvet_mnambithi','dhet_tvet_mthashana','dhet_tvet_thekwini','dhet_tvet_umfolozi','dhet_tvet_umgungundlovu','dhet_tvet_capricorn','dhet_tvet_lephalale','dhet_tvet_letaba','dhet_tvet_mopani-south-east','dhet_tvet_sekhukhune','dhet_tvet_vhembe','dhet_tvet_waterberg','dhet_tvet_ehlanzeni','dhet_tvet_gert-sibande','dhet_tvet_nkangala','dhet_tvet_northern-cape-rural','dhet_tvet_northern-cape-urban','dhet_tvet_orbit','dhet_tvet_taletso','dhet_tvet_vuselela','dhet_tvet_boland','dhet_tvet_college-of-cape-town','dhet_tvet_false-bay','dhet_tvet_northlink','dhet_tvet_south-cape','dhet_tvet_west-coast','dhet_cet_eastern-cape','dhet_cet_free-state','dhet_cet_gauteng','dhet_cet_kwazulu-natal','dhet_cet_limpopo','dhet_cet_mpumalanga','dhet_cet_north-west','dhet_cet_northern-cape','dhet_cet_western-cape','prov_education_eastern_cape','prov_education_free_state','prov_education_gauteng','prov_education_kwazulu_natal','prov_education_limpopo','prov_education_mpumalanga','prov_education_north_west','prov_education_northern_cape','prov_education_western_cape']::text[]);
  IF actual_count <> expected_count THEN RAISE EXCEPTION 'PUBLIC_INSTITUTION_DIRECTORY_COUNT_MISMATCH expected %, got %',expected_count,actual_count; END IF;
  
  WITH expected(provider_key,provider_name,provider_type,province,base_url,source_key,source_profile_url) AS (
    VALUES
      ('dhet_university_cput', 'Cape Peninsula University of Technology', 'UNIVERSITY', 'Western Cape', 'https://www.cput.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_cut', 'Central University of Technology, Free State', 'UNIVERSITY', 'Free State', 'https://www.cut.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_dut', 'Durban University of Technology', 'UNIVERSITY', 'KwaZulu-Natal', 'https://www.dut.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_mut', 'Mangosuthu University of Technology', 'UNIVERSITY', 'KwaZulu-Natal', 'https://www.mut.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_mandela', 'Nelson Mandela University', 'UNIVERSITY', 'Eastern Cape', 'https://www.mandela.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_nwu', 'North-West University', 'UNIVERSITY', 'North West', 'https://www.nwu.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_rhodes', 'Rhodes University', 'UNIVERSITY', 'Eastern Cape', 'https://www.ru.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_smu', 'Sefako Makgatho Health Sciences University', 'UNIVERSITY', 'Gauteng', 'https://www.smu.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_spu', 'Sol Plaatje University', 'UNIVERSITY', 'Northern Cape', 'https://www.spu.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_stellenbosch', 'Stellenbosch University', 'UNIVERSITY', 'Western Cape', 'https://www.sun.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_tut', 'Tshwane University of Technology', 'UNIVERSITY', 'Gauteng', 'https://www.tut.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_uct', 'University of Cape Town', 'UNIVERSITY', 'Western Cape', 'https://www.uct.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_ufh', 'University of Fort Hare', 'UNIVERSITY', 'Eastern Cape', 'https://www.ufh.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_uj', 'University of Johannesburg', 'UNIVERSITY', 'Gauteng', 'https://www.uj.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_ukzn', 'University of KwaZulu-Natal', 'UNIVERSITY', 'KwaZulu-Natal', 'https://www.ukzn.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_ul', 'University of Limpopo', 'UNIVERSITY', 'Limpopo', 'https://www.ul.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_ump', 'University of Mpumalanga', 'UNIVERSITY', 'Mpumalanga', 'https://www.ump.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_up', 'University of Pretoria', 'UNIVERSITY', 'Gauteng', 'https://www.up.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_unisa', 'University of South Africa', 'UNIVERSITY', 'Gauteng', NULL, 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_ufs', 'University of the Free State', 'UNIVERSITY', 'Free State', 'https://www.ufs.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_uwc', 'University of the Western Cape', 'UNIVERSITY', 'Western Cape', 'https://www.uwc.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_wits', 'University of the Witwatersrand', 'UNIVERSITY', 'Gauteng', 'https://www.wits.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_vut', 'Vaal University of Technology', 'UNIVERSITY', 'Gauteng', 'https://www.vut.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_unizulu', 'University of Zululand', 'UNIVERSITY', 'KwaZulu-Natal', 'https://www.unizulu.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_wsu', 'Walter Sisulu University', 'UNIVERSITY', 'Eastern Cape', 'https://www.wsu.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_univen', 'University of Venda', 'UNIVERSITY', 'Limpopo', 'https://www.univen.ac.za/', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_tvet_buffalo-city', 'Buffalo City TVET College', 'TVET', 'Eastern Cape', 'https://www.bccollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_eastcape-midlands', 'Eastcape Midlands TVET College', 'TVET', 'Eastern Cape', 'https://www.emcol.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_ikhala', 'Ikhala TVET College', 'TVET', 'Eastern Cape', 'https://www.ikhalacollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_ingwe', 'Ingwe TVET College', 'TVET', 'Eastern Cape', 'https://www.ingwecollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_king-hintsa', 'King Hintsa TVET College', 'TVET', 'Eastern Cape', 'https://www.kinghintsacollege.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_king-sabata-dalindyebo', 'King Sabata Dalindyebo TVET College', 'TVET', 'Eastern Cape', 'https://www.ksdcollege.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_lovedale', 'Lovedale TVET College', 'TVET', 'Eastern Cape', 'https://www.lovedalecollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_port-elizabeth', 'Port Elizabeth TVET College', 'TVET', 'Eastern Cape', 'https://www.pecollege.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_flavius-mareka', 'Flavius Mareka TVET College', 'TVET', 'Free State', NULL, 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_goldfields', 'Goldfields TVET College', 'TVET', 'Free State', 'https://www.goldfieldsfet.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_maluti', 'Maluti TVET College', 'TVET', 'Free State', 'https://www.malutifet.org.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_motheo', 'Motheo TVET College', 'TVET', 'Free State', 'https://www.motheotvet.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_central-johannesburg', 'Central Johannesburg TVET College', 'TVET', 'Gauteng', 'https://www.cjc.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_ekurhuleni-east', 'Ekurhuleni East TVET College', 'TVET', 'Gauteng', 'https://www.eec.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_ekurhuleni-west', 'Ekurhuleni West TVET College', 'TVET', 'Gauteng', 'https://www.ewc.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_sedibeng', 'Sedibeng TVET College', 'TVET', 'Gauteng', 'https://www.sedcol.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_south-west-gauteng', 'South West Gauteng TVET College', 'TVET', 'Gauteng', 'https://www.swgc.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_tshwane-north', 'Tshwane North TVET College', 'TVET', 'Gauteng', 'https://www.tnc4fet.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_tshwane-south', 'Tshwane South TVET College', 'TVET', 'Gauteng', 'https://www.tsc.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_western', 'Western TVET College', 'TVET', 'Gauteng', 'https://www.westcol.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_coastal-kzn', 'Coastal TVET College', 'TVET', 'KwaZulu-Natal', 'https://www.coastalkzn.cao.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_elangeni', 'Elangeni TVET College', 'TVET', 'KwaZulu-Natal', 'https://www.efet.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_esayidi', 'Esayidi TVET College', 'TVET', 'KwaZulu-Natal', 'https://www.esayidifet.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_majuba', 'Majuba TVET College', 'TVET', 'KwaZulu-Natal', 'https://www.majuba.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_mnambithi', 'Mnambithi TVET College', 'TVET', 'KwaZulu-Natal', 'https://www.mnambithicollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_mthashana', 'Mthashana TVET College', 'TVET', 'KwaZulu-Natal', 'https://www.mthashanafet.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_thekwini', 'Thekwini TVET College', 'TVET', 'KwaZulu-Natal', 'https://www.thekwinicollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_umfolozi', 'Umfolozi TVET College', 'TVET', 'KwaZulu-Natal', 'https://www.umfolozicollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_umgungundlovu', 'Umgungundlovu TVET College', 'TVET', 'KwaZulu-Natal', 'https://www.ufetc.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_capricorn', 'Capricorn TVET College', 'TVET', 'Limpopo', 'https://www.capricorncollege.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_lephalale', 'Lephalale TVET College', 'TVET', 'Limpopo', 'https://www.lephalalefetcollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_letaba', 'Letaba TVET College', 'TVET', 'Limpopo', 'https://www.letabafet.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_mopani-south-east', 'Mopani South East TVET College', 'TVET', 'Limpopo', 'https://www.mopanicollege.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_sekhukhune', 'Sekhukhune TVET College', 'TVET', 'Limpopo', 'https://www.sekfetcol.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_vhembe', 'Vhembe TVET College', 'TVET', 'Limpopo', 'https://www.vhembefet.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_waterberg', 'Waterberg TVET College', 'TVET', 'Limpopo', 'https://www.waterbergcollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_ehlanzeni', 'Ehlanzeni TVET College', 'TVET', 'Mpumalanga', 'https://www.ehlanzenicollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_gert-sibande', 'Gert Sibande TVET College', 'TVET', 'Mpumalanga', 'https://www.gscollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_nkangala', 'Nkangala TVET College', 'TVET', 'Mpumalanga', 'https://www.nkangalafet.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_northern-cape-rural', 'Northern Cape Rural TVET College', 'TVET', 'Northern Cape', 'https://www.ncrfet.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_northern-cape-urban', 'Northern Cape Urban TVET College', 'TVET', 'Northern Cape', 'https://www.ncufetcollege.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_orbit', 'ORBIT TVET College', 'TVET', 'North West', 'https://www.orbitcollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_taletso', 'Taletso TVET College', 'TVET', 'North West', 'https://www.taletsofetcollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_vuselela', 'Vuselela TVET College', 'TVET', 'North West', 'https://www.vuselelacollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_boland', 'Boland TVET College', 'TVET', 'Western Cape', 'https://www.bolandcollege.com/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_college-of-cape-town', 'College of Cape Town for TVET', 'TVET', 'Western Cape', 'https://www.cct.edu.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_false-bay', 'False Bay TVET College', 'TVET', 'Western Cape', 'https://www.falsebaycollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_northlink', 'Northlink TVET College', 'TVET', 'Western Cape', 'https://www.northlink.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_south-cape', 'South Cape TVET College', 'TVET', 'Western Cape', 'https://www.sccollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_west-coast', 'West Coast TVET College', 'TVET', 'Western Cape', 'https://www.westcoastcollege.co.za/', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_cet_eastern-cape', 'Eastern Cape Community Education and Training College', 'CET_COLLEGE', 'Eastern Cape', NULL, 'dhet_public_cet_colleges', 'https://www.dhet.gov.za/SitePages/CommunityCollege.aspx'),
      ('dhet_cet_free-state', 'Free State Community Education and Training College', 'CET_COLLEGE', 'Free State', NULL, 'dhet_public_cet_colleges', 'https://www.dhet.gov.za/SitePages/CommunityCollege.aspx'),
      ('dhet_cet_gauteng', 'Gauteng Community Education and Training College', 'CET_COLLEGE', 'Gauteng', NULL, 'dhet_public_cet_colleges', 'https://www.dhet.gov.za/SitePages/CommunityCollege.aspx'),
      ('dhet_cet_kwazulu-natal', 'KwaZulu-Natal Community Education and Training College', 'CET_COLLEGE', 'KwaZulu-Natal', NULL, 'dhet_public_cet_colleges', 'https://www.dhet.gov.za/SitePages/CommunityCollege.aspx'),
      ('dhet_cet_limpopo', 'Limpopo Community Education and Training College', 'CET_COLLEGE', 'Limpopo', NULL, 'dhet_public_cet_colleges', 'https://www.dhet.gov.za/SitePages/CommunityCollege.aspx'),
      ('dhet_cet_mpumalanga', 'Mpumalanga Community Education and Training College', 'CET_COLLEGE', 'Mpumalanga', NULL, 'dhet_public_cet_colleges', 'https://www.dhet.gov.za/SitePages/CommunityCollege.aspx'),
      ('dhet_cet_north-west', 'North West Community Education and Training College', 'CET_COLLEGE', 'North West', NULL, 'dhet_public_cet_colleges', 'https://www.dhet.gov.za/SitePages/CommunityCollege.aspx'),
      ('dhet_cet_northern-cape', 'Northern Cape Community Education and Training College', 'CET_COLLEGE', 'Northern Cape', NULL, 'dhet_public_cet_colleges', 'https://www.dhet.gov.za/SitePages/CommunityCollege.aspx'),
      ('dhet_cet_western-cape', 'Western Cape Community Education and Training College', 'CET_COLLEGE', 'Western Cape', NULL, 'dhet_public_cet_colleges', 'https://www.dhet.gov.za/SitePages/CommunityCollege.aspx'),
      ('prov_education_eastern_cape', 'Eastern Cape Department of Education', 'GOVERNMENT_AUTHORITY', 'Eastern Cape', 'https://www.ecdoe.gov.za/', 'dbe_provincial_education_departments', 'https://www.education.gov.za/ProvincialDepartments.aspx'),
      ('prov_education_free_state', 'Free State Department of Education', 'GOVERNMENT_AUTHORITY', 'Free State', NULL, 'dbe_provincial_education_departments', 'https://www.education.gov.za/ProvincialDepartments.aspx'),
      ('prov_education_gauteng', 'Gauteng Department of Education', 'GOVERNMENT_AUTHORITY', 'Gauteng', NULL, 'dbe_provincial_education_departments', 'https://www.education.gov.za/ProvincialDepartments.aspx'),
      ('prov_education_kwazulu_natal', 'KwaZulu-Natal Department of Education', 'GOVERNMENT_AUTHORITY', 'KwaZulu-Natal', 'https://www.kzneducation.gov.za/', 'dbe_provincial_education_departments', 'https://www.education.gov.za/ProvincialDepartments.aspx'),
      ('prov_education_limpopo', 'Limpopo Department of Education', 'GOVERNMENT_AUTHORITY', 'Limpopo', 'https://www.edu.limpopo.gov.za/', 'dbe_provincial_education_departments', 'https://www.education.gov.za/ProvincialDepartments.aspx'),
      ('prov_education_mpumalanga', 'Mpumalanga Department of Education', 'GOVERNMENT_AUTHORITY', 'Mpumalanga', 'https://mpeducation.mpg.gov.za/', 'dbe_provincial_education_departments', 'https://www.education.gov.za/ProvincialDepartments.aspx'),
      ('prov_education_north_west', 'North West Department of Education', 'GOVERNMENT_AUTHORITY', 'North West', 'https://education.nwpg.gov.za/', 'dbe_provincial_education_departments', 'https://www.education.gov.za/ProvincialDepartments.aspx'),
      ('prov_education_northern_cape', 'Northern Cape Department of Education', 'GOVERNMENT_AUTHORITY', 'Northern Cape', 'https://ncdoe.ncpg.gov.za/', 'dbe_provincial_education_departments', 'https://www.education.gov.za/ProvincialDepartments.aspx'),
      ('prov_education_western_cape', 'Western Cape Education Department', 'GOVERNMENT_AUTHORITY', 'Western Cape', 'https://wcedonline.westerncape.gov.za/', 'dbe_provincial_education_departments', 'https://www.education.gov.za/ProvincialDepartments.aspx')
  )
  SELECT count(*) INTO identity_conflict_count
  FROM expected e JOIN public.route_providers p USING (provider_key)
  WHERE p.provider_name IS DISTINCT FROM e.provider_name
     OR p.provider_type IS DISTINCT FROM e.provider_type
     OR (e.province IS NOT NULL AND p.province IS DISTINCT FROM e.province)
     OR (e.base_url IS NOT NULL AND p.base_url IS DISTINCT FROM e.base_url);
  IF identity_conflict_count>0 THEN RAISE EXCEPTION 'PUBLIC_INSTITUTION_DIRECTORY_POSTFLIGHT_IDENTITY_MISMATCH %',identity_conflict_count; END IF;

  SELECT count(*) INTO invalid_count
  FROM public.route_providers
  WHERE provider_key=ANY(ARRAY['dhet_university_cput','dhet_university_cut','dhet_university_dut','dhet_university_mut','dhet_university_mandela','dhet_university_nwu','dhet_university_rhodes','dhet_university_smu','dhet_university_spu','dhet_university_stellenbosch','dhet_university_tut','dhet_university_uct','dhet_university_ufh','dhet_university_uj','dhet_university_ukzn','dhet_university_ul','dhet_university_ump','dhet_university_up','dhet_university_unisa','dhet_university_ufs','dhet_university_uwc','dhet_university_wits','dhet_university_vut','dhet_university_unizulu','dhet_university_wsu','dhet_university_univen','dhet_tvet_buffalo-city','dhet_tvet_eastcape-midlands','dhet_tvet_ikhala','dhet_tvet_ingwe','dhet_tvet_king-hintsa','dhet_tvet_king-sabata-dalindyebo','dhet_tvet_lovedale','dhet_tvet_port-elizabeth','dhet_tvet_flavius-mareka','dhet_tvet_goldfields','dhet_tvet_maluti','dhet_tvet_motheo','dhet_tvet_central-johannesburg','dhet_tvet_ekurhuleni-east','dhet_tvet_ekurhuleni-west','dhet_tvet_sedibeng','dhet_tvet_south-west-gauteng','dhet_tvet_tshwane-north','dhet_tvet_tshwane-south','dhet_tvet_western','dhet_tvet_coastal-kzn','dhet_tvet_elangeni','dhet_tvet_esayidi','dhet_tvet_majuba','dhet_tvet_mnambithi','dhet_tvet_mthashana','dhet_tvet_thekwini','dhet_tvet_umfolozi','dhet_tvet_umgungundlovu','dhet_tvet_capricorn','dhet_tvet_lephalale','dhet_tvet_letaba','dhet_tvet_mopani-south-east','dhet_tvet_sekhukhune','dhet_tvet_vhembe','dhet_tvet_waterberg','dhet_tvet_ehlanzeni','dhet_tvet_gert-sibande','dhet_tvet_nkangala','dhet_tvet_northern-cape-rural','dhet_tvet_northern-cape-urban','dhet_tvet_orbit','dhet_tvet_taletso','dhet_tvet_vuselela','dhet_tvet_boland','dhet_tvet_college-of-cape-town','dhet_tvet_false-bay','dhet_tvet_northlink','dhet_tvet_south-cape','dhet_tvet_west-coast','dhet_cet_eastern-cape','dhet_cet_free-state','dhet_cet_gauteng','dhet_cet_kwazulu-natal','dhet_cet_limpopo','dhet_cet_mpumalanga','dhet_cet_north-west','dhet_cet_northern-cape','dhet_cet_western-cape','prov_education_eastern_cape','prov_education_free_state','prov_education_gauteng','prov_education_kwazulu_natal','prov_education_limpopo','prov_education_mpumalanga','prov_education_north_west','prov_education_northern_cape','prov_education_western_cape']::text[])
    AND (verification_status NOT IN ('VERIFIED','NEEDS_REVIEW','STALE','BLOCKED','RISK')
      OR (public_safe=true AND verification_status<>'VERIFIED'));
  IF invalid_count>0 THEN RAISE EXCEPTION 'PUBLIC_INSTITUTION_DIRECTORY_INVALID_VERIFICATION_STATE %',invalid_count; END IF;
  
  WITH expected(provider_key,source_key,source_profile_url) AS (
    VALUES
      ('dhet_university_cput', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_cut', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_dut', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_mut', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_mandela', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_nwu', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_rhodes', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_smu', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_spu', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_stellenbosch', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_tut', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_uct', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_ufh', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_uj', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_ukzn', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_ul', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_ump', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_up', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_unisa', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_ufs', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_uwc', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_wits', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_vut', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_unizulu', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_wsu', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_university_univen', 'dhet_public_universities', 'https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx'),
      ('dhet_tvet_buffalo-city', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_eastcape-midlands', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_ikhala', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_ingwe', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_king-hintsa', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_king-sabata-dalindyebo', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_lovedale', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_port-elizabeth', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_flavius-mareka', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_goldfields', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_maluti', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_motheo', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_central-johannesburg', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_ekurhuleni-east', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_ekurhuleni-west', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_sedibeng', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_south-west-gauteng', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_tshwane-north', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_tshwane-south', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_western', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_coastal-kzn', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_elangeni', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_esayidi', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_majuba', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_mnambithi', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_mthashana', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_thekwini', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_umfolozi', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_umgungundlovu', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_capricorn', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_lephalale', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_letaba', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_mopani-south-east', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_sekhukhune', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_vhembe', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_waterberg', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_ehlanzeni', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_gert-sibande', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_nkangala', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_northern-cape-rural', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_northern-cape-urban', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_orbit', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_taletso', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_vuselela', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_boland', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_college-of-cape-town', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_false-bay', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_northlink', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_south-cape', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_tvet_west-coast', 'dhet_public_tvet_colleges', 'https://www.dhet.gov.za/SitePages/TVETlinks.aspx'),
      ('dhet_cet_eastern-cape', 'dhet_public_cet_colleges', 'https://www.dhet.gov.za/SitePages/CommunityCollege.aspx'),
      ('dhet_cet_free-state', 'dhet_public_cet_colleges', 'https://www.dhet.gov.za/SitePages/CommunityCollege.aspx'),
      ('dhet_cet_gauteng', 'dhet_public_cet_colleges', 'https://www.dhet.gov.za/SitePages/CommunityCollege.aspx'),
      ('dhet_cet_kwazulu-natal', 'dhet_public_cet_colleges', 'https://www.dhet.gov.za/SitePages/CommunityCollege.aspx'),
      ('dhet_cet_limpopo', 'dhet_public_cet_colleges', 'https://www.dhet.gov.za/SitePages/CommunityCollege.aspx'),
      ('dhet_cet_mpumalanga', 'dhet_public_cet_colleges', 'https://www.dhet.gov.za/SitePages/CommunityCollege.aspx'),
      ('dhet_cet_north-west', 'dhet_public_cet_colleges', 'https://www.dhet.gov.za/SitePages/CommunityCollege.aspx'),
      ('dhet_cet_northern-cape', 'dhet_public_cet_colleges', 'https://www.dhet.gov.za/SitePages/CommunityCollege.aspx'),
      ('dhet_cet_western-cape', 'dhet_public_cet_colleges', 'https://www.dhet.gov.za/SitePages/CommunityCollege.aspx'),
      ('prov_education_eastern_cape', 'dbe_provincial_education_departments', 'https://www.education.gov.za/ProvincialDepartments.aspx'),
      ('prov_education_free_state', 'dbe_provincial_education_departments', 'https://www.education.gov.za/ProvincialDepartments.aspx'),
      ('prov_education_gauteng', 'dbe_provincial_education_departments', 'https://www.education.gov.za/ProvincialDepartments.aspx'),
      ('prov_education_kwazulu_natal', 'dbe_provincial_education_departments', 'https://www.education.gov.za/ProvincialDepartments.aspx'),
      ('prov_education_limpopo', 'dbe_provincial_education_departments', 'https://www.education.gov.za/ProvincialDepartments.aspx'),
      ('prov_education_mpumalanga', 'dbe_provincial_education_departments', 'https://www.education.gov.za/ProvincialDepartments.aspx'),
      ('prov_education_north_west', 'dbe_provincial_education_departments', 'https://www.education.gov.za/ProvincialDepartments.aspx'),
      ('prov_education_northern_cape', 'dbe_provincial_education_departments', 'https://www.education.gov.za/ProvincialDepartments.aspx'),
      ('prov_education_western_cape', 'dbe_provincial_education_departments', 'https://www.education.gov.za/ProvincialDepartments.aspx')
  )
  SELECT count(*) INTO missing_evidence
  FROM expected expected_row
  JOIN public.route_providers p USING (provider_key)
  WHERE NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p.metadata->'provider_source_evidence')='array'
      THEN p.metadata->'provider_source_evidence' ELSE '[]'::jsonb END) e(value)
    WHERE e.value->>'source_profile_url'=expected_row.source_profile_url
      AND e.value->>'source_key'=expected_row.source_key
      AND e.value->>'source_authority_id' IS NOT NULL
  );
  IF missing_evidence>0 THEN RAISE EXCEPTION 'PUBLIC_INSTITUTION_DIRECTORY_SOURCE_EVIDENCE_MISSING %',missing_evidence; END IF;
END
$postflight$;

COMMIT;
