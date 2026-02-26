# syntax=docker/dockerfile:1
# ── Stage 1: deps ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN npm install -g pnpm@10.28.0
WORKDIR /app

# Copy workspace manifests for dependency install
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/config/package.json ./packages/config/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/
COPY apps/svc-datasets/package.json ./apps/svc-datasets/

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter @smartboard/svc-datasets... --ignore-scripts

# ── Stage 2: builder ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN npm install -g pnpm@10.28.0
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/svc-datasets/node_modules ./apps/svc-datasets/node_modules
COPY . .

RUN pnpm --filter @smartboard/shared run build
RUN pnpm --filter @smartboard/svc-datasets run db:generate
RUN pnpm --filter @smartboard/svc-datasets run build

# ── Stage 3: runner ────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache dumb-init openssl
WORKDIR /app
ENV NODE_ENV=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001 -G nodejs

# Copy built output and production deps
COPY --from=builder --chown=nestjs:nodejs /app/apps/svc-datasets/dist ./apps/svc-datasets/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared ./packages/shared
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/svc-datasets/node_modules ./apps/svc-datasets/node_modules

USER nestjs
EXPOSE 4030

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:4030/health/ready || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/svc-datasets/dist/main.js"]
