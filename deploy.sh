#!/bin/bash
# ==============================================================================
# PicPoster Production Deployment Script
# Automates zero-downtime updates on Linux VPS
# Usage: ./deploy.sh
# ==============================================================================

set -e

echo "🚀 Starting PicPoster Deployment..."

# 1. Pull latest code from main branch
echo "📥 Pulling latest git changes..."
git pull origin main

# 2. Install backend production dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm ci --omit=dev
cd ..

# 3. Install frontend dependencies & compile production bundle
echo "🎨 Building frontend production bundle..."
cd frontend
npm ci
npm run build
cd ..

# 4. Create upload folders if missing
mkdir -p backend/uploads/posters backend/uploads/users backend/uploads/business backend/uploads/creations backend/uploads/categories
mkdir -p backend/logs

# 5. Reload backend cluster with PM2 (zero-downtime)
echo "🔄 Reloading PM2 backend cluster..."
if pm2 describe picposter-backend > /dev/null 2>&1; then
    pm2 reload ecosystem.config.js --env production
else
    pm2 start ecosystem.config.js --env production
fi
pm2 save

# 6. Verify backend health
echo "🏥 Verifying API health status..."
sleep 2
if curl -s -f http://localhost:5000/health > /dev/null; then
    echo "✅ Backend is healthy and serving traffic!"
else
    echo "⚠️ Warning: Health check failed on http://localhost:5000/health. Check PM2 logs:"
    pm2 logs picposter-backend --lines 20 --nostream
fi

echo "🎉 Deployment completed successfully!"
