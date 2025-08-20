#\!/bin/bash

# MindRoots Production Deployment Script
# Usage: ./deploy-prod.sh [--restart-backend]

set -e  # Exit on any error

echo 🚀 Starting MindRoots Production Deployment...
echo ================================================

# Check if we should restart backend
RESTART_BACKEND=false
if [[ "$1" == "--restart-backend" ]]; then
    RESTART_BACKEND=true
    echo "📌 Backend restart requested"
fi

# Step 1: Check memory status
echo "📊 Checking memory status..."
FREE_MEM=$(free -m | awk 'NR==2{printf "%d", $7}')
echo "Available memory: ${FREE_MEM}MB"

if [ $FREE_MEM -lt 300 ]; then
    echo "⚠️  Low memory (${FREE_MEM}MB), rebooting server..."
    echo "Stopping nginx first..."
    sudo systemctl stop nginx
    echo "Rebooting in 3 seconds..."
    sleep 3
    sudo reboot
    exit 0
fi

# Step 2: Stop nginx
echo "🛑 Stopping nginx..."
sudo systemctl stop nginx

# Step 3: Pull latest changes
echo "📥 Pulling latest changes from master..."
git status
echo "---"
git pull origin master

# Step 4: Clean and build frontend
echo "🏗️  Building frontend with memory optimization..."
rm -rf build/
GENERATE_SOURCEMAP=false NODE_OPTIONS="--max-old-space-size=400" npm run build

# Step 5: Restart backend if requested
if [ "$RESTART_BACKEND" == "true" ]; then
    echo "🔄 Restarting backend..."
    pm2 restart mindroots-backend
    sleep 2
    pm2 list
fi

# Step 6: Start nginx
echo "✅ Starting nginx..."
sudo systemctl start nginx

# Step 7: Verify deployment
echo "🔍 Verifying deployment..."
RESPONSE=$(curl -s -o /dev/null -w '%{http_code}' https://theoption.life)
if [ "$RESPONSE" == "200" ]; then
    echo "✅ Site responding with HTTP 200"
    echo ""
    echo "📦 Build files:"
    ls -la build/static/js/main* | tail -1
    ls -la build/static/css/main* | tail -1
    echo ""
    echo "📝 Latest commit:"
    git log --oneline -1
    echo ""
    echo "🎉 Deployment completed successfully\!"
else
    echo "❌ Site not responding (HTTP $RESPONSE)"
    exit 1
fi
