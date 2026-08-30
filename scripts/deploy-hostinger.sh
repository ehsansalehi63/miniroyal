#!/usr/bin/env bash
# ============================================================================
# MiniRoyal Automated Deployment Script for Hostinger SSH
# ============================================================================

set -e

echo "👑 Starting MiniRoyal Hostinger Deployment..."

# 1. Pull latest code from arena session branch
BRANCH="${GIT_BRANCH:-arena/01a04d03-miniroyal}"
git fetch origin "$BRANCH" || true
git checkout "$BRANCH" || true
git pull origin "$BRANCH" || true

# 2. Install dependencies (using npm install for high compatibility)
npm install --legacy-peer-deps

# 3. Build Next.js application
npm run build

# 4. Initialize database schema
bash scripts/init-db.sh || true

# 5. Restart PM2 Node process
if command -v pm2 &> /dev/null; then
    pm2 restart miniroyal || pm2 start npm --name "miniroyal" -- start
    echo "✅ PM2 process restarted successfully!"
fi

echo "🎉 MiniRoyal deployed successfully on Hostinger!"
