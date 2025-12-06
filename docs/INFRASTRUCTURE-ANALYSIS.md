# MindRoots Backend Infrastructure Analysis & Recommendations

**Date**: December 4, 2024
**Server**: AWS EC2 (theoption.life, IP: 172.31.48.164)
**Platform**: Debian 10, x86_64

---

## 🏗️ Current Infrastructure Overview

### Server Hardware & OS
- **Instance Size**: t3.small (1 vCPU, 2GB RAM - showing as 975MB available)
- **Storage**: 20GB (66% used - 13GB used, 6.5GB available)
- **OS**: Debian 5.10.237-1 (Bitnami stack)
- **Memory Management**: 975MB RAM total with 1GB swap (274MB in use)

### Backend Stack
```
Node.js v18.17.1
├── Express.js (Port 5001)
├── Neo4j Graph Database (Remote, neo4j+s://***REDACTED_URI***)
├── PM2 Process Manager (running mindroots-backend)
└── Nginx Reverse Proxy (Ports 80, 443)
```

### Deployment Structure
```
/var/www/mindroots/
├── server.js                    # Express entry point
├── routes/
│   ├── api.js                   # Route orchestrator
│   └── modules/                 # Feature-specific modules (160KB total)
│       ├── corpus.js (24KB)      # Corpus data operations
│       ├── graph.js (32KB)       # Graph expansion
│       ├── inspection.js (27KB)  # Node inspection & navigation
│       ├── search-modern.js (15KB)
│       ├── search-legacy.js (9KB)
│       ├── content.js (10KB)
│       ├── gpt-admin.js (9KB)
│       └── lexicon.js (12KB)
├── middleware/
│   └── auth.js                  # API authentication
├── package.json
├── deploy-prod.sh               # Automated deployment script
└── build/                       # React build output
```

### Process Management
- **PM2 Process**: mindroots-backend (PID 668459)
  - Status: Online (3D+ uptime)
  - Restarts: 24 (potential stability issues)
  - Memory: 58.7MB (healthy)
  - Node.js Version: 18.17.1
  - Git Integration: Enabled (auto-pulls from origin/master)

### Listening Ports
- **Port 5001**: Node.js Backend (IPv6 listening)
- **Port 3000**: React Dev Server (if running)
- **Port 80/443**: Nginx (HTTP/HTTPS)
- **Port 1194**: OpenVPN (UDP)

---

## 🔐 Security & Authentication

### API Authentication
- **Dual Key System**:
- **Frontend Config**: Uses PUBLIC_API_KEY for read operations
- **Database**: Neo4j cloud instance with authentication

### ⚠️ Security Concerns
1. **Secrets Storage**: API keys and Neo4j credentials in `.env` - properly protected with gitignore, but ensure file permissions are 600
2. **SSH Key**: Using non-post-quantum crypto (OpenSSH recommendation warning on server)
3. **Git Credentials**: SSH key access needed for automated deployment - ensure key has limited scope
4. **CORS Policy**: Currently allows all origins (`*`) - should restrict to `https://theoption.life`

---

## 🌐 VPN Routing Issue Analysis

### Current OpenVPN Configuration
```
Protocol: UDP
Remote: theoption.life:1194
Cipher: AES-256-CBC
Certificate: 4096-bit RSA
Routing Mode: Default (sends ALL traffic through VPN tunnel)
```

### Root Cause of Bandwidth Degradation
The current VPN is configured with **default routing** that tunnels **all internet traffic** through the VPN tunnel, including:
- ✗ Web browsing
- ✗ DNS queries
- ✗ Streaming
- ✗ Cloud service requests
- ✓ Only mindroots.theoption.life access benefits

This creates a bottleneck on the AWS instance's outbound bandwidth.

### Solutions (Recommended - Use Split Tunneling)

#### **Option 1: Split Tunneling (RECOMMENDED)**
Route only AWS-related traffic through VPN, everything else direct:

**Updated mac-client.ovpn**:
```
client
dev tun
proto udp
remote theoption.life 1194
resolv-retry infinite
nobind
persist-key
persist-tun
remote-cert-tls server
cipher AES-256-CBC
verb 3

# SPLIT TUNNELING - Route only AWS traffic through VPN
redirect-gateway def1 bypass-dhcp

# Route only these subnets through VPN:
route 172.31.0.0 255.255.0.0       # AWS VPC (10.0.0.0/16 typical, adjust if needed)
route 10.0.0.0 255.0.0.0           # AWS EC2-Classic
route 169.254.169.254 255.255.255.255  # AWS Metadata Service

# Allow local DNS to work for non-VPN sites
dhcp-option DNS 8.8.8.8
dhcp-option DNS 1.1.1.1

[CA, CERT, KEY sections...]
```

**Benefit**:
- Personal internet traffic flows directly (local ISP)
- Only AWS/mindroots.theoption.life routes through VPN
- No bottleneck on AWS outbound bandwidth

#### **Option 2: VPN-Only for SSH Access (ALTERNATIVE)**
Create a dedicated SSH jump host instead of full VPN:

```bash
# Connect directly via SSH (now allowed by security group)
ssh -i wp.pem bitnami@theoption.life

# Optional: Use ProxyCommand for internal AWS resources
ssh -i wp.pem -J bitnami@theoption.life internal-resource.aws.local
```

---

## 📋 Claude Code Integration Readiness

### Requirements for Direct Server Integration

#### ✅ Already in Place
1. **Git Deployment**: SSH push-to-deploy via GitHub actions possible
2. **PM2 Auto-restart**: Server auto-restarts after crashes
3. **Modular Code Structure**: Clean separation of concerns (routes/modules)
4. **Environment Configuration**: `.env` file for secrets (no hardcoding)
5. **Deployment Script**: `deploy-prod.sh` handles building and restarting
6. **Auth Middleware**: All endpoints protected with API keys

#### ❌ Not Currently Set Up
1. **Webhook Integration**: No GitHub webhook to trigger deployments
2. **MCP Server**: Not installed or configured
3. **Direct SSH Access**: Only available after security group update (already done)
4. **Monitoring/Logging**: PM2 logs exist but not centralized
5. **Automated Testing**: No pre-deployment test suite

### Implementation Path

#### Phase 1: Enable SSH Key Installation (IMMEDIATE)
```bash
# SSH into server
ssh -i /Users/omaribrahim/Downloads/Development_Code/wp.pem bitnami@theoption.life

# Create ~/.ssh directory for Claude integration
mkdir -p ~/.ssh/authorized_keys.d

# Add Claude's public key when available
# This allows direct SSH deployments without VPN
```

#### Phase 2: Set Up MCP Server (IF CHOOSING MCP APPROACH)
```bash
# Option A: Node.js-based MCP server
npm install --save @anthropic-ai/sdk

# Option B: Python-based MCP server (requires Python 3.9+)
pip install mcp

# Create MCP server wrapper for:
# - git pull / push operations
# - pm2 restart / logs
# - deployment script execution
# - server health checks
```

#### Phase 3: Implement GitHub Webhook (RECOMMENDED)
```bash
# Create webhook endpoint in Express
POST /webhook/github -> npm build + pm2 restart

# GitHub Settings:
# - Payload URL: https://theoption.life/webhook/github
# - Events: push to master
# - Secret: WEBHOOK_SECRET in .env
```

---

## 💾 Storage & Performance Analysis

### Disk Usage
```
Filesystem    Total    Used   Available   Usage%
/dev/xvda1     20G     13G      6.5G       66%
```

**Breakdown**:
- Build artifacts: ~1-2GB (frontend build)
- Node modules: 1-2GB
- Database files: ~3GB (if local)
- Git history: ~500MB
- Logs/temp: ~1GB
- OS/system: Rest

**Recommendation**: Clean old builds and npm cache when deploying.

### Memory Constraints
```
Total: 975MB
- Available: 95MB (at time of check)
- Cached: 555MB (freeable)
- Swap: 1GB (274MB in use)
```

**Build Flag Already Used**: `NODE_OPTIONS="--max-old-space-size=400"`

**Potential Issue**: 24 PM2 restarts might indicate memory pressure or crashes. Monitor with:
```bash
pm2 show mindroots-backend
pm2 logs mindroots-backend
```

---

## 🚀 Deployment Strategy Recommendations

### Current Deployment Flow
```
Local dev ─→ git push ─→ PM2 on server ─→ deploy-prod.sh ─→ nginx ─→ Users
```

### Recommended Improvements

#### 1. **Immediate: Fix VPN Split Tunneling**
Generate updated config with split tunneling enabled. This solves the bandwidth issue without affecting security.

#### 2. **Short-term: Monitor Server Stability**
```bash
# Check restart causes
pm2 logs mindroots-backend | tail -100

# Monitor memory
pm2 monitor
```

#### 3. **Medium-term: Enable Direct Claude Edits**
```bash
# Current workflow
- Make changes locally
- Commit to git
- SSH deploy-prod.sh manually

# Improved workflow
- Claude connects via SSH
- Makes changes directly to /var/www/mindroots/routes/modules/
- Runs tests
- Auto-restarts PM2
- Verifies via curl
```

#### 4. **Long-term: MCP Server (If Desired)**
Anthropic's Model Context Protocol would allow:
- Direct file read/write with security
- Command execution with sandboxing
- Real-time logs and monitoring
- Structured responses for Claude

---

## 🔧 Troubleshooting & Debugging

### Common Issues & Solutions

#### **1. Server Crashes (24 restarts)**
```bash
# Check error logs
pm2 logs mindroots-backend --err

# Check system resources
free -h
df -h

# Check if port conflicts
ss -tlnp | grep 5001

# Restart with debug info
pm2 restart mindroots-backend --watch
```

#### **2. Slow Deployment (Storage)**
```bash
# Clean unnecessary files
cd /var/www/mindroots
npm cache clean --force
rm -rf build
rm -rf node_modules/.cache

# Rebuild with minimal footprint
GENERATE_SOURCEMAP=false NODE_OPTIONS="--max-old-space-size=400" npm run build
```

#### **3. Database Connection Issues**
```bash
# Test Neo4j connectivity
curl https://***REDACTED_URI***/

# Check driver logs
pm2 logs mindroots-backend | grep -i neo4j
```

---

## 📚 File Structure for MCP Integration

```
/var/www/mindroots/
├── routes/modules/          ← Focus area for Claude edits
│   ├── corpus.js
│   ├── graph.js
│   ├── inspection.js        ← Most frequently modified
│   ├── search-modern.js
│   └── [others]
├── middleware/auth.js       ← Security policies
├── server.js                ← Entry point
└── .env                     ← Secrets (not edited via SSH)
```

---

## ✅ Final Assessment

### Backend Ready for Claude Integration?
**Yes, with caveats**:

| Aspect | Status | Notes |
|--------|--------|-------|
| Code Modularity | ✅ Excellent | Feature modules are well-isolated |
| Deployment | ✅ Ready | PM2 + deploy script in place |
| Authentication | ✅ Good | Dual API key system functional |
| VPN Issue | ⚠️ Solvable | Split tunneling config will fix |
| Security | ⚠️ Fair | Needs SSH key segregation |
| Monitoring | ❌ Limited | PM2 logs only, no alerting |

### VPN Bandwidth Issue
**Root Cause**: Default OpenVPN routing tunnels ALL traffic
**Fix**: Update client config for split tunneling (routes only AWS VPC through VPN)
**Impact**: Immediate improvement in mobile usability

### Next Steps
1. Generate split-tunnel OpenVPN configs
2. Monitor PM2 restart causes
3. Clean up disk space (6.5GB getting tight)
4. Implement health check endpoint
5. Optional: Add webhook for git-triggered deploys

---

**Last Updated**: December 4, 2024
**By**: Claude Code Assistant
**Status**: Ready for Phase 1 Implementation
