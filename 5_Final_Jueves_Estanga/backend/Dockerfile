# ========================================================
# Production Multi-Stage Dockerfile for Surf Rental API
# Node.js 20 LTS Alpine + Prisma ORM + MySQL 8.0 Driver
# ========================================================

# Stage 1: Dependencies Cache
FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# Stage 2: Build Application
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY tsconfig*.json ./
COPY prisma ./prisma/
COPY src ./src

# Generate Prisma Client & Compile TypeScript
RUN npx prisma generate
RUN npm run build

# Stage 3: Minimal Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN apk add --no-cache openssl curl

# Create non-root system user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 expressjs

COPY package*.json ./
COPY prisma ./prisma/
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Ensure permissions
RUN chown -R expressjs:nodejs /app

USER expressjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "dist/index.js"]
