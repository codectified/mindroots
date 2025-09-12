# GPT Orchestration Security - Production Deployment Guide

**Date**: September 9, 2025  
**Purpose**: Step-by-step deployment of dual API key system to production  
**Status**: Ready for deployment

---

## 🎯 **Deployment Overview**

You need to deploy the new dual API key system to production and configure your GPTs with the appropriate keys.

**Current State**: 
- ✅ Code implemented and tested on localhost
- ❌ Production server still has old authentication system
- ❌ GPTs not yet configured

**Target State**:
- ✅ Production server with dual API key system
- ✅ MindRead GPT configured with PUBLIC_API_KEY (read-only)
- ✅ MindRoot GPT configured with ADMIN_API_KEY (full access)

---

## 🔐 **Step 1: Generate Secure API Keys**

**You need to create TWO new secure API keys yourself:**

### **Recommended Key Generation Methods:**

#### **Option A: Using Node.js (if available)**
```bash
node -e "console.log('PUBLIC_API_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('ADMIN_API_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
```

#### **Option B: Using OpenSSL**
```bash
echo "PUBLIC_API_KEY=$(openssl rand -hex 32)"
echo "ADMIN_API_KEY=$(openssl rand -hex 32)"
```

#### **Option C: Online Generator (use reputable source)**
- Generate two 64-character random strings
- Use a secure random generator like: `https://www.random.org/strings/`

### **Example Output (DO NOT USE THESE - GENERATE YOUR OWN):**
```bash
PUBLIC_API_KEY=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
ADMIN_API_KEY=z9y8x7w6v5u4321098765432109876543210fedcba0987654321fedcba098765
```

---

## 🚀 **Step 2: Production Server Deployment**

### **Files to Deploy**
**Modified Files:**
- `middleware/auth.js` - New dual API key authentication
- `routes/api.js` - Updated endpoints with sanitization
- `.env` - Updated with new API keys

### **SSH to Production Server**
```bash
ssh -i /Users/omaribrahim/Downloads/wp.pem bitnami@34.228.180.221
cd /var/www/mindroots
```

### **Git Deployment Process (CRITICAL ORDER)**
```bash
# 1. Backup current state
git status  # Should be clean
git log -1  # Note current commit

# 2. Pull latest changes
git checkout master
git pull origin master

# 3. Update .env with YOUR generated keys
nano .env

# Add these lines (replace with YOUR keys):
# PUBLIC_API_KEY=your-64-char-public-key-here
# ADMIN_API_KEY=your-64-char-admin-key-here

# 4. Restart backend services
pm2 restart all
pm2 logs --lines 20  # Check for startup errors
```

### **Production .env Configuration**
Your production `.env` should look like:
```bash
# Neo4j Database Configuration (keep existing)
NEO4J_URI=neo4j+s://0cbfce87.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=WesStKZQAAf8rBZ6AJVQJnnP7t8WTlPVPQK2mZnmSKw

# OpenAI API Key (keep existing)
OAI_SECRET=sk-svcacct-...

# NEW: DUAL API KEY SYSTEM
PUBLIC_API_KEY=your-64-char-public-key-here
ADMIN_API_KEY=your-64-char-admin-key-here

# Keep existing for backward compatibility
API_KEY=[LEGACY_API_KEY]
```

---

## 🤖 **Step 3: Configure Your GPTs**

### **MindRead GPT Configuration (Read-Only)**

**API Endpoint Configuration:**
- **Base URL**: `https://theoption.life/api`
- **Endpoint**: `/execute-query` 
- **Method**: POST
- **API Key**: `your-64-char-public-key-here` ← Use your PUBLIC_API_KEY

**Headers:**
```json
{
  "Authorization": "Bearer your-64-char-public-key-here",
  "Content-Type": "application/json"
}
```

**Request Body Format:**
```json
{
  "query": "MATCH (n:Root) RETURN n.arabic LIMIT 5"
}
```

**Capabilities:**
- ✅ Search and retrieve data (MATCH, RETURN)
- ✅ Statistical queries (COUNT, aggregations) 
- ✅ Complex filtering and analysis
- ❌ Cannot modify database (CREATE, DELETE blocked)

### **MindRoot GPT Configuration (Full Access)**

**API Endpoint Configuration:**
- **Base URL**: `https://theoption.life/api`
- **Endpoint**: `/admin-query`
- **Method**: POST  
- **API Key**: `your-64-char-admin-key-here` ← Use your ADMIN_API_KEY

**Headers:**
```json
{
  "Authorization": "Bearer your-64-char-admin-key-here",
  "Content-Type": "application/json"
}
```

**Request Body Format:**
```json
{
  "query": "CREATE (n:TestNode {name: 'example'}) RETURN n"
}
```

**Capabilities:**
- ✅ All read operations (same as MindRead)
- ✅ Create nodes and relationships
- ✅ Update existing data (SET operations)
- ✅ Delete operations (DELETE, DETACH DELETE)
- ✅ Enhanced response metadata

---

## 🧪 **Step 4: Test Production Deployment**

### **Test 1: Public Endpoint (Read-Only)**
```bash
curl -X POST "https://theoption.life/api/execute-query" \
     -H "Authorization: Bearer your-64-char-public-key-here" \
     -H "Content-Type: application/json" \
     -d '{"query": "MATCH (n:Root) RETURN n.arabic LIMIT 3"}'

# Expected: Success with data
# [{"n.arabic":"ا-ب-د"},{"n.arabic":"ا-ب-ر"},{"n.arabic":"ا-ب-ض"}]
```

### **Test 2: Public Endpoint Blocks Writes**
```bash
curl -X POST "https://theoption.life/api/execute-query" \
     -H "Authorization: Bearer your-64-char-public-key-here" \
     -H "Content-Type: application/json" \
     -d '{"query": "CREATE (n:TestNode) RETURN n"}'

# Expected: 403 Forbidden
# {"error":"Write operation 'CREATE' not allowed..."}
```

### **Test 3: Admin Endpoint (Full Access)**
```bash
curl -X POST "https://theoption.life/api/admin-query" \
     -H "Authorization: Bearer your-64-char-admin-key-here" \
     -H "Content-Type: application/json" \
     -d '{"query": "MATCH (n:Root) RETURN count(n) as total_roots"}'

# Expected: Success with enhanced metadata
# {"records":[{"total_roots":5041}],"summary":{...}}
```

### **Test 4: Verify Frontend Still Works**
- Open https://theoption.life in browser
- Test basic search functionality
- Should work normally (uses old API key with backward compatibility)

---

## 🔒 **Security Checklist**

### **Before Deployment:**
- [ ] Generated secure, unique API keys (64+ characters)
- [ ] Verified keys are different from each other
- [ ] Confirmed production .env has correct database credentials

### **After Deployment:**
- [ ] Public endpoint allows reads, blocks writes
- [ ] Admin endpoint allows all operations
- [ ] Invalid keys are rejected
- [ ] Frontend still works with legacy key
- [ ] PM2 logs show no authentication errors

### **GPT Configuration:**
- [ ] MindRead GPT uses PUBLIC_API_KEY
- [ ] MindRoot GPT uses ADMIN_API_KEY
- [ ] Both GPTs use correct endpoints
- [ ] Test queries work in both GPTs

---

## 🚨 **Emergency Rollback Plan**

If something goes wrong:

### **Quick Rollback:**
```bash
# SSH to production
ssh -i /Users/omaribrahim/Downloads/wp.pem bitnami@34.228.180.221
cd /var/www/mindroots

# Remove new API keys from .env
nano .env
# Delete PUBLIC_API_KEY and ADMIN_API_KEY lines

# Restart services
pm2 restart all

# If needed, rollback code
git log --oneline -5  # Find previous commit
git checkout <previous-commit-hash>
pm2 restart all
```

---

## 📋 **Summary Checklist**

### **Your Action Items:**

1. **Generate API Keys** (do this first)
   - [ ] Create PUBLIC_API_KEY (64 chars)
   - [ ] Create ADMIN_API_KEY (64 chars) 
   - [ ] Save them securely

2. **Deploy to Production**
   - [ ] SSH to production server
   - [ ] Git pull latest changes
   - [ ] Update .env with your keys
   - [ ] Restart PM2 services
   - [ ] Test endpoints with curl

3. **Configure GPTs**
   - [ ] MindRead GPT → PUBLIC_API_KEY + `/execute-query`
   - [ ] MindRoot GPT → ADMIN_API_KEY + `/admin-query`
   - [ ] Test both GPTs

### **Key Information for GPT Setup:**

**For MindRead GPT (Read-Only):**
- Endpoint: `https://theoption.life/api/execute-query`
- API Key: Your PUBLIC_API_KEY
- Can query data, cannot modify

**For MindRoot GPT (Admin):**  
- Endpoint: `https://theoption.life/api/admin-query`
- API Key: Your ADMIN_API_KEY
- Full database access

---

**Ready for deployment!** Let me know if you have questions about any of these steps.