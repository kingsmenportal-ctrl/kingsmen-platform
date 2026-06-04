# N05-DOCUMENT-04 — Repository / Upload Gateway / API Route Boundary

Creates the Document Vault repository and API route boundary:
- document repository interface
- signed upload gateway
- signed read gateway
- candidate-safe document API shell
- API route must not expose service_role
- candidate can request signed upload/read for own documents only
- candidate cannot verify/reject/delete documents
- productionReady remains false