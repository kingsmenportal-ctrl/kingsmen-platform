# Kingsmen temporary GitHub Pages site

## Purpose
This is a temporary, public, static information site for Kingsmen. It is isolated on the `pages-temp-static` branch so the existing Next.js application and the `main` branch are not overwritten.

## Expected URL
After enabling GitHub Pages from branch `pages-temp-static`, folder `/ (root)`, the expected URL is:

- `https://kingsmenportal-ctrl.github.io/kingsmen-platform/`

GitHub Pages settings must be saved by a repository administrator. This document does not claim that Pages has been enabled or that the site is live.

## Enable publishing
1. Open the repository Settings.
2. Open Pages.
3. Under Build and deployment, choose **Deploy from a branch**.
4. Select branch `pages-temp-static`.
5. Select folder `/ (root)`.
6. Save, then wait for the deployment status to complete.
7. Open the URL above and verify the page, navigation and mobile layout.

## Boundaries
- This branch is a static public website; it is not the production Kingsmen app.
- Do not add secrets, candidate information, uploaded documents, or private records to this branch.
- GitHub Pages cannot run the Kingsmen API, database, server-side PayFast ITN verification, or server-side Resend integration.
- PayFast sandbox must be integrated through a real backend endpoint and independently verified ITN; browser return URLs are not proof of payment.
- Custom-domain Resend DNS verification requires control of the eventual domain's DNS zone.
- The current application is Next.js and the repository's Netlify configuration targets the web app. Do not assume that the full Next.js app can be published directly as static files without checking its server-side dependencies.

## Release evidence
Record separately: implementation, checks, deployment result, and browser end-to-end verification. Do not describe the site as live until GitHub Pages deployment and the published URL have been checked.
