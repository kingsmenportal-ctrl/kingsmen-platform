# RC1 visual smoke correction — 31 October 2026

## Exact defects verified from the failed 30 October artifact

The 48-route/viewport smoke completed HTTP checks and captured 48 screenshots, but failed four assertions:

- `/free-destiny-map/` at mobile 360×800: document width 426px, overflowing the 360px viewport.
- `/candidate/opportunity-matches` at mobile 360×800, tablet 768×1024 and desktop 1440×1000: primary-heading contrast 1.13:1, below the 3:1 large-text threshold.

The actual screenshot shows that the candidate opportunity header has a white background while its heading and introduction are nearly white. The global `h1`, `p`, `li`, `label` and `small` colour rules were ordinary unlayered CSS imported after Tailwind's layered utilities. In the CSS cascade, unlayered author rules override normal declarations in Tailwind's named layers. This prevented text utilities such as `text-slate-950` and `text-slate-600` from controlling the intended foreground colours.

## Correction carried on the current RC base

- Place the global design baseline in Tailwind's `@layer base`, so Tailwind utility classes can override base typography and colour where a component specifies them.
- Keep form controls in the Free Destiny Map grid shrinkable with `min-width: 0`, `max-width: 100%`, border-box sizing and mobile-responsive page padding. Do not mask overflow by clipping the document.
- Extend the smoke report to record and check the primary introductory paragraph contrast as well as body and heading contrast.
- Keep the 16-route / 3-viewport suite, capture all 48 screenshots and preserve the no-baseline-approved state. A passing computed-style smoke is not a reviewed golden-image pixel diff.

## Acceptance boundary

The repair is source-only until the new branch's exact-head Candidate Experience CI, Active Candidate Capacity, Source Guard, Jarvis Runtime and Release Evidence all pass. Inspect the resulting screenshots, resolve every failed assertion and obtain independent human review. This does not constitute a WCAG audit or release approval.
