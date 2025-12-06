# Mobile-Only SSH Workflow for MindRoots Backend

**Use Case**: Editing backend code from iPhone/Android only
**Authentication**: SSH Public Key (No password, no GUI needed)
**Status**: Ready to implement

---

## 🎯 Your Setup

```
iPhone/iPad/Android Only
    ↓ SSH Client App
AWS Backend (theoption.life)
    ↓ SSH Key Auth
Edit files → Restart PM2 → Verify via curl
```

**Key Point**: You do NOT need Claude installed on the AWS server. Claude Code runs on YOUR device (local machine or web IDE), and it connects to AWS via SSH.

---

## 📱 Step 1: Choose SSH Client for Phone

### iOS (iPhone/iPad)

**Option A: Termius (Recommended)**
- App: https://termius.com/
- Features: SSH, SCP, git integration
- Cost: Free + paid
- Setup: 5 minutes

**Option B: iSH Shell (Advanced)**
- App: https://ish.app/ (from App Store)
- Features: Full Linux shell on iOS
- Cost: Free
- Setup: 15 minutes

**Option C: Prompt 3 (Premium)**
- App: https://www.panic.com/prompt/
- Features: Professional SSH, SFTP
- Cost: $14.99 one-time
- Setup: 5 minutes

### Android

**Option A: JuiceSSH (Recommended)**
- App: https://www.juicessh.com/
- Features: SSH, SFTP, key management
- Cost: Free + paid
- Setup: 5 minutes

**Option B: Termux (Advanced)**
- App: https://termux.com/
- Features: Full Linux terminal
- Cost: Free
- Setup: 15 minutes

**Option C: ConnectBot**
- App: https://connectbot.org/
- Features: Simple, reliable SSH
- Cost: Free
- Setup: 5 minutes

---

## 🔐 Step 2: Generate SSH Key on Phone

### iOS with Termius

1. **Open Termius app**
2. **Settings → Keys**
3. **Add Key** → Generate New
4. **Key Type**: ED25519 (recommended)
5. **Name**: mindroots
6. **Export Public Key** → Copy to clipboard

### iOS with iSH Shell

```bash
ssh-keygen -t ed25519 -f ~/.ssh/mindroots

# Output shows:
# Public key: /root/.ssh/mindroots.pub
# Private key: /root/.ssh/mindroots

# View public key:
cat ~/.ssh/mindroots.pub
```

### Android with JuiceSSH

1. **Open JuiceSSH**
2. **Menu → Identities**
3. **Create New**
4. **Nickname**: mindroots
5. **Key Type**: ED25519
6. **Create**
7. **Copy public key from identity details**

### Android with Termux

```bash
ssh-keygen -t ed25519 -f ~/.ssh/mindroots
cat ~/.ssh/mindroots.pub
```

---

## 🔑 Step 3: Add Public Key to Server

### Option A: If you have Mac access (one-time)

```bash
# From Mac with existing AWS access:
ssh -i wp.pem bitnami@theoption.life

# Once connected, add your phone's public key:
mkdir -p ~/.ssh
echo "[YOUR_PHONE_PUBLIC_KEY_HERE]" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Verify it worked:
cat ~/.ssh/authorized_keys
```

### Option B: From Phone Terminal (if you can SSH once)

If you already have SSH access from phone with password:

```bash
# Connect first time (with password):
ssh -i wp.pem bitnami@theoption.life

# Add your public key:
echo "[YOUR_PHONE_PUBLIC_KEY_HERE]" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Test second connection uses key instead of password
```

---

## 🚀 Step 4: Configure Phone SSH Client

### Termius Setup (iOS/Android)

1. **New Host**
   - **Address**: theoption.life
   - **Port**: 22
   - **User**: bitnami
   - **Key**: mindroots (select from generated keys)
   - **Save**

2. **Test Connection**
   - Tap the host
   - Should connect WITHOUT asking for password

### JuiceSSH Setup (Android)

1. **New Connection**
   - **Nickname**: MindRoots
   - **Host**: theoption.life
   - **Port**: 22
   - **Identity**: mindroots
   - **Save**

2. **Test Connection**
   - Tap the connection
   - Should connect WITHOUT password

### Manual SSH Command

```bash
# iOS (iSH) or Android (Termux)
ssh -i ~/.ssh/mindroots bitnami@theoption.life

# Should connect without password prompt
```

---

## ✏️ Step 5: Edit Backend Files from Phone

### Basic Workflow

```bash
# Connect via SSH
ssh bitnami@theoption.life

# Navigate to backend
cd /var/www/mindroots/routes/modules

# Edit a file
nano corpus.js

# Validate syntax
node -c corpus.js

# Restart backend
pm2 restart mindroots-backend

# Check health
curl http://localhost:5001/api/health

# Exit
exit
```

### Using nano Editor (Simple)

```bash
# Open file
nano /var/www/mindroots/routes/modules/corpus.js

# Make changes
# (Use arrow keys to navigate)

# Save: Ctrl+O (on iPhone: two-finger tap)
# Exit: Ctrl+X

# Validate
node -c /var/www/mindroots/routes/modules/corpus.js

# Restart
pm2 restart mindroots-backend
```

### Using vi Editor (Advanced)

```bash
# Open file
vi /var/www/mindroots/routes/modules/corpus.js

# Press 'i' to insert
# Make changes
# Press Esc to exit insert mode
# Type ':wq' to save and exit

# Validate
node -c /var/www/mindroots/routes/modules/corpus.js
```

---

## 🔍 Step 6: Verify Changes

### Health Check

```bash
# On phone, still connected via SSH:
curl http://localhost:5001/api/health

# Should show:
# {"status":"ok","timestamp":"2025-12-04...","memory":{...}}
```

### Check Logs

```bash
# See last 20 lines of logs
pm2 logs mindroots-backend --lines 20

# Watch logs in real-time
pm2 logs mindroots-backend --watch
```

### Verify File Changed

```bash
# Check if file was modified
ls -la /var/www/mindroots/routes/modules/corpus.js

# View changes
tail -20 /var/www/mindroots/routes/modules/corpus.js
```

---

## 🔄 Step 7: Rollback if Needed

### Quick Rollback

```bash
# If something broke, quickly revert
cd /var/www/mindroots

# See what changed
git status

# Revert specific file
git checkout HEAD -- routes/modules/corpus.js

# Restart
pm2 restart mindroots-backend

# Verify
curl http://localhost:5001/api/health
```

---

## 📋 Complete Mobile Workflow Example

```bash
# 1. SSH from phone
ssh bitnami@theoption.life

# 2. Edit a file
nano /var/www/mindroots/routes/modules/search-modern.js
# ... make changes ...
# Ctrl+O to save, Ctrl+X to exit

# 3. Validate
node -c /var/www/mindroots/routes/modules/search-modern.js
# Output: (no output means syntax OK)

# 4. Restart backend
pm2 restart mindroots-backend
# Output: [PM2] Restarting mindroots-backend...

# 5. Check health
curl http://localhost:5001/api/health
# Output: {"status":"ok","uptime":12345,...}

# 6. View logs
pm2 logs mindroots-backend --lines 10

# 7. If all good, commit
git add -A
git commit -m "Fix: Update search logic"
git push

# 8. Exit
exit
```

---

## 🚨 Troubleshooting on Mobile

### "Permission Denied (publickey)"

**Cause**: Public key not installed on server
**Fix**:
```bash
# Check server side has your key:
cat ~/.ssh/authorized_keys

# Should show your public key
# If empty, add it again from Mac
```

### "Connection Refused"

**Cause**: Server not accepting SSH or port blocked
**Fix**:
```bash
# Check security group on AWS:
# - Port 22 should allow your IP
# - You said it's open, so this should work

# Try with -v to debug:
ssh -v bitnami@theoption.life
```

### "nano: command not found"

**Cause**: Using uncommon SSH client without editor
**Fix**: Use `vi` instead:
```bash
vi /var/www/mindroots/routes/modules/corpus.js
# Press i to insert, Esc to exit, :wq to save
```

### "pm2: command not found"

**Cause**: User doesn't have PM2 in PATH
**Fix**: Use full path:
```bash
/home/bitnami/.npm/_npx/*/bin/pm2 restart mindroots-backend

# Or:
npx pm2 restart mindroots-backend
```

### "node: command not found"

**Cause**: Node not in PATH
**Fix**:
```bash
# Use full path
/usr/local/bin/node /var/www/mindroots/routes/modules/corpus.js -c

# Or:
which node  # find where it is
```

---

## 💡 Tips for Mobile Development

### 1. **Keep Screen Large**
- Use landscape mode for better screen space
- Zoom text in terminal settings (Termius/JuiceSSH both support this)

### 2. **Use External Keyboard**
- Bluetooth keyboard makes typing much easier
- Most SSH apps support external keyboards

### 3. **Create SSH Shortcuts**
```bash
# Add to ~/.bashrc on server for quick commands:
alias restart-mindroots="pm2 restart mindroots-backend && curl http://localhost:5001/api/health"
alias check-logs="pm2 logs mindroots-backend --lines 20"
alias git-status="cd /var/www/mindroots && git status"
```

Then from phone:
```bash
restart-mindroots
check-logs
git-status
```

### 4. **Pre-test Syntax Before Restart**
```bash
# Don't restart until syntax is confirmed
node -c routes/modules/corpus.js && echo "✅ OK" || echo "❌ ERROR"
```

### 5. **Keep Backups**
```bash
# Before major edit, backup file:
cp routes/modules/corpus.js routes/modules/corpus.js.backup

# Restore if needed:
cp routes/modules/corpus.js.backup routes/modules/corpus.js
```

---

## 🆚 Mobile SSH vs Claude Integration

| Aspect | Mobile SSH | Claude SSH |
|--------|------------|-----------|
| **Device** | Phone only | Phone OR Mac |
| **Setup** | 15 min | 1-2 hours |
| **Edit Speed** | Slower (small screen) | Faster (editor + IDE) |
| **Syntax Checking** | Manual (node -c) | Automatic (IDE) |
| **Rollback** | Manual (git checkout) | Fast (git history) |
| **Logs** | Terminal output | IDE console |
| **Best For** | Quick hotfixes | Major changes |

---

## ✅ Checklist

- [ ] Choose SSH client for phone (Termius/JuiceSSH recommended)
- [ ] Generate SSH key on phone (ED25519)
- [ ] Export public key from phone
- [ ] Add to server's ~/.ssh/authorized_keys
- [ ] Test SSH connection from phone (no password)
- [ ] Edit a test file (nano corpus.js)
- [ ] Validate syntax (node -c)
- [ ] Restart backend (pm2 restart)
- [ ] Verify health (curl health endpoint)
- [ ] Test rollback (git checkout)

---

## 🎯 Next Steps

1. **Today**: Choose SSH client, generate key
2. **Tomorrow**: Add key to server, test connection
3. **Later**: Start editing backend files from phone
4. **Optional**: When ready, add Claude for automated edits

---

**Status**: Ready to implement
**Time to Setup**: 15-30 minutes
**Difficulty**: Easy
**Cost**: Free (except premium SSH apps if preferred)

Your infrastructure is ready for mobile-only development. Start with the basics and build up as comfortable!
