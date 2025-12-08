#!/bin/sh
set -e

echo "🚀 Starting Contract Management System Backend..."

# Run database migrations
echo "📦 Running database migrations..."
npx prisma db push --accept-data-loss 2>/dev/null || npx prisma migrate deploy 2>/dev/null || true

# Run seed script to create default admin if not exists
echo "🌱 Initializing default data..."
node dist/prisma/seed.js 2>/dev/null || echo "⚠️ Seed script not found or already seeded"

# Start the application (NestJS outputs to dist/src/)
echo "✅ Starting application..."
exec node dist/src/main
