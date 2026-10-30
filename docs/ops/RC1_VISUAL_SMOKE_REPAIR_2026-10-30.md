# RC1 visual smoke correction — 30 October 2026

## Defect found

The existing browser smoke run reported 48 successful HTTP route/viewport checks, but inspection of the stored screenshots showed that candidate, reviewer and founder pages were rendered without the utility styles used in their JSX. The web application had no Tailwind/PostCSS configuration, no imported application-wide stylesheet, and no Tailwind or PostCSS packages in the web app manifest. The homepage and package page were independently styled with inline CSS, which masked the missing global stylesheet.

## Correction

- Add Tailwind CSS 4.3.3 and the matching PostCSS plugin 4.3.3; pin PostCSS 8.5.32.
- Configure the supported Tailwind PostCSS integration and import a global stylesheet from the App Router root layout.
- Set an accessible dark visual baseline for body text, links, focus indicators and form controls; provide semantic styling for the standalone founder and finance pages.
- Extend the browser smoke run with computed body and heading contrast assertions and a check that the candidate dashboard's expected slate-background utility is actually applied.

## Validation boundary

The previous screenshot artefact was capture-only. It did not use an approved reference baseline, and therefore did not establish pixel-diff or visual-regression success. The new computed-style assertions detect a subset of presentation regressions; they do not replace reviewed screenshots, approved visual baselines, manual keyboard/screen-reader review or a full WCAG audit.

The release remains blocked until all 48 screenshots are reviewed after the fix, pixel comparison is executed against approved golden captures, and independent review is recorded.
