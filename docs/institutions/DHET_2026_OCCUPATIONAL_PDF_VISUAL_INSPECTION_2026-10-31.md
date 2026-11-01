# DHET 2026 occupational-qualification PDF visual inspection — 31 October 2026

**Disposition: visual source layout inspected; full row-by-row transcription reconciliation and independent human sign-off remain outstanding. Do not import qualification/provider pairs from this note alone.**

## Source and method

- Publisher: Department of Higher Education and Training (South Africa).
- Title: *List of Occupational Qualifications Offered at Public TVET Colleges 2026*.
- Official PDF: https://www.dhet.gov.za/Technical%20and%20Vocational%20Education%20and%20Training%20Co/List%20of%20Occupational%20Programmes%20updated%20for%202026%20for%20website.pdf
- PDF length: 11 pages (PDF page indices 0–10).
- Visual evidence: each of the 11 PDF pages was rendered and inspected during this review. The local binary could not be downloaded in this environment, so no local-file checksum is asserted.
- Scope inspected: table structure, row boundaries across page breaks, visible spelling variants, repeated college labels, and the separate Section B heading/table. This is not a complete cell-by-cell transcription audit.

## Findings that affect the manifest

1. The document's table headings explicitly distinguish **SAQA ID** from **NUMBER**. Preserve both fields separately; do not infer that the published NUMBER is a SAQA identifier.
2. Section A is the 2026 list of occupational qualifications offered at public TVET colleges. Section B is a separate Dual System Pilot Project (DSPP) / Centres of Specialisation table. It must not be appended to Section A as if it were the same list.
3. At least some strings currently described as likely extraction/OCR errors are visibly printed that way in the rendered PDF. Examples include **“Elangeni TVET Coleege”**, **“Gert Sibance TVET College”**, and **“Tshwane Nort TVET College”**. Record these as source-published spelling/label variants until a human reviewer confirms whether the source itself contains a typo; do not silently normalize them.
4. The Boilermaker row (SAQA ID **93626**, published NUMBER **60420004**) visibly repeats **“Ekurhuleni East TVET College”** in the participating-colleges column. Preserve the raw source occurrence for audit, but do not create duplicate canonical provider–qualification relationships. The human reviewer must decide how the duplicate is represented in the transcription evidence.
5. College labels and rows continue across page breaks. Text-extraction output can concatenate adjacent rows or split labels at page boundaries; the page image/table borders, not the extracted text sequence alone, must determine row assignment.
6. The 2026 list includes qualification records with empty participating-college cells (for example, the Conference and Events Organiser row on PDF page index 9). Do not invent a college association for an empty cell.
7. The rendered Section B table on PDF page index 9 contains the Electrician and Plumber DSPP entries. These are out of scope for the current Section A manifest and should be tracked as a separately reviewed source section.

## Required follow-up before import

- An independent reviewer must compare every one of the 38 claimed Section A qualification records and each participating-college cell against the rendered PDF, recording a page/row disposition.
- Reconcile the claimed 38 qualification rows, 331 raw college mentions, and 56 distinct source-name strings against the visual source; these are manifest claims until that reconciliation is signed off.
- Reconcile the complete raw source-name inventory to the 50-college canonical TVET directory. Keep unresolved names and uncertain matches out of provider-programme import.
- Separate source-published spelling variants from canonical institution names; retain raw source strings alongside any reviewed alias decision.
- Confirm that no Section B row has entered the Section A seed or the current provider import.
- Preserve the current fail-closed values: unknown intake/deadline/eligibility, unverified application route, no partnership, no integration, no automation authority, and no provider receipt claim.

## Evidence boundary

This inspection establishes that the official PDF can be rendered and its table structure can be inspected. It **does not** certify the manifest's counts, every transcribed cell, the legal/registration status of a college, a current programme intake, a deadline, candidate eligibility, or a Kingsmen application route.
