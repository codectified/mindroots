#!/bin/bash
#
# MindRoots Production Deployment Script
# Usage: ./deploy-prod.sh [--restart-backend]
#
# IMPORTANT: this always builds the frontend LOCALLY (wherever this script is
# run from) and ships the built artifacts to the server. It must never run
# `npm run build` *on* the production box — it's a 1 vCPU / 1GB AWS t2.micro
# shared with other apps, and a webpack/CRA build reliably OOMs it. An older
# version of this script did build on the box (see git history, commit
# 8251eb3); that approach is intentionally not used anymore.

set -e

HOST="bitnami@theoption.life"
REMOTE_APP_DIR="/var/www/mindroots"
REMOTE_BUILD_DIR="$REMOTE_APP_DIR/build"

# Locate the SSH key — path differs per machine (seen both
# ~/Downloads/wp.pem and ~/Downloads/Development_Code/wp.pem in the wild).
# Override with DEPLOY_SSH_KEY if yours lives somewhere else.
if [ -n "$DEPLOY_SSH_KEY" ]; then
  KEY="$DEPLOY_SSH_KEY"
elif [ -f "$HOME/Downloads/wp.pem" ]; then
  KEY="$HOME/Downloads/wp.pem"
elif [ -f "$HOME/Downloads/Development_Code/wp.pem" ]; then
  KEY="$HOME/Downloads/Development_Code/wp.pem"
else
  echo "Could not find the deploy SSH key. Set DEPLOY_SSH_KEY=/path/to/wp.pem and re-run."
  exit 1
fi

SSH="ssh -i $KEY"

RESTART_BACKEND=false
if [[ "$1" == "--restart-backend" ]]; then
  RESTART_BACKEND=true
  echo "Backend restart requested"
fi

echo "Starting MindRoots Production Deployment..."
echo "================================================"

echo "Building frontend locally..."
rm -rf build/
GENERATE_SOURCEMAP=false npm run build

echo "Deploying frontend build to $HOST:$REMOTE_BUILD_DIR ..."
if command -v rsync >/dev/null 2>&1; then
  rsync -az --delete -e "$SSH" build/ "$HOST:$REMOTE_BUILD_DIR/"
else
  echo "rsync not available here — using scp with an atomic swap instead"
  $SSH "$HOST" "rm -rf ${REMOTE_BUILD_DIR}.new && mkdir -p ${REMOTE_BUILD_DIR}.new"
  scp -r -i "$KEY" build/* "$HOST:${REMOTE_BUILD_DIR}.new/"
  $SSH "$HOST" "rm -rf ${REMOTE_BUILD_DIR}.old && mv ${REMOTE_BUILD_DIR} ${REMOTE_BUILD_DIR}.old && mv ${REMOTE_BUILD_DIR}.new ${REMOTE_BUILD_DIR} && rm -rf ${REMOTE_BUILD_DIR}.old"
fi
# Note: nginx serves build/ directly from disk — no reload needed for static content changes.

if [ "$RESTART_BACKEND" == "true" ]; then
  echo "Deploying backend changes (routes/, middleware/, server.js, package.json)..."
  if command -v rsync >/dev/null 2>&1; then
    rsync -az -e "$SSH" routes middleware server.js package.json "$HOST:$REMOTE_APP_DIR/"
  else
    scp -r -i "$KEY" routes middleware server.js package.json "$HOST:$REMOTE_APP_DIR/"
  fi
  echo "Restarting backend..."
  $SSH "$HOST" "cd $REMOTE_APP_DIR && pm2 restart mindroots-backend && pm2 list"
fi

echo "Verifying deployment..."
RESPONSE=$(curl -s -o /dev/null -w '%{http_code}' https://theoption.life)
if [ "$RESPONSE" == "200" ]; then
  echo "Site responding with HTTP 200"
  echo "Deployment completed successfully."
else
  echo "Site not responding as expected (HTTP $RESPONSE)"
  exit 1
fi
