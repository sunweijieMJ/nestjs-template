# Unified Dockerfile for all database types and environments
# Build args:
#   DB_TYPE: relational | document
#   ENV_MODE: dev | test | ci | prod
#
# Example usage:
#   docker build --build-arg DB_TYPE=relational --build-arg ENV_MODE=dev -t app:dev .
#   docker build --build-arg DB_TYPE=document --build-arg ENV_MODE=prod -t app:prod .

# ============================================================
# Stage 1: Base - Install dependencies
# ============================================================
FROM node:22.21.1-alpine AS base

RUN apk add --no-cache bash
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml ./

# ============================================================
# Stage 2: Dependencies - Install all dependencies
# ============================================================
FROM base AS deps

# Install all dependencies (including devDependencies for building)
RUN pnpm install --frozen-lockfile

# ============================================================
# Stage 3: Builder - Build the application
# ============================================================
FROM base AS builder

ARG DB_TYPE=relational

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Setup environment file based on DB_TYPE
RUN if [ ! -f .env ]; then \
      if [ "$DB_TYPE" = "document" ]; then \
        cp env-example-document .env; \
      else \
        cp env-example-relational .env; \
      fi; \
    fi

# Build the application
RUN pnpm run build

# ============================================================
# Stage 4: Production dependencies only
# ============================================================
FROM base AS prod-deps

COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml ./

# Remove devDependencies, keep only production dependencies
RUN pnpm prune --prod

# ============================================================
# Stage 5: Production - Final minimal image
# ============================================================
FROM node:22.21.1-alpine AS production

ARG DB_TYPE=relational
ENV NODE_ENV=production
ENV DB_TYPE=${DB_TYPE}

RUN apk add --no-cache bash

WORKDIR /app

# Copy only necessary files for production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/.env ./

# Copy mail templates if they exist
COPY --from=builder /app/src/mail/mail-templates ./src/mail/mail-templates

# Copy i18n files if they exist
COPY --from=builder /app/src/i18n ./src/i18n

# Copy utility scripts
COPY wait-for-it.sh /opt/wait-for-it.sh
COPY startup.sh /opt/startup.sh
RUN chmod +x /opt/wait-for-it.sh /opt/startup.sh
RUN sed -i 's/\r//g' /opt/wait-for-it.sh /opt/startup.sh

EXPOSE 3000

USER node

CMD ["/opt/startup.sh"]

# ============================================================
# Stage 6: Development - Full development environment
# ============================================================
FROM base AS development

ARG DB_TYPE=relational
ARG ENV_MODE=dev

ENV DB_TYPE=${DB_TYPE}
ENV ENV_MODE=${ENV_MODE}
ENV NODE_ENV=development

# Install global CLI tools for development
RUN pnpm add -g @nestjs/cli typescript ts-node

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Setup environment file based on DB_TYPE
RUN if [ ! -f .env ]; then \
      if [ "$DB_TYPE" = "document" ]; then \
        cp env-example-document .env; \
      else \
        cp env-example-relational .env; \
      fi; \
    fi

# Copy utility scripts
COPY wait-for-it.sh /opt/wait-for-it.sh
COPY startup.sh /opt/startup.sh
RUN chmod +x /opt/wait-for-it.sh /opt/startup.sh
RUN sed -i 's/\r//g' /opt/wait-for-it.sh /opt/startup.sh

# Build for non-test modes
RUN if [ "$ENV_MODE" != "test" ] && [ "$ENV_MODE" != "dev" ]; then \
      pnpm run build; \
    fi

EXPOSE 3000

CMD ["/opt/startup.sh"]
