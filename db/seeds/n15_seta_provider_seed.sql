-- Kingsmen N15 provider catalogue seed — the 21 SETA directory anchors.
-- The Department of Higher Education and Training lists the 21 SETAs as part of the national skills system.
-- Source entry point: https://www.dhet.gov.za/
-- Reference listing of 21 SETAs: https://pseta.org.za/wp-content/uploads/2020/07/Final-PSETA-OFO-Mapping-Updated-Report-Feb-2021.pdf
-- Retrieved/checked for this seed on 2026-11-02. Official URLs must still be checked for redirects/ownership before relying on them.
-- This seed does NOT assert that any SETA programme, learnership, internship, apprenticeship, or funding window is open.
-- SETA homepage URLs are not application endpoints. Keep safe_to_recommend=false until source-specific review is approved.
-- Run only after migration-ledger/schema reconciliation and approved staging change control.

begin;

insert into public.opportunity_providers
  (provider_ref, provider_name, provider_type, sector, province, official_url,
   accreditation_status, source_confidence, safe_to_recommend, evidence_refs)
values
  ('INST_SETA_AGRISETA','Agricultural Sector Education and Training Authority','SECTOR_EDUCATION_AND_TRAINING_AUTHORITY','SETA',null,'https://www.agriseta.co.za/','NOT_APPLICABLE','HIGH',false,array['https://www.dhet.gov.za/','https://www.agriseta.co.za/']),
  ('INST_SETA_BANKSETA','Banking Sector Education and Training Authority','SECTOR_EDUCATION_AND_TRAINING_AUTHORITY','SETA',null,'https://www.bankseta.org.za/','NOT_APPLICABLE','HIGH',false,array['https://www.dhet.gov.za/','https://www.bankseta.org.za/']),
  ('INST_SETA_CATHSSETA','Culture, Arts, Tourism, Hospitality and Sport Sector Education and Training Authority','SECTOR_EDUCATION_AND_TRAINING_AUTHORITY','SETA',null,'https://cathsseta.org.za/','NOT_APPLICABLE','HIGH',false,array['https://www.dhet.gov.za/','https://cathsseta.org.za/']),
  ('INST_SETA_CETA','Construction Education and Training Authority','SECTOR_EDUCATION_AND_TRAINING_AUTHORITY','SETA',null,'https://www.ceta.org.za/','NOT_APPLICABLE','HIGH',false,array['https://www.dhet.gov.za/','https://www.ceta.org.za/']),
  ('INST_SETA_CHIETA','Chemical Industries Education and Training Authority','SECTOR_EDUCATION_AND_TRAINING_AUTHORITY','SETA',null,'https://www.chieta.org.za/','NOT_APPLICABLE','HIGH',false,array['https://www.dhet.gov.za/','https://www.chieta.org.za/']),
  ('INST_SETA_ETDP_SETA','Education, Training and Development Practices SETA','SECTOR_EDUCATION_AND_TRAINING_AUTHORITY','SETA',null,'https://www.etdpseta.org.za/','NOT_APPLICABLE','HIGH',false,array['https://www.dhet.gov.za/','https://www.etdpseta.org.za/']),
  ('INST_SETA_EWSETA','Energy and Water Sector Education and Training Authority','SECTOR_EDUCATION_AND_TRAINING_AUTHORITY','SETA',null,'https://ewseta.org.za/','NOT_APPLICABLE','HIGH',false,array['https://www.dhet.gov.za/','https://ewseta.org.za/']),
  ('INST_SETA_FASSET','Finance and Accounting Services Sector Education and Training Authority','SECTOR_EDUCATION_AND_TRAINING_AUTHORITY','SETA',null,'https://www.fasset.org.za/','NOT_APPLICABLE','HIGH',false,array['https://www.dhet.gov.za/','https://www.fasset.org.za/']),
  ('INST_SETA_FPM_SETA','Fibre Processing and Manufacturing Sector Education and Training Authority','SECTOR_EDUCATION_AND_TRAINING_AUTHORITY','SETA',null,'https://www.fpmseta.org.za/','NOT_APPLICABLE','HIGH',false,array['https://www.dhet.gov.za/','https://www.fpmseta.org.za/']),
  ('INST_SETA_FOODBEV_SETA','Food and Beverages Manufacturing Sector Education and Training Authority','SECTOR_EDUCATION_AND_TRAINING_AUTHORITY','SETA',null,'https://foodbev.co.za/','NOT_APPLICABLE','HIGH',false,array['https://www.dhet.gov.za/','https://foodbev.co.za/']),
  ('INST_SETA_HWSETA','Health and Welfare Sector Education and Training Authority','SECTOR_EDUCATION_AND_TRAINING_AUTHORITY','SETA',null,'https://www.hwseta.org.za/','NOT_APPLICABLE','HIGH',false,array['https://www.dhet.gov.za/','https://www.hwseta.org.za/']),
  ('INST_SETA_INSETA','Insurance Sector Education and Training Authority','SECTOR_EDUCATION_AND_TRAINING_AUTHORITY','SETA',null,'https://www.inseta.org.za/','NOT_APPLICABLE','HIGH',false,array['https://www.dhet.gov.za/','https://www.inseta.org.za/']),
  ('INST_SETA_LGSETA','Local Government Sector Education and Training Authority','SECTOR_EDUCATION_AND_TRAINING_AUTHORITY','SETA',null,'https://www.lgseta.co.za/','NOT_APPLICABLE','HIGH',false,array['https://www.dhet.gov.za/','https://www.lgseta.co.za/']),
  ('INST_SETA_MICT_SETA','Media, Information and Communication Technologies Sector Education and Training Authority','SECTOR_EDUCATION_AND_TRAINING_AUTHORITY','SETA',null,'https://www.mict.org.za/','NOT_APPLICABLE','HIGH',false,array['https://www.dhet.gov.za/','https://www.mict.org.za/']),
  ('INST_SETA_MERSETA','Manufacturing, Engineering and Related Services Sector Education and Training Authority','SECTOR_EDUCATION_AND_TRAINING_AUTHORITY','SETA',null,'https://www.merseta.org.za/','NOT_APPLICABLE','HIGH',false,array['https://www.dhet.gov.za/','https://www.merseta.org.za/']),
  ('INST_SETA_MQA','Mining Qualifications Authority','SECTOR_EDUCATION_AND_TRAINING_AUTHORITY','SETA',null,'https://www.mqa.org.za/','NOT_APPLICABLE','HIGH',false,array['https://www.dhet.gov.za/','https://www.mqa.org.za/']),
  ('INST_SETA_PSETA','Public Service Sector Education and Training Authority','SECTOR_EDUCATION_AND_TRAINING_AUTHORITY','SETA',null,'https://www.pseta.org.za/','NOT_APPLICABLE','HIGH',false,array['https://www.dhet.gov.za/','https://www.pseta.org.za/']),
  ('INST_SETA_SASSETA','Safety and Security Sector Education and Training Authority','SECTOR_EDUCATION_AND_TRAINING_AUTHORITY','SETA',null,'https://www.sasseta.org.za/','NOT_APPLICABLE','HIGH',false,array['https://www.dhet.gov.za/','https://www.sasseta.org.za/']),
  ('INST_SETA_SERVICES_SETA','Services Sector Education and Training Authority','SECTOR_EDUCATION_AND_TRAINING_AUTHORITY','SETA',null,'https://www.serviceseta.org.za/','NOT_APPLICABLE','HIGH',false,array['https://www.dhet.gov.za/','https://www.serviceseta.org.za/']),
  ('INST_SETA_TETA','Transport Education and Training Authority','SECTOR_EDUCATION_AND_TRAINING_AUTHORITY','SETA',null,'https://www.teta.org.za/','NOT_APPLICABLE','HIGH',false,array['https://www.dhet.gov.za/','https://www.teta.org.za/']),
  ('INST_SETA_WRSETA','Wholesale and Retail Sector Education and Training Authority','SECTOR_EDUCATION_AND_TRAINING_AUTHORITY','SETA',null,'https://www.wrseta.org.za/','NOT_APPLICABLE','HIGH',false,array['https://www.dhet.gov.za/','https://www.wrseta.org.za/'])
on conflict (provider_ref) do update set
  provider_name = excluded.provider_name,
  provider_type = excluded.provider_type,
  sector = excluded.sector,
  official_url = coalesce(public.opportunity_providers.official_url, excluded.official_url),
  evidence_refs = (select array(select distinct unnest(coalesce(public.opportunity_providers.evidence_refs, array[]::text[]) || excluded.evidence_refs))),
  updated_at = now();

commit;
