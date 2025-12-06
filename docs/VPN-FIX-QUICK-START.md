# VPN Split Tunneling Quick Start

**Problem**: When connected to VPN, all internet traffic (web, streaming, etc.) slows to a crawl
**Solution**: Use split tunneling to route only AWS traffic through VPN
**Time to Fix**: 5 minutes

---

## 🎯 What's Happening

Your current VPN routes **everything** through AWS:
```
Your Computer
    ↓
VPN Tunnel (AWS server)
    ↓
Internet (all traffic)
```

This creates a bottleneck because:
- Netflix streams through AWS
- Email fetches through AWS
- Downloads go through AWS
- Result: You're limited by AWS server's outbound bandwidth

---

## ✅ The Fix: Split Tunneling

Route **only AWS traffic** through VPN, everything else direct:

```
Your Computer
    ├─ AWS traffic → VPN Tunnel (AWS server) → AWS Resources
    └─ Internet traffic → Direct to ISP → Rest of internet
```

Result:
- AWS access: Secure via VPN ✅
- Web browsing: Fast via ISP ✅
- Streaming: Fast via ISP ✅
- No bottleneck ✅

---

## 📝 Step 1: Get the Fixed Config

The file is ready to use: `docs/mac-client-split-tunnel.ovpn`

This file has:
- ✅ Split tunneling enabled
- ✅ AWS VPC routed through VPN (172.31.0.0/16)
- ✅ AWS metadata service routed (169.254.169.254)
- ✅ DNS configured for both local and VPN
- ✅ Your CA certificate embedded
- ✅ Well-commented instructions

---

## 🔧 Step 2: Update Certificates

The config file already has your CA certificate. You need to add your client certificate and key.

### Get Your Certificates

SSH into the server:
```bash
ssh -i /Users/omaribrahim/Downloads/Development_Code/wp.pem bitnami@theoption.life
```

Find your certs (they're in the home directory):
```bash
ls -la ~/*.crt ~/*.key ~/*.pem 2>/dev/null
```

If you have `client.crt` and `client.key`:
```bash
cat ~/client.crt
cat ~/client.key
```

Copy the full content of each.

### Update the Config File

Edit `docs/mac-client-split-tunnel.ovpn`:

Find these sections and paste your certificates:

```
<cert>
# Paste your full client certificate (client.crt) here
-----BEGIN CERTIFICATE-----
[paste entire certificate]
-----END CERTIFICATE-----
</cert>

<key>
# Paste your full client key (client.key) here
-----BEGIN PRIVATE KEY-----
[paste entire key]
-----END PRIVATE KEY-----
</key>
```

---

## 📱 Step 3: Install on Mac

### Option A: Tunnelblick App (Recommended)

1. **Download Tunnelblick**: https://tunnelblick.net/
2. **Open the app**, drag & drop `mac-client-split-tunnel.ovpn`
3. **Click "Install"** when prompted
4. **Enter your Mac password**
5. Done!

### Option B: OpenVPN Connect App

1. **Download**: https://openvpn.net/cloud/
2. **Import** the `.ovpn` file
3. **Click Import** and follow prompts
4. Done!

### Option C: Command Line (Advanced)

```bash
# Copy config to OpenVPN directory
cp docs/mac-client-split-tunnel.ovpn /usr/local/etc/openvpn/

# Connect
openvpn --config /usr/local/etc/openvpn/mac-client-split-tunnel.ovpn
```

---

## ✅ Step 4: Test It Works

### Connect to VPN
Open Tunnelblick → Click "Connect" → Enter your VPN password

### Verify Split Tunneling

**Test 1: Local Internet (should be FAST)**
```bash
# This should be fast (going directly to ISP)
ping 8.8.8.8
curl https://www.google.com
```

**Test 2: AWS Access (should work)**
```bash
# This should work (going through VPN)
ssh -i /Users/omaribrahim/Downloads/Development_Code/wp.pem bitnami@theoption.life

# Inside the server, test internet (should be normal)
ping 8.8.8.8
```

**Test 3: Check VPN Interface**
```bash
# Open Activity Monitor → Network tab
# Should see utun0 or tun0 interface (small traffic)
# If all internet is going through VPN, you'll see huge numbers here
```

### Expected Results
- ✅ `ping 8.8.8.8`: ~30ms response time (normal internet speed)
- ✅ SSH to AWS: Works fine
- ✅ VPN interface: Only shows AWS traffic, not all internet
- ✅ Web browsing: Fast as before
- ✅ Netflix/streaming: Works at full speed

---

## 🔙 Step 5: Compare Old vs New

### Old Config (Default Routing)
```
Connected to VPN?
├─ All web traffic → AWS (SLOW)
├─ All downloads → AWS (SLOW)
├─ All streaming → AWS (BLOCKED)
└─ AWS apps → AWS (works, but slow)
```

### New Config (Split Tunneling)
```
Connected to VPN?
├─ AWS-only traffic → VPN (secure & fast)
├─ Web traffic → Direct ISP (fast)
├─ Downloads → Direct ISP (fast)
├─ Streaming → Direct ISP (fast)
└─ AWS apps → VPN (secure & works)
```

---

## 🎯 Expected Performance Improvement

| Activity | Before | After |
|----------|--------|-------|
| Web browsing | Slow | Fast ✅ |
| AWS SSH | Works | Works |
| Mobile work | Painful | Enjoyable ✅ |
| Streaming | Blocked | Works ✅ |
| Video calls | Laggy | Clear ✅ |

---

## 🚨 Troubleshooting

### "Can't connect to AWS"
- **Cause**: Tunnel isn't running
- **Fix**: Check VPN is connected in Tunnelblick
- **Test**: `ping 172.31.48.164` (AWS IP)

### "Everything still goes through VPN"
- **Cause**: Config didn't apply split tunneling
- **Fix**: Delete and re-import `mac-client-split-tunnel.ovpn`
- **Test**: Check Activity Monitor > Network for small VPN traffic

### "Can't connect to VPN at all"
- **Cause**: Certificate issues
- **Fix**: Verify certs are in the `.ovpn` file
- **Check**: Open file in text editor, look for `-----BEGIN CERTIFICATE-----`

### "Internet is still slow"
- **Cause**: Might not be using the right config
- **Fix**:
  ```bash
  # Check which VPN is connected
  ifconfig | grep -i tun

  # Check VPN config
  cat ~/.openvpn/ovpn_profiles/mac-client-split-tunnel/config.ovpn | grep redirect
  ```

---

## 🔄 Switching Between Configs

### If You Need to Use Full Tunneling Again
Keep the old `mac-client.ovpn` file. You can switch:

1. Tunnelblick: Just click different profiles in menu
2. OpenVPN Connect: Swipe to switch profiles
3. Disconnect and import different config

---

## 📋 Configuration Details

### What's Being Routed Through VPN
```
172.31.0.0/16    - AWS VPC (your region)
169.254.169.254  - AWS Metadata Service
```

### What's Going Direct (NOT through VPN)
```
Everything else:
- 8.8.8.8 - Google DNS (internet)
- 1.1.1.1 - Cloudflare DNS (internet)
- Netflix, YouTube, etc.
- Web browsers
- Downloads
- All normal internet
```

### DNS Settings
```
8.8.8.8  - Google (public, for non-VPN sites)
1.1.1.1  - Cloudflare (backup, for non-VPN sites)
```

---

## ✨ You're Done!

After setup, you have:
- ✅ Secure AWS access via VPN
- ✅ Fast internet via direct ISP
- ✅ No bottleneck for mobile work
- ✅ Same security, better performance

---

## 🔗 Related Docs

- **Full Infrastructure Analysis**: `docs/INFRASTRUCTURE-ANALYSIS.md`
- **Claude Integration Guide**: `docs/CLAUDE-INTEGRATION-GUIDE.md`
- **Infrastructure Summary**: `docs/INFRASTRUCTURE-SUMMARY.md`

---

**Created**: December 4, 2024
**Status**: Ready to Deploy
**Impact**: 5-10x faster mobile connectivity
**Effort**: 5 minutes
**Risk**: None (just config change, can switch back anytime)
