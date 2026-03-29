# ─────────────────────────────────────────────────────────────
#  ChatHub Backend — Multi-Stage Dockerfile
#
#  Stage 1 (base)         → common base image + package files
#  Stage 2 (dependencies) → install ALL deps (including devDeps)
#  Stage 3 (prod-deps)    → install ONLY production deps
#  Stage 4 (runner)       → minimal final image with prod deps + source
#
#  Result: image contains zero devDependencies, no build tools
# ─────────────────────────────────────────────────────────────

# ── Stage 1: Base ─────────────────────────────────────────────
FROM node:18-alpine AS base
WORKDIR /app
# Copy manifests only (leverages Docker layer cache — reinstall
# only runs when package*.json actually changes)
COPY package*.json ./


# ── Stage 2: Install all dependencies ─────────────────────────
# Used as a cache layer; devDeps present here for any build steps
FROM base AS dependencies
RUN npm ci


# ── Stage 3: Production dependencies only ─────────────────────
# Separate install pass that omits devDependencies
FROM base AS prod-deps
RUN npm ci --omit=dev


# ── Stage 4: Final production image ───────────────────────────
FROM node:18-alpine AS runner

WORKDIR /app

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nodeuser

# Copy production node_modules from stage 3
COPY --from=prod-deps /app/node_modules ./node_modules

# Copy application source (order matters for cache)
COPY src/    ./src/
COPY server.js ./

# Drop files that must never reach the container
# (.env is injected at runtime via ECS task definition secrets)
RUN rm -f .env .env.example

# Non-root user from here on
USER nodeuser

EXPOSE 5000

# Lightweight health check (no curl/wget needed — node built-in)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]
