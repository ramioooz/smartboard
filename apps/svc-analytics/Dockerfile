# syntax=docker/dockerfile:1
# ── Stage 1: deps ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy workspace manifests for dependency install
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/config/package.json ./packages/config/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/
COPY apps/svc-analytics/package.json ./apps/svc-analytics/

RUN pnpm install --frozen-lockfile --filter @smartboard/svc-analytics... --ignore-scripts

# ── Stage 2: builder ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/svc-analytics/node_modules ./apps/svc-analytics/node_modules
COPY . .

RUN pnpm --filter @smartboard/svc-analytics run build

# ── Stage 3: runner ────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache dumb-init
WORKDIR /app
ENV NODE_ENV=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001 -G nodejs

# Copy built output and production deps
COPY --from=builder --chown=nestjs:nodejs /app/apps/svc-analytics/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/svc-analytics/node_modules ./apps/svc-analytics/node_modules

USER nestjs
EXPOSE 4040

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:4040/health/ready || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
