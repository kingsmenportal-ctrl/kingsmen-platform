-- N03 seed - source authority baseline

INSERT INTO source_authorities (
  source_key,
  source_name,
  source_type,
  base_url,
  default_confidence_band,
  verification_required,
  verification_notes
)
VALUES
  ('dhet', 'Department of Higher Education and Training', 'government', 'https://www.dhet.gov.za', 'A', true, 'Official South African higher education authority.'),
  ('nsfas', 'NSFAS', 'government_funding', 'https://www.nsfas.org.za', 'A', true, 'Official NSFAS funding source.'),
  ('cao', 'Central Applications Office', 'application_portal', 'https://www.cao.ac.za', 'A', true, 'Official CAO application source.'),
  ('saqa', 'SAQA', 'qualification_authority', 'https://www.saqa.org.za', 'A', true, 'Official qualification authority.'),
  ('qcto', 'QCTO', 'quality_council', 'https://www.qcto.org.za', 'A', true, 'Official occupational qualifications council.')
ON CONFLICT (source_key) DO UPDATE SET
  source_name = EXCLUDED.source_name,
  source_type = EXCLUDED.source_type,
  base_url = EXCLUDED.base_url,
  default_confidence_band = EXCLUDED.default_confidence_band,
  verification_required = EXCLUDED.verification_required,
  verification_notes = EXCLUDED.verification_notes,
  updated_at = now();