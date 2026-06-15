# N21.2 Export Appendix

Added export barrels so later modules can import document extraction and live public repo adapters cleanly:

```text
apps/web/src/lib/documents/extraction/index.ts
apps/web/src/lib/public-repos/live/adapters/index.ts
```

Validator:

```text
scripts/validators/validate-n21-docling-adapter-route-exports.mjs
```
