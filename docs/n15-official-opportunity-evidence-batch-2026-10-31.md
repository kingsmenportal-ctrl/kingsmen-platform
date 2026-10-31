# N15 official opportunity evidence batch — 31 October 2026

This is a review-only seed migration, not an assertion that the national opportunity catalogue is complete. It contains three official providers and nine current listings observed on 31 October 2026: two National Department of Health vacancies, six Department of Basic Education vacancies in the official bulletin, and the North West Provincial Government's 2027 Victor Thebe Sifora bursary intake.

## Source evidence

- National Department of Health vacancies: https://www.health.gov.za/vacancies/
  - Director: Forensic Mental Health, ref NDOH 82/2026; official PDF states a closing date of 9 November 2026: https://www.health.gov.za/wp-content/uploads/2026/10/Director.-Forensic-Mental-Health-contract-post.pdf
  - Secretary, Hospital Facilities Planning, ref NDOH 87/2026; official PDF states a closing date of 9 November 2026: https://www.health.gov.za/wp-content/uploads/2026/10/Secretary.-Hospital-Facilities-Planning.pdf
- Department of Basic Education vacancies: https://www.education.gov.za/Vacancies.aspx
  - Official bulletin PDF for DBE/74/2026 through DBE/79/2026: https://www.education.gov.za/LinkClick.aspx?fileticket=orD2gVikBik%3D&mid=14680&portalid=0&tabid=241
  - The bulletin states 6 November 2026 as the closing date. It does not provide a closing time in the inspected text, so the migration deliberately leaves `closes_at` null and marks those deadlines `MANUAL_CHECK_REQUIRED`.
- North West Provincial Government, Victor Thebe Sifora Provincial Bursary Scheme 2027: https://bursaries.nwpg.gov.za/
  - The portal states that applications are open, opened 13 October 2026, and close 13 November 2026 at 23:59 SAST.
  - The portal also warns that current intake requirements may differ from the previous advert. Kingsmen must not infer eligibility from the old advert.

## Safety and release gates

- The migration requires recent passed encrypted-backup and isolated-restore evidence in `backup_restore_drills`. Staging currently has zero recorded backup/restore drills, so the migration must fail closed if attempted now.
- It upserts only stable provider/programme/source-observation/deadline references and rejects conflicting existing identities.
- Source observations expire after 24 hours; refresh and reverify the exact official page before later candidate delivery. They are not durable proof of future availability.
- No candidate-specific matches, submissions, receipts, or outcomes are created. A match must be separately reviewed for the individual candidate.
- Do not apply until independent review, formal change approval, backup/restore sign-off, and preflight against the target staging schema. No staging writes were made while preparing this batch.

Run `node scripts/validators/validate-n15-official-evidence-batch.mjs` for the source-contract check.
