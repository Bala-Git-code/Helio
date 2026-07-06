# ================================================================
# HELIO Backend — Multi-Stage Dockerfile
# ================================================================
# This single Dockerfile is used for ALL backend process types:
#   - API Gateway          (PROCESS_TYPE=api)
#   - Worker Fleet         (PROCESS_TYPE=worker)
#   - Scheduler            (PROCESS_TYPE=scheduler)
#   - Outbox Publisher     (PROCESS_TYPE=outbox-publisher)
#   - Combined Monolith    (PROCESS_TYPE=all)
#
# The PROCESS_TYPE environment variable at runtime determines
# which process boots inside the container.
# ================================================================

# ── Stage 1: Dependency Installer ────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Install only production dependencies
# Using --frozen-lockfile ensures reproducible installs
COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile --omit=dev

# ── Stage 2: Production Runtime ──────────────────────────────────
FROM node:20-alpine AS production

# Install dumb-init for proper PID 1 signal handling in containers
# This ensures SIGTERM/SIGINT are correctly forwarded to the Node process
RUN apk add --no-cache dumb-init

# Set Node.js environment
ENV NODE_ENV=production

# Create a non-root application directory and user
# node user is pre-created in node:alpine images
WORKDIR /app

# Copy production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source code
# Ordered from least-changing to most-changing for optimal layer caching
COPY config ./config
COPY middleware ./middleware
COPY models ./models
COPY repositories ./repositories
COPY routes ./routes
COPY services ./services
COPY validators ./validators
COPY server.js ./server.js
COPY worker.js ./worker.js

# Create upload storage directory with correct permissions
# This directory is mounted as a volume in production for persistence
RUN mkdir -p ./storage/uploads && chown -R node:node ./storage

# Run as non-root node user
USER node

# Expose API port
EXPOSE 5000

# Health check — verifies the API gateway is responsive
# Only meaningful when PROCESS_TYPE=api or PROCESS_TYPE=all
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health-check || exit 1

# Use dumb-init as PID 1 to correctly handle signals (SIGTERM → graceful shutdown)
# PROCESS_TYPE is provided at runtime via Docker Compose environment
ENTRYPOINT ["dumb-init", "--"]

# Default: start unified server (overridden per-container in Docker Compose)
CMD ["node", "server.js"]
