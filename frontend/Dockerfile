# ─────────────────────────────────────────────────────────────
#  ChatHub Frontend — Multi-Stage Dockerfile
#
#  Stage 1 (deps)    → install npm dependencies
#  Stage 2 (builder) → run Vite production build
#  Stage 3 (runner)  → Nginx serves the compiled static bundle
#
#  Result: final image is ~25MB (Nginx alpine) with zero Node.js,
#          zero node_modules, zero source code — only the /dist
# ─────────────────────────────────────────────────────────────

# ── Stage 1: Install dependencies ─────────────────────────────
FROM node:18-alpine AS deps
WORKDIR /app
# Copy manifests first to maximise Docker layer cache reuse
COPY package*.json ./
RUN npm ci


# ── Stage 2: Build production bundle ──────────────────────────
FROM node:18-alpine AS builder
WORKDIR /app

# Bring in node_modules from the deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source (after node_modules for better cache ordering)
COPY . .

# Inject build-time env var if needed
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

# Vite compiles everything into /app/dist
RUN npm run build


# ── Stage 3: Production Nginx server ──────────────────────────
FROM nginx:1.25-alpine AS runner

# Remove default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled SPA from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx runs as non-root (nginx user is built into the alpine image)
RUN chown -R nginx:nginx /usr/share/nginx/html \
 && chown -R nginx:nginx /var/cache/nginx \
 && chown -R nginx:nginx /var/log/nginx \
 && touch /var/run/nginx.pid \
 && chown nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
