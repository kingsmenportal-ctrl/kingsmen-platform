-- Kingsmen N15 provider catalogue seed — public TVET directory anchors.
-- Source baseline retrieved 2026-11-02 from the NSFAS institution directory and DHET institutional resources:
--   https://nsfas.org.za/content/institutions.html
--   https://www.dhet.gov.za/
-- This batch imports institution identities only. It does NOT assert programme availability,
-- current application windows, eligibility, campus-specific offerings, accreditation scope, or integration.
-- official_url is intentionally NULL until the individual college domain is verified from an authoritative source.
-- Keep safe_to_recommend=false until institution-specific evidence and source freshness are reviewed.
-- Run only after migration-ledger/schema reconciliation and approved staging change control.

begin;

insert into public.opportunity_providers
  (provider_ref, provider_name, provider_type, sector, province, official_url,
   accreditation_status, source_confidence, safe_to_recommend, evidence_refs)
values
  ('INST_PUBLIC_TVET_BOLAND','Boland TVET College','PUBLIC_TVET_COLLEGE','TVET','Western Cape',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_BUFFALO_CITY','Buffalo City TVET College','PUBLIC_TVET_COLLEGE','TVET','Eastern Cape',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_CAPRICORN','Capricorn TVET College','PUBLIC_TVET_COLLEGE','TVET','Limpopo',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_CENTRAL_JOHANNESBURG','Central Johannesburg TVET College','PUBLIC_TVET_COLLEGE','TVET','Gauteng',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_COASTAL_KZN','Coastal KZN TVET College','PUBLIC_TVET_COLLEGE','TVET','KwaZulu-Natal',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_COLLEGE_CAPE_TOWN','College of Cape Town for TVET','PUBLIC_TVET_COLLEGE','TVET','Western Cape',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_EASTCAPE_MIDLANDS','Eastcape Midlands TVET College','PUBLIC_TVET_COLLEGE','TVET','Eastern Cape',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_EHLANZENI','Ehlanzeni TVET College','PUBLIC_TVET_COLLEGE','TVET','Mpumalanga',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_EKURHULENI_EAST','Ekurhuleni East TVET College','PUBLIC_TVET_COLLEGE','TVET','Gauteng',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_EKURHULENI_WEST','Ekurhuleni West TVET College','PUBLIC_TVET_COLLEGE','TVET','Gauteng',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_ELANGENI','Elangeni TVET College','PUBLIC_TVET_COLLEGE','TVET','KwaZulu-Natal',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_ESAYIDI','Esayidi TVET College','PUBLIC_TVET_COLLEGE','TVET','KwaZulu-Natal',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_FALSE_BAY','False Bay TVET College','PUBLIC_TVET_COLLEGE','TVET','Western Cape',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_FLAVIUS_MAREKA','Flavius Mareka TVET College','PUBLIC_TVET_COLLEGE','TVET','Free State',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_GERT_SIBANDE','Gert Sibande TVET College','PUBLIC_TVET_COLLEGE','TVET','Mpumalanga',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_GOLDFIELDS','Goldfields TVET College','PUBLIC_TVET_COLLEGE','TVET','Free State',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_IKHALA','Ikhala TVET College','PUBLIC_TVET_COLLEGE','TVET','Eastern Cape',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_INGWE','Ingwe TVET College','PUBLIC_TVET_COLLEGE','TVET','Eastern Cape',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_KING_HINTSA','King Hintsa TVET College','PUBLIC_TVET_COLLEGE','TVET','Eastern Cape',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_KING_SABATA_DALINDYEBO','King Sabata Dalindyebo TVET College','PUBLIC_TVET_COLLEGE','TVET','Eastern Cape',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_LEPHALALE','Lephalale TVET College','PUBLIC_TVET_COLLEGE','TVET','Limpopo',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_LETABA','Letaba TVET College','PUBLIC_TVET_COLLEGE','TVET','Limpopo',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_LOVEDALE','Lovedale TVET College','PUBLIC_TVET_COLLEGE','TVET','Eastern Cape',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_MAJUBA','Majuba TVET College','PUBLIC_TVET_COLLEGE','TVET','KwaZulu-Natal',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_MALUTI','Maluti TVET College','PUBLIC_TVET_COLLEGE','TVET','Free State',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_MNAMBITHI','Mnambithi TVET College','PUBLIC_TVET_COLLEGE','TVET','KwaZulu-Natal',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_MOPANI_SOUTH_EAST','Mopani South East TVET College','PUBLIC_TVET_COLLEGE','TVET','Limpopo',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_MOTHEO','Motheo TVET College','PUBLIC_TVET_COLLEGE','TVET','Free State',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_MTHASHANA','Mthashana TVET College','PUBLIC_TVET_COLLEGE','TVET','KwaZulu-Natal',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_NKANGALA','Nkangala TVET College','PUBLIC_TVET_COLLEGE','TVET','Mpumalanga',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_NORTHERN_CAPE_RURAL','Northern Cape Rural TVET College','PUBLIC_TVET_COLLEGE','TVET','Northern Cape',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_NORTHERN_CAPE_URBAN','Northern Cape Urban TVET College','PUBLIC_TVET_COLLEGE','TVET','Northern Cape',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_NORTHLINK','Northlink TVET College','PUBLIC_TVET_COLLEGE','TVET','Western Cape',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_ORBIT','Orbit TVET College','PUBLIC_TVET_COLLEGE','TVET','North West',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_PORT_ELIZABETH','Port Elizabeth TVET College','PUBLIC_TVET_COLLEGE','TVET','Eastern Cape',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_SEDIBENG','Sedibeng TVET College','PUBLIC_TVET_COLLEGE','TVET','Gauteng',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_SEKHUKHUNE','Sekhukhune TVET College','PUBLIC_TVET_COLLEGE','TVET','Limpopo',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_SOUTH_CAPE','South Cape TVET College','PUBLIC_TVET_COLLEGE','TVET','Western Cape',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_SOUTH_WEST_GAUTENG','South West Gauteng TVET College','PUBLIC_TVET_COLLEGE','TVET','Gauteng',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_TALETSO','Taletso TVET College','PUBLIC_TVET_COLLEGE','TVET','North West',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_THEKWINI','Thekwini TVET College','PUBLIC_TVET_COLLEGE','TVET','KwaZulu-Natal',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_TSHWANE_NORTH','Tshwane North TVET College','PUBLIC_TVET_COLLEGE','TVET','Gauteng',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_TSHWANE_SOUTH','Tshwane South TVET College','PUBLIC_TVET_COLLEGE','TVET','Gauteng',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_UMFOLOZI','Umfolozi TVET College','PUBLIC_TVET_COLLEGE','TVET','KwaZulu-Natal',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_UMGUNGUNDLOVU','Umgungundlovu TVET College','PUBLIC_TVET_COLLEGE','TVET','KwaZulu-Natal',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_VHEMBE','Vhembe TVET College','PUBLIC_TVET_COLLEGE','TVET','Limpopo',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_VUSELELA','Vuselela TVET College','PUBLIC_TVET_COLLEGE','TVET','North West',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_WATERBERG','Waterberg TVET College','PUBLIC_TVET_COLLEGE','TVET','Limpopo',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_WEST_COAST','West Coast TVET College','PUBLIC_TVET_COLLEGE','TVET','Western Cape',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/']),
  ('INST_PUBLIC_TVET_WESTERN_COLLEGE','Western College for TVET','PUBLIC_TVET_COLLEGE','TVET','Gauteng',null,'NEEDS_REVIEW','HIGH',false,array['https://nsfas.org.za/content/institutions.html','https://www.dhet.gov.za/'])
on conflict (provider_ref) do update set
  provider_name = excluded.provider_name,
  provider_type = excluded.provider_type,
  sector = excluded.sector,
  province = excluded.province,
  evidence_refs = (select array(select distinct unnest(coalesce(public.opportunity_providers.evidence_refs, array[]::text[]) || excluded.evidence_refs))),
  updated_at = now();

commit;
