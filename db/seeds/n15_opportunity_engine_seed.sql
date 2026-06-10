insert into public.opportunity_source_authorities
(authority_ref, authority_name, authority_type, base_url, sector_scope, confidence_band, notes)
values
('AUTH_DHET','Department of Higher Education and Training','GOVERNMENT','https://www.dhet.gov.za',array['UNIVERSITY','TVET','PRIVATE_COLLEGE'],'OFFICIAL_VERIFIED','Official higher education and training authority source.'),
('AUTH_NSFAS','National Student Financial Aid Scheme','FUNDING_AUTHORITY','https://www.nsfas.org.za',array['NSFAS','BURSARY','FUNDING'],'OFFICIAL_VERIFIED','Official NSFAS funding authority source.'),
('AUTH_CAO','Central Applications Office','APPLICATION_AUTHORITY','https://www.cao.ac.za',array['CAO','UNIVERSITY','TVET'],'OFFICIAL_VERIFIED','Official CAO application authority source.'),
('AUTH_SAQA','South African Qualifications Authority','QUALIFICATION_AUTHORITY','https://www.saqa.org.za',array['PRIVATE_COLLEGE','QCTO','QUALIFICATION'],'OFFICIAL_VERIFIED','Qualification registration and NQF authority source.'),
('AUTH_QCTO','Quality Council for Trades and Occupations','QUALITY_COUNCIL','https://www.qcto.org.za',array['QCTO','SETA','LEARNERSHIP','OCCUPATIONAL'],'OFFICIAL_VERIFIED','Occupational qualification quality council source.'),
('AUTH_CHE','Council on Higher Education','QUALITY_COUNCIL','https://www.che.ac.za',array['UNIVERSITY','PRIVATE_COLLEGE'],'OFFICIAL_VERIFIED','Higher education quality council source.')
on conflict (authority_ref) do update set
  authority_name = excluded.authority_name,
  authority_type = excluded.authority_type,
  base_url = excluded.base_url,
  sector_scope = excluded.sector_scope,
  confidence_band = excluded.confidence_band,
  notes = excluded.notes,
  active = true,
  updated_at = now();