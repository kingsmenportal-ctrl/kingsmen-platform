-- Kingsmen N15 provider catalogue seed — public university directory anchors.
-- Source baseline retrieved 2026-11-02 from:
--   https://www.education.gov.za/FurtherStudies/Universities/tabid/393/Default.aspx
--   https://www.dhet.gov.za/
-- This imports institution identities only. It does NOT assert programme availability,
-- current application windows, eligibility, accreditation scope, or provider integration.
-- Keep safe_to_recommend=false until an institution-specific evidence review is approved.
-- Run only after migration-ledger/schema reconciliation and approved staging change control.

begin;

insert into public.opportunity_providers
  (provider_ref, provider_name, provider_type, sector, province, official_url,
   accreditation_status, source_confidence, safe_to_recommend, evidence_refs)
values
  ('INST_PUBLIC_UNI_CPUT','Cape Peninsula University of Technology','PUBLIC_HIGHER_EDUCATION_INSTITUTION','UNIVERSITY','Western Cape','https://www.cput.ac.za','NEEDS_REVIEW','HIGH',false,array['https://www.education.gov.za/FurtherStudies/Universities/tabid/393/Default.aspx','https://www.cput.ac.za']),
  ('INST_PUBLIC_UNI_UCT','University of Cape Town','PUBLIC_HIGHER_EDUCATION_INSTITUTION','UNIVERSITY','Western Cape','https://www.uct.ac.za','NEEDS_REVIEW','HIGH',false,array['https://www.education.gov.za/FurtherStudies/Universities/tabid/393/Default.aspx','https://www.uct.ac.za']),
  ('INST_PUBLIC_UNI_CUT','Central University of Technology','PUBLIC_HIGHER_EDUCATION_INSTITUTION','UNIVERSITY','Free State','https://www.cut.ac.za','NEEDS_REVIEW','HIGH',false,array['https://www.education.gov.za/FurtherStudies/Universities/tabid/393/Default.aspx','https://www.cut.ac.za']),
  ('INST_PUBLIC_UNI_DUT','Durban University of Technology','PUBLIC_HIGHER_EDUCATION_INSTITUTION','UNIVERSITY','KwaZulu-Natal','https://www.dut.ac.za','NEEDS_REVIEW','HIGH',false,array['https://www.education.gov.za/FurtherStudies/Universities/tabid/393/Default.aspx','https://www.dut.ac.za']),
  ('INST_PUBLIC_UNI_UFH','University of Fort Hare','PUBLIC_HIGHER_EDUCATION_INSTITUTION','UNIVERSITY','Eastern Cape','https://www.ufh.ac.za','NEEDS_REVIEW','HIGH',false,array['https://www.education.gov.za/FurtherStudies/Universities/tabid/393/Default.aspx','https://www.ufh.ac.za']),
  ('INST_PUBLIC_UNI_UFS','University of the Free State','PUBLIC_HIGHER_EDUCATION_INSTITUTION','UNIVERSITY','Free State','https://www.ufs.ac.za','NEEDS_REVIEW','HIGH',false,array['https://www.education.gov.za/FurtherStudies/Universities/tabid/393/Default.aspx','https://www.ufs.ac.za']),
  ('INST_PUBLIC_UNI_UJ','University of Johannesburg','PUBLIC_HIGHER_EDUCATION_INSTITUTION','UNIVERSITY','Gauteng','https://www.uj.ac.za','NEEDS_REVIEW','HIGH',false,array['https://www.education.gov.za/FurtherStudies/Universities/tabid/393/Default.aspx','https://www.uj.ac.za']),
  ('INST_PUBLIC_UNI_UKZN','University of KwaZulu-Natal','PUBLIC_HIGHER_EDUCATION_INSTITUTION','UNIVERSITY','KwaZulu-Natal','https://www.ukzn.ac.za','NEEDS_REVIEW','HIGH',false,array['https://www.education.gov.za/FurtherStudies/Universities/tabid/393/Default.aspx','https://www.ukzn.ac.za']),
  ('INST_PUBLIC_UNI_UL','University of Limpopo','PUBLIC_HIGHER_EDUCATION_INSTITUTION','UNIVERSITY','Limpopo','https://www.ul.ac.za','NEEDS_REVIEW','HIGH',false,array['https://www.education.gov.za/FurtherStudies/Universities/tabid/393/Default.aspx','https://www.ul.ac.za']),
  ('INST_PUBLIC_UNI_MUT','Mangosuthu University of Technology','PUBLIC_HIGHER_EDUCATION_INSTITUTION','UNIVERSITY','KwaZulu-Natal','https://www.mut.ac.za','NEEDS_REVIEW','HIGH',false,array['https://www.education.gov.za/FurtherStudies/Universities/tabid/393/Default.aspx','https://www.mut.ac.za']),
  ('INST_PUBLIC_UNI_UMP','University of Mpumalanga','PUBLIC_HIGHER_EDUCATION_INSTITUTION','UNIVERSITY','Mpumalanga','https://www.ump.ac.za','NEEDS_REVIEW','HIGH',false,array['https://www.education.gov.za/FurtherStudies/Universities/tabid/393/Default.aspx','https://www.ump.ac.za']),
  ('INST_PUBLIC_UNI_MANDELA','Nelson Mandela University','PUBLIC_HIGHER_EDUCATION_INSTITUTION','UNIVERSITY','Eastern Cape','https://www.mandela.ac.za','NEEDS_REVIEW','HIGH',false,array['https://www.education.gov.za/FurtherStudies/Universities/tabid/393/Default.aspx','https://www.mandela.ac.za']),
  ('INST_PUBLIC_UNI_NWU','North-West University','PUBLIC_HIGHER_EDUCATION_INSTITUTION','UNIVERSITY','North West','https://www.nwu.ac.za','NEEDS_REVIEW','HIGH',false,array['https://www.education.gov.za/FurtherStudies/Universities/tabid/393/Default.aspx','https://www.nwu.ac.za']),
  ('INST_PUBLIC_UNI_UP','University of Pretoria','PUBLIC_HIGHER_EDUCATION_INSTITUTION','UNIVERSITY','Gauteng','https://www.up.ac.za','NEEDS_REVIEW','HIGH',false,array['https://www.education.gov.za/FurtherStudies/Universities/tabid/393/Default.aspx','https://www.up.ac.za']),
  ('INST_PUBLIC_UNI_RU','Rhodes University','PUBLIC_HIGHER_EDUCATION_INSTITUTION','UNIVERSITY','Eastern Cape','https://www.ru.ac.za','NEEDS_REVIEW','HIGH',false,array['https://www.education.gov.za/FurtherStudies/Universities/tabid/393/Default.aspx','https://www.ru.ac.za']),
  ('INST_PUBLIC_UNI_SMU','Sefako Makgatho Health Sciences University','PUBLIC_HIGHER_EDUCATION_INSTITUTION','UNIVERSITY','Gauteng','https://www.smu.ac.za','NEEDS_REVIEW','HIGH',false,array['https://www.education.gov.za/FurtherStudies/Universities/tabid/393/Default.aspx','https://www.smu.ac.za']),
  ('INST_PUBLIC_UNI_SPU','Sol Plaatje University','PUBLIC_HIGHER_EDUCATION_INSTITUTION','UNIVERSITY','Northern Cape','https://www.spu.ac.za','NEEDS_REVIEW','HIGH',false,array['https://www.education.gov.za/FurtherStudies/Universities/tabid/393/Default.aspx','https://www.spu.ac.za']),
  ('INST_PUBLIC_UNI_UNISA','University of South Africa','PUBLIC_HIGHER_EDUCATION_INSTITUTION','UNIVERSITY','Gauteng','https://www.unisa.ac.za','NEEDS_REVIEW','HIGH',false,array['https://www.education.gov.za/FurtherStudies/Universities/tabid/393/Default.aspx','https://www.unisa.ac.za']),
  ('INST_PUBLIC_UNI_SU','Stellenbosch University','PUBLIC_HIGHER_EDUCATION_INSTITUTION','UNIVERSITY','Western Cape','https://www.sun.ac.za','NEEDS_REVIEW','HIGH',false,array['https://www.education.gov.za/FurtherStudies/Universities/tabid/393/Default.aspx','https://www.sun.ac.za']),
  ('INST_PUBLIC_UNI_TUT','Tshwane University of Technology','PUBLIC_HIGHER_EDUCATION_INSTITUTION','UNIVERSITY','Gauteng','https://www.tut.ac.za','NEEDS_REVIEW','HIGH',false,array['https://www.education.gov.za/FurtherStudies/Universities/tabid/393/Default.aspx','https://www.tut.ac.za']),
  ('INST_PUBLIC_UNI_VUT','Vaal University of Technology','PUBLIC_HIGHER_EDUCATION_INSTITUTION','UNIVERSITY','Gauteng','https://www.vut.ac.za','NEEDS_REVIEW','HIGH',false,array['https://www.education.gov.za/FurtherStudies/Universities/tabid/393/Default.aspx','https://www.vut.ac.za']),
  ('INST_PUBLIC_UNI_UNIVEN','University of Venda','PUBLIC_HIGHER_EDUCATION_INSTITUTION','UNIVERSITY','Limpopo','https://www.univen.ac.za','NEEDS_REVIEW','HIGH',false,array['https://www.education.gov.za/FurtherStudies/Universities/tabid/393/Default.aspx','https://www.univen.ac.za']),
  ('INST_PUBLIC_UNI_WSU','Walter Sisulu University','PUBLIC_HIGHER_EDUCATION_INSTITUTION','UNIVERSITY','Eastern Cape','https://www.wsu.ac.za','NEEDS_REVIEW','HIGH',false,array['https://www.education.gov.za/FurtherStudies/Universities/tabid/393/Default.aspx','https://www.wsu.ac.za']),
  ('INST_PUBLIC_UNI_UWC','University of the Western Cape','PUBLIC_HIGHER_EDUCATION_INSTITUTION','UNIVERSITY','Western Cape','https://www.uwc.ac.za','NEEDS_REVIEW','HIGH',false,array['https://www.education.gov.za/FurtherStudies/Universities/tabid/393/Default.aspx','https://www.uwc.ac.za']),
  ('INST_PUBLIC_UNI_WITS','University of the Witwatersrand','PUBLIC_HIGHER_EDUCATION_INSTITUTION','UNIVERSITY','Gauteng','https://www.wits.ac.za','NEEDS_REVIEW','HIGH',false,array['https://www.education.gov.za/FurtherStudies/Universities/tabid/393/Default.aspx','https://www.wits.ac.za']),
  ('INST_PUBLIC_UNI_UNIZULU','University of Zululand','PUBLIC_HIGHER_EDUCATION_INSTITUTION','UNIVERSITY','KwaZulu-Natal','https://www.unizulu.ac.za','NEEDS_REVIEW','HIGH',false,array['https://www.education.gov.za/FurtherStudies/Universities/tabid/393/Default.aspx','https://www.unizulu.ac.za'])
on conflict (provider_ref) do update set
  provider_name = excluded.provider_name,
  provider_type = excluded.provider_type,
  sector = excluded.sector,
  province = excluded.province,
  official_url = coalesce(public.opportunity_providers.official_url, excluded.official_url),
  evidence_refs = (select array(select distinct unnest(coalesce(public.opportunity_providers.evidence_refs, array[]::text[]) || excluded.evidence_refs))),
  updated_at = now();

commit;
