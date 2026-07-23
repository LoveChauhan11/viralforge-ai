# syntax=docker/dockerfile:1.7

# ViralForge monorepo images — build with:
#   docker build --target api -t viralforge-api .
# Targets: api | web | worker-general | worker-media | worker-ai | scheduler | migrate

ARG NODE_VERSION=22.14.0

FROM node:${NODE_VERSION}-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable \
  && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json .npmrc ./
COPY scripts ./scripts
COPY apps ./apps
COPY workers ./workers
COPY packages ./packages
RUN pnpm install --frozen-lockfile

FROM deps AS builder
# Explicit dependency order; clear any stray incremental caches.
RUN find . -name '*.tsbuildinfo' -delete \
  && pnpm --filter @viralforge/contracts build \
  && test -f packages/contracts/dist/index.d.ts \
  && pnpm --filter @viralforge/domain build \
  && pnpm --filter @viralforge/config build \
  && pnpm --filter @viralforge/observability build \
  && pnpm --filter @viralforge/providers build \
  && pnpm --filter @viralforge/storage build \
  && pnpm --filter @viralforge/service-kit build \
  && pnpm --filter @viralforge/auth build \
  && pnpm --filter @viralforge/database build \
  && pnpm --filter @viralforge/queue build \
  && pnpm --filter @viralforge/ui build \
  && pnpm --filter @viralforge/api build \
  && pnpm --filter @viralforge/scheduler build \
  && pnpm --filter @viralforge/worker-general build \
  && pnpm --filter @viralforge/worker-media build \
  && pnpm --filter @viralforge/worker-ai build \
  && pnpm --filter @viralforge/web build

# --- shared runtime user ---
FROM base AS runtime-base
ENV NODE_ENV=production
ENV TMPDIR=/tmp
RUN groupadd --gid 10001 viralforge \
  && useradd --uid 10001 --gid viralforge --shell /usr/sbin/nologin --create-home viralforge
WORKDIR /app

# --- API ---
FROM runtime-base AS api
COPY --from=builder --chown=viralforge:viralforge /app /app
USER viralforge
WORKDIR /app/apps/api
ENV PORT=4000
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/health/live" || exit 1
CMD ["node", "dist/main.js"]

# --- Scheduler / outbox dispatcher ---
FROM runtime-base AS scheduler
COPY --from=builder --chown=viralforge:viralforge /app /app
USER viralforge
WORKDIR /app/apps/scheduler
ENV PORT=4001
EXPOSE 4001
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/health/live" || exit 1
CMD ["node", "dist/main.js"]

# --- General worker ---
FROM runtime-base AS worker-general
COPY --from=builder --chown=viralforge:viralforge /app /app
USER viralforge
WORKDIR /app/workers/general
ENV PORT=4004
EXPOSE 4004
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/health/live" || exit 1
CMD ["node", "dist/main.js"]

# --- AI worker ---
FROM runtime-base AS worker-ai
COPY --from=builder --chown=viralforge:viralforge /app /app
USER viralforge
WORKDIR /app/workers/ai
ENV PORT=4003
EXPOSE 4003
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/health/live" || exit 1
CMD ["node", "dist/main.js"]

# --- Media worker (FFmpeg only here) ---
FROM runtime-base AS worker-media
USER root
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg \
  && rm -rf /var/lib/apt/lists/*
COPY --from=builder --chown=viralforge:viralforge /app /app
USER viralforge
WORKDIR /app/workers/media
ENV PORT=4002
# Ephemeral scratch only — never mount durable media here.
ENV TMPDIR=/tmp
EXPOSE 4002
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/health/live" || exit 1
CMD ["node", "dist/main.js"]

# --- Web (Next.js standalone) ---
FROM runtime-base AS web
COPY --from=builder --chown=viralforge:viralforge /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=viralforge:viralforge /app/apps/web/.next/standalone ./
COPY --from=builder --chown=viralforge:viralforge /app/apps/web/.next/static ./apps/web/.next/static
USER viralforge
WORKDIR /app/apps/web
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/" || exit 1
CMD ["node", "server.js"]

# --- Migrate (release / pre-deploy only) ---
FROM runtime-base AS migrate
COPY --from=builder --chown=viralforge:viralforge /app /app
USER viralforge
WORKDIR /app
# Intentionally no long-running healthcheck — one-shot release job.
CMD ["node", "packages/database/dist/migrate.js"]
