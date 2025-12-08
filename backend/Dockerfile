FROM node:20-alpine AS builder

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code and build
COPY . .
RUN npm run build

# Verify build output exists (NestJS outputs to dist/src/)
RUN ls -la dist/src/ && test -f dist/src/main.js

# Compile seed script separately
RUN npx tsc prisma/seed.ts --outDir dist/prisma --esModuleInterop --skipLibCheck || true

FROM node:20-alpine AS runner

# Install OpenSSL for Prisma runtime
RUN apk add --no-cache openssl

WORKDIR /app

# Copy only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy prisma schema and generate client for production
COPY prisma ./prisma/
RUN npx prisma generate

# Copy built assets
COPY --from=builder /app/dist ./dist

# Copy scripts
COPY scripts ./scripts
RUN chmod +x /app/scripts/docker-entrypoint.sh

# Create necessary directories
RUN mkdir -p /app/uploads /app/db

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["/app/scripts/docker-entrypoint.sh"]
