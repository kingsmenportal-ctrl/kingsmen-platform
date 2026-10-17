# Build context must be the repository root:
#   docker build --file apps/api/Dockerfile --tag kingsmen-api:local .
# Intentionally uses npm ci: the committed apps/api/package-lock.json is a
# release prerequisite. Do not replace this with npm install to bypass it.
FROM node:22-bookworm-slim AS build
WORKDIR /workspace/apps/api

COPY apps/api/package.json apps/api/package-lock.json ./
RUN npm ci

COPY apps/api/ ./
RUN npm run build

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV PORT=8080
ENV KINGSMEN_API_HOST=0.0.0.0
# Production containers must not silently fall back to process-local storage.
ENV KINGSMEN_TRUTH_VAULT_MODE=postgres
WORKDIR /app

COPY --from=build --chown=node:node /workspace/apps/api/package.json ./package.json
COPY --from=build --chown=node:node /workspace/apps/api/package-lock.json ./package-lock.json
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build --chown=node:node /workspace/apps/api/dist ./dist
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8080/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "dist/server.js"]
