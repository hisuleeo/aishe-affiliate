#!/bin/bash

# AISHE Production Deployment Script
# AWS EC2: 54.81.59.13

set -e

echo "🚀 AISHE Deployment Starting..."

# Navigate to app directory
cd ~/app

# Pull latest changes
echo "📥 Pulling latest code..."
git pull origin main

# Copy production env file
echo "⚙️ Setting up environment..."
cp .env.production .env

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down || true

# Build and start containers
echo "🏗️ Building and starting containers..."
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for database to be ready
echo "⏳ Waiting for database..."
sleep 10

# Run migrations
echo "🗃️ Running database migrations..."
docker-compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy

# Seed database (optional - comment out after first deployment)
# echo "🌱 Seeding database..."
# docker-compose -f docker-compose.prod.yml exec -T backend npx prisma db seed

echo "✅ Deployment complete!"
echo "🌐 Frontend: http://54.81.59.13"
echo "🔌 Backend API: http://54.81.59.13/api"

# Show container status
docker-compose -f docker-compose.prod.yml ps
