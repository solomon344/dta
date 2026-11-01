# syntax=docker/dockerfile:1

# ---- Dependencies ----
FROM node:22-bookworm-slim AS deps
WORKDIR /app
# Chromium comes from Debian in the runtime image, so skip Puppeteer's bundled download.
# Install scripts are skipped; the build stage generates the Prisma client itself.
ENV PUPPETEER_SKIP_DOWNLOAD=true
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# ---- Build ----
FROM node:22-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# No database is needed at build time; public pages read it per request.
RUN npm run build

# ---- Migration tooling (Prisma CLI only, pinned to the project's version) ----
FROM node:22-bookworm-slim AS migrator
WORKDIR /migrate
COPY package.json /tmp/app-package.json
RUN PRISMA_VERSION=$(node -p "require('/tmp/app-package.json').devDependencies.prisma") \
    && DOTENV_VERSION=$(node -p "require('/tmp/app-package.json').devDependencies.dotenv") \
    && npm init -y >/dev/null \
    && npm install --no-audit --no-fund "prisma@${PRISMA_VERSION}" "dotenv@${DOTENV_VERSION}"
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY docker/seed.sh ./seed.sh

# ---- Runtime ----
FROM node:22-bookworm-slim AS runner
WORKDIR /app

# Chromium renders certificate PDF/PNG downloads; fonts are fallbacks (certificates load web fonts).
RUN apt-get update \
    && apt-get install -y --no-install-recommends -o Acquire::Retries=5 chromium fonts-liberation ca-certificates \
    && rm -rf /var/lib/apt/lists/*
# Prisma's migration engine needs OpenSSL.
RUN apt-get update \
    && apt-get install -y --no-install-recommends -o Acquire::Retries=5 openssl \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=migrator --chown=node:node /migrate ./migrate
COPY --chown=node:node docker/entrypoint.sh ./entrypoint.sh
RUN sed -i 's/\r$//' ./entrypoint.sh ./migrate/seed.sh && chmod +x ./entrypoint.sh ./migrate/seed.sh

USER node
EXPOSE 3000
CMD ["./entrypoint.sh"]
