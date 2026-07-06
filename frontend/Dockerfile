# ================================================================
# HELIO Frontend — Multi-Stage Dockerfile
# ================================================================
# Stage 1: Build the React/Vite application
# Stage 2: Serve the compiled dist/ via nginx (minimal attack surface)
# ================================================================

# ── Stage 1: Builder ─────────────────────────────────────────────
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies first (better Docker layer caching)
COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

# Copy application source
COPY . .

# Build production bundle
# VITE_API_URL can be injected at build time if the frontend and backend
# are on separate domains. For reverse-proxied deployments (same domain),
# the default relative /api path works without this variable.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Stage 2: Production Server ───────────────────────────────────
FROM nginx:1.27-alpine AS production

# Remove default nginx static content
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled React application from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx.conf from the builder stage is optional.
# If it exists in the build context it will be written; otherwise the
# RUN block below generates a minimal inline config automatically.

# Create a minimal nginx config inline if no custom config is provided
# This handles React Router by serving index.html for all routes
RUN if [ ! -f /etc/nginx/conf.d/default.conf ]; then \
    printf 'server {\n  listen 80;\n  root /usr/share/nginx/html;\n  index index.html;\n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n  location /health {\n    access_log off;\n    return 200 "ok";\n    add_header Content-Type text/plain;\n  }\n}\n' > /etc/nginx/conf.d/default.conf; \
  fi

# Use non-root nginx user
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80

# Health check — verifies nginx is serving
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
