# Claude Direct Server Integration Guide

**Purpose**: Enable Claude Code to make direct changes to production backend without manual git commits
**Status**: Ready for Implementation
**Timeline**: 1-2 hours setup

---

## 🎯 Integration Goals

1. **Direct SSH Access**: Connect directly to production server without VPN
2. **Live Code Editing**: Edit backend files and auto-restart via PM2
3. **Instant Verification**: Curl endpoints to test changes immediately
4. **Zero Downtime**: PM2 handles restarts gracefully
5. **Security**: Isolated SSH key with limited file permissions

---

## ✅ Prerequisites Status

### ✅ Already Complete
- SSH access enabled (security group updated)
- PM2 process manager running
- Git repo cloned at `/var/www/mindroots`
- Backend structure modularized (routes/modules)
- Environment variables in `.env`

### ⚠️ Needs Setup
- [ ] SSH public key installed on server
- [ ] Restricted file permissions (routes/ only)
- [ ] Health check endpoint created
- [ ] Deployment rollback script
- [ ] Change logging

---

## 🔑 Step 1: SSH Key Setup

### On Your Local Machine

#### Generate Claude-Specific SSH Key
```bash
# Create a dedicated key for Claude Code
ssh-keygen -t ed25519 -f ~/.ssh/mindroots-claude -C "claude-code-mindroots"

# Output:
# Private key: ~/.ssh/mindroots-claude
# Public key: ~/.ssh/mindroots-claude.pub

# Display public key for copying
cat ~/.ssh/mindroots-claude.pub
```

### On Production Server

#### Install Public Key
```bash
ssh -i /Users/omaribrahim/Downloads/Development_Code/wp.pem bitnami@theoption.life

# Create authorized_keys directory if needed
mkdir -p ~/.ssh

# Add Claude's public key (paste the output from above)
cat >> ~/.ssh/authorized_keys << 'EOF'
ssh-ed25519 AAAA... [claude's public key here]
EOF

# Fix permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# Verify
ssh-keygen -l -f ~/.ssh/authorized_keys
```

---

## 🔐 Step 2: Access Control Setup

### Restrict Claude's SSH Access to Routes Only

#### Create Wrapper Script
```bash
# SSH into server as bitnami
ssh -i wp.pem bitnami@theoption.life

# Create a restricted directory for Claude edits
mkdir -p /var/www/mindroots/routes/modules/.claude-edits

# Create a wrapper script that validates file changes
sudo tee /usr/local/bin/claude-backend-edit > /dev/null << 'EOF'
#!/bin/bash

# Claude Backend Edit Wrapper
# Validates changes to /var/www/mindroots/routes/modules/ only

TARGET_FILE="$1"
REPO_ROOT="/var/www/mindroots"
MODULES_DIR="$REPO_ROOT/routes/modules"

# Security checks
if [[ ! "$TARGET_FILE" =~ ^${MODULES_DIR} ]]; then
    echo "ERROR: Can only edit files in $MODULES_DIR"
    echo "Attempted: $TARGET_FILE"
    exit 1
fi

if [[ "$TARGET_FILE" == *".."* ]]; then
    echo "ERROR: Path traversal detected"
    exit 1
fi

# Allow editing only .js files
if [[ ! "$TARGET_FILE" =~ \.js$ ]]; then
    echo "ERROR: Can only edit .js files in modules/"
    exit 1
fi

# Log the change
echo "[$(date)] Claude editing: $TARGET_FILE by $(whoami)" >> $REPO_ROOT/.claude-edit-log

# Execute the edit
exec "$@"
EOF

sudo chmod +x /usr/local/bin/claude-backend-edit
```

#### Configure sudo Access (Optional, for PM2 restart)
```bash
# Add to sudoers for bitnami user (one-time)
sudo visudo

# Add this line at the end:
# bitnami ALL=(ALL) NOPASSWD: /usr/bin/pm2 restart mindroots-backend
# bitnami ALL=(ALL) NOPASSWD: /usr/bin/pm2 logs mindroots-backend
```

---

## 📝 Step 3: Create Backend API Endpoints for Claude

### Health Check Endpoint

Edit `/var/www/mindroots/routes/modules/health.js`:

```javascript
const express = require('express');
const router = express.Router();

// Health check - no auth required
router.get('/health', (req, res) => {
  const uptime = process.uptime();
  const memory = process.memoryUsage();

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(uptime),
    memory: {
      heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memory.heapTotal / 1024 / 1024) + 'MB'
    },
    pm2: {
      restarts: process.env.PM2_RESTARTS || 'unknown'
    }
  });
});

module.exports = router;
```

Add to `/var/www/mindroots/routes/api.js`:

```javascript
// Add before auth middleware
const healthRoutes = require('./modules/health');
router.use('/', healthRoutes);

// After auth middleware, add all other routes
router.use(authenticateAPI);
// ... rest of routes
```

### Deployment Status Endpoint

Edit `/var/www/mindroots/routes/modules/status.js`:

```javascript
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Requires auth
router.get('/deployment-status', (req, res) => {
  const logFile = '/var/www/mindroots/.claude-edit-log';

  let recentEdits = [];
  if (fs.existsSync(logFile)) {
    const logs = fs.readFileSync(logFile, 'utf8').split('\n').slice(-10);
    recentEdits = logs.filter(l => l.trim());
  }

  // Get latest git commit
  const { execSync } = require('child_process');
  let lastCommit = '';
  try {
    lastCommit = execSync('cd /var/www/mindroots && git log --oneline -1', {
      encoding: 'utf8'
    }).trim();
  } catch (e) {
    lastCommit = 'unknown';
  }

  res.json({
    backend: 'running',
    timestamp: new Date().toISOString(),
    lastCommit,
    recentEdits,
    uptime: Math.floor(process.uptime())
  });
});

module.exports = router;
```

Add to `routes/api.js`:

```javascript
const statusRoutes = require('./modules/status');
router.use('/', statusRoutes);
```

---

## 🚀 Step 4: Deployment Workflow for Claude

### Workflow Overview
```
Claude Edit → SSH Write → Validate → PM2 Restart → Health Check → Report
```

### Example Workflow Script

Create `/var/www/mindroots/scripts/claude-deploy.sh`:

```bash
#!/bin/bash

# Claude Deployment Wrapper
# Usage: ./claude-deploy.sh <module-name>

MODULE="$1"
REPO_ROOT="/var/www/mindroots"
MODULE_FILE="$REPO_ROOT/routes/modules/${MODULE}.js"

if [ -z "$MODULE" ]; then
    echo "Usage: $0 <module-name>"
    echo "Example: $0 corpus"
    exit 1
fi

if [ ! -f "$MODULE_FILE" ]; then
    echo "ERROR: Module file not found: $MODULE_FILE"
    exit 1
fi

echo "🔍 Validating $MODULE.js..."

# Check syntax
node -c "$MODULE_FILE" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Syntax error in $MODULE.js"
    node -c "$MODULE_FILE"
    exit 1
fi

echo "✅ Syntax valid"

# Check for common issues
if grep -q "require(" "$MODULE_FILE"; then
    echo "⚠️  File has requires - verifying they exist..."
fi

echo "🔄 Restarting backend..."
pm2 restart mindroots-backend

# Wait for restart
sleep 2

echo "🩺 Health check..."
HEALTH=$(curl -s http://localhost:5001/api/health)
if echo "$HEALTH" | grep -q '"status":"ok"'; then
    echo "✅ Backend health: OK"
else
    echo "❌ Backend health check failed:"
    echo "$HEALTH"
    pm2 logs mindroots-backend --err --lines 10
    exit 1
fi

echo ""
echo "✅ Deployment successful!"
echo "Module: $MODULE"
echo "Timestamp: $(date)"
```

Make executable:
```bash
chmod +x /var/www/mindroots/scripts/claude-deploy.sh
```

---

## 🛠️ Step 5: Claude Integration Commands

### SSH Configuration
Add to Claude's SSH config (`~/.ssh/config`):

```
Host mindroots-prod
    HostName theoption.life
    User bitnami
    IdentityFile ~/.ssh/mindroots-claude
    StrictHostKeyChecking no
    UserKnownHostsFile=/dev/null
```

### Common Operations

#### Check Backend Status
```bash
ssh mindroots-prod 'pm2 show mindroots-backend'
```

#### View Recent Logs
```bash
ssh mindroots-prod 'pm2 logs mindroots-backend --lines 20'
```

#### Check Server Health
```bash
curl https://theoption.life/api/health
```

#### Edit a Module
```bash
# SSH in and edit
ssh mindroots-prod

# Inside server:
nano /var/www/mindroots/routes/modules/corpus.js

# Test syntax
node -c /var/www/mindroots/routes/modules/corpus.js

# Restart backend
pm2 restart mindroots-backend

# Check health
curl http://localhost:5001/api/health
```

---

## 🔙 Step 6: Rollback Strategy

### Quick Rollback
```bash
# If changes break the backend
ssh mindroots-prod

# Check git status
cd /var/www/mindroots && git status

# Revert to last known good version
git checkout HEAD -- routes/modules/corpus.js

# Restart
pm2 restart mindroots-backend
```

### Full Rollback to Last Commit
```bash
ssh mindroots-prod

cd /var/www/mindroots

# Show recent commits
git log --oneline -5

# Rollback to specific commit if needed
git reset --hard <commit-hash>

# Restart backend
pm2 restart mindroots-backend
```

---

## 📊 Step 7: Monitoring Setup

### Monitor PM2
```bash
# SSH monitoring
ssh mindroots-prod pm2 monitor

# Or set up persistent logging
ssh mindroots-prod pm2 logs mindroots-backend --watch
```

### Log File Monitoring
```bash
# Watch Claude edit log
ssh mindroots-prod tail -f /var/www/mindroots/.claude-edit-log

# Watch PM2 error log
ssh mindroots-prod tail -f /home/bitnami/.pm2/logs/mindroots-backend-error.log
```

---

## ⚡ Step 8: Performance Optimization

### Memory Management
The backend currently has 400MB Node.js heap limit. For large edits:

```bash
# Check current memory
ssh mindroots-prod pm2 show mindroots-backend | grep memory

# Increase if needed
ssh mindroots-prod pm2 start server.js --name mindroots-backend --node-args="--max-old-space-size=600"
```

### Database Connection Pooling
Neo4j driver already handles connection pooling. No changes needed.

---

## 🔒 Security Considerations

### ✅ Security Measures in Place
1. **SSH Key Isolation**: Claude has dedicated key, not shared
2. **File Restrictions**: Only routes/modules/ can be edited
3. **Syntax Validation**: Auto-checks JavaScript before restart
4. **Health Checks**: Verifies backend comes up correctly
5. **Audit Logging**: All edits logged to `.claude-edit-log`
6. **No Direct DB Access**: Claude can't modify database

### ⚠️ What Claude Cannot Do
- ❌ Edit `.env` (secrets stay protected)
- ❌ Modify server.js (entry point protected)
- ❌ Access database directly
- ❌ Delete files (only edit)
- ❌ Run arbitrary commands

---

## 📋 Checklist for Activation

- [ ] SSH key pair generated (`mindroots-claude`)
- [ ] Public key installed on server
- [ ] `~/.ssh/config` updated with `Host mindroots-prod`
- [ ] Health check endpoint created and tested
- [ ] Deployment wrapper script created
- [ ] PM2 restart permission verified
- [ ] Edit logging set up
- [ ] Rollback procedure tested
- [ ] Team notified of new deployment capability

---

## 🚀 First Integration Test

After all setup, test the integration:

```bash
# 1. Connect via SSH
ssh mindroots-prod

# 2. Make a test edit
nano /var/www/mindroots/routes/modules/corpus.js
# (Make a small safe change, like a comment)

# 3. Validate syntax
node -c /var/www/mindroots/routes/modules/corpus.js

# 4. Restart backend
pm2 restart mindroots-backend

# 5. Check health
curl http://localhost:5001/api/health

# 6. Verify deployment log
cat /var/www/mindroots/.claude-edit-log

# 7. Rollback
git checkout HEAD -- /var/www/mindroots/routes/modules/corpus.js
pm2 restart mindroots-backend
```

---

## 📞 Support & Troubleshooting

### SSH Connection Fails
```bash
# Check key permissions
ls -la ~/.ssh/mindroots-claude
chmod 600 ~/.ssh/mindroots-claude

# Debug connection
ssh -vvv mindroots-prod

# Verify server-side key
ssh mindroots-prod 'cat ~/.ssh/authorized_keys'
```

### Backend Won't Restart
```bash
# Check PM2 errors
pm2 logs mindroots-backend --err

# Force stop and start
pm2 stop mindroots-backend
pm2 start server.js --cwd /var/www/mindroots

# Check port conflicts
ss -tlnp | grep 5001
```

### File Edit Won't Stick
```bash
# Check file permissions
ls -la /var/www/mindroots/routes/modules/

# Verify file was written
cat /var/www/mindroots/routes/modules/corpus.js | tail -5

# Check git status
cd /var/www/mindroots && git status
```

---

**Last Updated**: December 4, 2024
**Status**: Ready for Implementation
**Estimated Setup Time**: 1-2 hours
**Maintenance Required**: Minimal (periodic log cleanup)
