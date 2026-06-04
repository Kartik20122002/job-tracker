# ── Base: shared Alpine + compat lib ─────────────────────────────────────────
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# ── All deps (needed to compile) ──────────────────────────────────────────────
FROM base AS deps
COPY package*.json ./
RUN npm ci

# ── Production deps only (no TypeScript, ESLint, @types, tailwindcss, etc.) ──
FROM base AS prod-deps
COPY package*.json ./
RUN npm ci --omit=dev

# ── Build ─────────────────────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN npm run build

# ── Runner ────────────────────────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Lean production node_modules (no devDeps)
COPY --from=prod-deps /app/node_modules ./node_modules

# Next.js build output
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Prisma generated client (built against this Alpine/Node version)
COPY --from=builder /app/src/generated ./src/generated

# Prisma CLI + config (needed for migrations inside the container)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Seed script
COPY --from=builder /app/tsconfig.seed.json ./tsconfig.seed.json

# package.json needed for `npm start` and `npm run seed`
COPY --from=builder /app/package*.json ./

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run migrations automatically on startup, then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
