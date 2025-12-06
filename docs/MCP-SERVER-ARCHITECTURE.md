# MCP Server Architecture for Backend Code Editing

**Purpose**: Enable clients/mobile users to request backend changes via natural language
**Productization**: ChatGPT Custom Actions → Your API → MCP Server → Direct Backend Edits
**Status**: Architecture Design (Ready to Build)

---

## 🎯 Vision

```
Client (Phone/Browser)
    ↓
ChatGPT Custom Action
    ↓
Your API Endpoint (/api/edit-request)
    ↓
MCP Server
    ├─ Parse request in plain English
    ├─ Call Claude to generate code
    ├─ Validate syntax
    ├─ Test changes
    ├─ Restart backend
    └─ Report results back
    ↓
Client sees: "✅ Successfully updated corpus.js"
```

This is exactly like your data validation system but for code edits.

---

## 📊 Architecture Comparison

### What You Have Now (Data Validation)
```
Client Form
    ↓ JSON payload
Your API Endpoint
    ↓
Backend processes
    ↓
Stores in database
    ↓
Returns result
```

### What We'd Build (Code Editing)
```
Client/ChatGPT
    ↓ "Fix the search function to handle empty strings"
Your API Endpoint
    ↓
MCP Server
    ├─ Interprets request
    ├─ Calls Claude API
    ├─ Generates code
    ├─ Validates & tests
    ├─ Deploys
    └─ Returns result
    ↓
Client sees results + logs
```

**Key Difference**: The request is **plain English**, not JSON.

---

## 🏗️ Three Implementation Tiers

### **Tier 1: Simple (Start Here)**
```
Client sends: "Fix the corpus search to return 50 items instead of 25"
    ↓
Your API receives plain text request
    ↓
MCP Server:
  1. Parse what module/function needs editing
  2. Read current code
  3. Call Claude: "Change limit from 25 to 50"
  4. Apply change
  5. Test syntax
  6. Restart PM2
  7. Return: "✅ Updated corpus.js - deployed"
```

**Implementation**: 4-6 hours
**Complexity**: Medium
**Risk**: Low (syntax validation prevents breaks)

### **Tier 2: Productized (Your Goal)**
```
Client sends: "I need search results paginated with 100 items per page"
    ↓
ChatGPT Custom Action
    ↓
Your API with authentication
    ↓
MCP Server does full analysis:
  1. Understand requirements
  2. Analyze current code
  3. Generate solution
  4. Write tests
  5. Apply changes
  6. Run tests
  7. Deploy
  8. Send confirmation email
```

**Implementation**: 8-12 hours
**Complexity**: High
**Risk**: Low (comprehensive testing)

### **Tier 3: Full Platform (Future)**
```
Client Dashboard
    ├─ View pending edit requests
    ├─ Approve/reject changes
    ├─ See deployment history
    └─ Rollback if needed
    ↓
MCP Server
    ├─ Request queue
    ├─ Audit logging
    ├─ Multi-user access control
    ├─ Analytics
    └─ Billing integration
```

**Implementation**: 20+ hours
**Complexity**: Very High
**Risk**: Requires careful access control

---

## 🛠️ How to Build Tier 1 (Start Here)

### Step 1: Create Edit Request API Endpoint

**File**: `/var/www/mindroots/routes/modules/edit-request.js`

```javascript
const express = require('express');
const router = express.Router();
const { authenticateAPI } = require('../../middleware/auth');
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Request queue and results storage
const editRequests = new Map();

// POST /api/edit-request
// Receives plain-English edit request from client or ChatGPT
router.post('/edit-request', authenticateAPI, async (req, res) => {
  const { request, moduleFile, targetFunction } = req.body;

  // request: "Fix the corpus search to handle empty strings"
  // moduleFile: "corpus" (which is corpus.js)
  // targetFunction: "fetchCorpusItems" (optional, for accuracy)

  const requestId = Date.now().toString();

  try {
    // Step 1: Validate file to edit
    const modulePath = path.join(
      '/var/www/mindroots/routes/modules',
      `${moduleFile}.js`
    );

    if (!fs.existsSync(modulePath)) {
      return res.status(400).json({
        error: 'Module not found',
        available: fs.readdirSync('/var/www/mindroots/routes/modules')
          .filter(f => f.endsWith('.js'))
      });
    }

    // Step 2: Read current code
    const currentCode = fs.readFileSync(modulePath, 'utf8');

    // Step 3: Call Claude to generate edit
    const editInstructions = `
You are editing a Node.js Express.js backend module.

Current module file: ${moduleFile}.js
Current code:
\`\`\`javascript
${currentCode}
\`\`\`

User request: ${request}
${targetFunction ? `Target function: ${targetFunction}` : ''}

Your task:
1. Analyze the current code
2. Understand what needs to change
3. Generate the COMPLETE updated code (not just a diff)
4. Ensure all exports remain the same
5. Keep the same style and structure
6. Add comments explaining changes

Return ONLY the complete updated code block in \`\`\`javascript tags.
`;

    const Claude = require('@anthropic-ai/sdk');
    const claude = new Claude({
      apiKey: process.env.CLAUDE_API_KEY
    });

    const message = await claude.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: editInstructions
        }
      ]
    });

    // Step 4: Extract updated code from Claude response
    const responseText = message.content[0].text;
    const codeMatch = responseText.match(/```javascript\n([\s\S]*?)\n```/);

    if (!codeMatch) {
      return res.status(400).json({
        error: 'Could not parse generated code from Claude',
        raw_response: responseText.substring(0, 500)
      });
    }

    const updatedCode = codeMatch[1];

    // Step 5: Validate syntax
    const tempFile = `/tmp/validate_${requestId}.js`;
    fs.writeFileSync(tempFile, updatedCode);

    const validation = spawnSync('node', ['-c', tempFile]);
    fs.unlinkSync(tempFile);

    if (validation.status !== 0) {
      return res.status(400).json({
        error: 'Syntax validation failed',
        details: validation.stderr.toString(),
        generated_code: updatedCode
      });
    }

    // Step 6: Create backup
    const backupPath = `${modulePath}.backup.${Date.now()}`;
    fs.copyFileSync(modulePath, backupPath);

    // Step 7: Apply change
    fs.writeFileSync(modulePath, updatedCode);

    // Step 8: Restart PM2
    const restart = spawnSync('pm2', ['restart', 'mindroots-backend'], {
      timeout: 10000
    });

    if (restart.status !== 0) {
      // Rollback on failure
      fs.copyFileSync(backupPath, modulePath);
      spawnSync('pm2', ['restart', 'mindroots-backend']);

      return res.status(500).json({
        error: 'Backend restart failed, changes rolled back',
        backup: backupPath,
        details: restart.stderr.toString()
      });
    }

    // Step 9: Health check
    const health = spawnSync('curl', ['-s', 'http://localhost:5001/api/health']);

    if (health.status !== 0) {
      // Rollback
      fs.copyFileSync(backupPath, modulePath);
      spawnSync('pm2', ['restart', 'mindroots-backend']);

      return res.status(500).json({
        error: 'Health check failed after update, rolled back',
        backup: backupPath
      });
    }

    // Success!
    res.json({
      success: true,
      requestId,
      module: moduleFile,
      message: `Successfully updated ${moduleFile}.js`,
      backup: backupPath,
      changes: {
        before: currentCode.substring(0, 300) + '...',
        after: updatedCode.substring(0, 300) + '...'
      },
      deployed_at: new Date().toISOString()
    });

    // Log the change
    fs.appendFileSync('/var/www/mindroots/.edit-requests.log',
      `[${new Date().toISOString()}] ${requestId} - ${moduleFile}.js - Request: ${request}\n`
    );

  } catch (error) {
    console.error('Edit request error:', error);
    res.status(500).json({
      error: 'Internal error processing edit request',
      details: error.message
    });
  }
});

// GET /api/edit-request/:id
// Check status of an edit request
router.get('/edit-request/:id', authenticateAPI, (req, res) => {
  const { id } = req.params;

  // For now, just check if backup exists
  const backupGlob = `/var/www/mindroots/routes/modules/*.backup.${id}`;

  res.json({
    requestId: id,
    status: 'completed', // In future: pending, processing, completed, failed
    message: 'Check backend logs for details'
  });
});

module.exports = router;
```

### Step 2: Add to API Router

**File**: `/var/www/mindroots/routes/api.js`

```javascript
const editRequestRoutes = require('./modules/edit-request');
router.use('/', editRequestRoutes);  // Add with auth
```

### Step 3: Test from Phone/CLI

```bash
# Test from your phone via curl or Postman:
curl -X POST https://theoption.life/api/edit-request \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "request": "Make corpus search return 50 items instead of 25",
    "moduleFile": "corpus",
    "targetFunction": "fetchCorpusItems"
  }'

# Response:
{
  "success": true,
  "module": "corpus",
  "message": "Successfully updated corpus.js",
  "deployed_at": "2025-12-04T...",
  "backup": "/var/www/mindroots/routes/modules/corpus.js.backup.1733269200"
}
```

---

## 📱 ChatGPT Custom Action Setup

Once you have the API endpoint, create a ChatGPT Custom Action:

**Action Configuration**:

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "MindRoots Backend Editor",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": "https://theoption.life"
    }
  ],
  "paths": {
    "/api/edit-request": {
      "post": {
        "operationId": "submitBackendEdit",
        "summary": "Request a backend code change",
        "description": "Submit a natural language description of a backend change needed",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "request": {
                    "type": "string",
                    "description": "Plain English description of the change needed"
                  },
                  "moduleFile": {
                    "type": "string",
                    "enum": ["corpus", "graph", "search-modern", "inspection", "content", "lexicon"],
                    "description": "Which backend module to edit"
                  },
                  "targetFunction": {
                    "type": "string",
                    "description": "Optional: specific function to focus on"
                  }
                },
                "required": ["request", "moduleFile"]
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Edit successfully applied and deployed",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": { "type": "boolean" },
                    "module": { "type": "string" },
                    "message": { "type": "string" },
                    "deployed_at": { "type": "string" },
                    "backup": { "type": "string" }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Invalid request or syntax error"
          }
        }
      }
    }
  }
}
```

**Setup Steps**:

1. Go to ChatGPT → Custom GPT Settings → Actions
2. Click "Create new action"
3. Paste the OpenAPI schema above
4. Set Authentication: Bearer Token
5. Enter your API key: `REACT_APP_API_KEY` from `.env`
6. Test the action

---

## 🔄 Example User Flow

### Via Phone

```
You: (in ChatGPT app)
"Update the corpus module to handle empty searches"

ChatGPT:
1. Prepares the edit request
2. Calls your API with the request
3. MCP server generates code
4. Backend is updated
5. Shows result: "✅ Updated corpus.js with empty string handling"
```

### Via Client Portal

```
Client: (on your custom dashboard)
"I need search results paginated"

Your system:
1. Receives request
2. Triggers MCP server
3. Generates + tests code
4. Shows before/after diff
5. Asks for approval (optional)
6. Deploys
7. Sends confirmation email
```

---

## 🛡️ Safety Mechanisms

### 1. **Syntax Validation**
```javascript
// Every generated code is validated before deployment
const validation = spawnSync('node', ['-c', tempFile]);
if (validation.status !== 0) return error;
```

### 2. **Automatic Rollback**
```javascript
// If health check fails, automatically revert
if (healthCheck.failed) {
  fs.copyFileSync(backupPath, modulePath);
  pm2.restart();
}
```

### 3. **Backup Creation**
```javascript
// Every change backed up with timestamp
const backupPath = `${modulePath}.backup.${requestId}`;
fs.copyFileSync(modulePath, backupPath);
```

### 4. **Module Whitelist**
```javascript
// Only allow editing specific modules
const allowedModules = ['corpus', 'graph', 'search-modern', ...];
if (!allowedModules.includes(moduleFile)) {
  return error('Not allowed to edit this module');
}
```

### 5. **Rate Limiting**
```javascript
// Prevent spam
const editLimiter = rateLimit({
  windowMs: 60000,  // 1 minute
  max: 5            // 5 requests per minute
});
router.post('/edit-request', editLimiter, ...);
```

### 6. **Audit Logging**
```javascript
// Log every change for compliance
fs.appendFileSync('.edit-requests.log',
  `${timestamp} | ${userId} | ${module} | ${request}\n`
);
```

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────┐
│ Client (Phone or Web Browser)                   │
│ "Fix search to handle empty strings"           │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ ChatGPT Custom Action (Optional)                │
│ Formats request as API call                    │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ Your API Endpoint                               │
│ POST /api/edit-request                         │
│ Authorization: Bearer API_KEY                  │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ MCP Server (Claude's Interface)                │
│ ├─ Parse request                               │
│ ├─ Read current code                           │
│ ├─ Call Claude API                             │
│ ├─ Get generated code                          │
│ └─ Validate syntax                             │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ Backend Changes                                 │
│ ├─ Create backup                               │
│ ├─ Write new code                              │
│ ├─ Restart PM2                                 │
│ ├─ Health check                                │
│ └─ Return success/error                        │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ Response to Client                              │
│ "✅ Updated corpus.js - deployed at 3:45 PM"  │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Implementation Roadmap

### Week 1: MVP (Tier 1)
- [ ] Create edit-request endpoint
- [ ] Integrate Anthropic SDK
- [ ] Add syntax validation
- [ ] Implement backups + rollback
- [ ] Test with manual curl requests

### Week 2: Polish
- [ ] Add rate limiting
- [ ] Create audit logging
- [ ] Set up ChatGPT action
- [ ] Test end-to-end with ChatGPT
- [ ] Document for clients

### Week 3: Production
- [ ] Add approval workflow (optional)
- [ ] Create client dashboard (optional)
- [ ] Set up monitoring/alerting
- [ ] Deploy to production

### Future: Full Platform
- [ ] Multi-user access control
- [ ] Request queue + scheduling
- [ ] Billing integration
- [ ] Analytics dashboard

---

## 💡 Why MCP Matters Here

### Without MCP (What We Have Now)
```
Request → Your API → You manually call Claude → Generate code → Deploy
```
Limited automation, requires your intervention.

### With MCP (What We'd Build)
```
Request → Your API → MCP Server (Claude integration) → Auto everything → Deploy
```
- Claude is "always listening"
- Requests flow through structured interface
- Full automation with safety nets
- Easy to productize for clients

MCP is literally designed for this: **"An AI can call your backend via structured actions"**

---

## 🎯 Why This is Better Than Direct SSH

| Aspect | Mobile SSH | MCP API |
|--------|-----------|---------|
| **Input** | Text editor (cli) | Plain English request |
| **Processing** | Manual | Fully automated |
| **Safety** | Manual validation | Auto syntax check + rollback |
| **Productization** | Not possible | Easy (ChatGPT action) |
| **Audit** | Manual logging | Auto logged |
| **Speed** | Minutes (manual) | Seconds (automated) |
| **Clients** | Can't use | Can self-serve |
| **Mobile** | Clunky (small screen) | Clean API call |

---

## 📦 Dependencies to Add

```bash
npm install @anthropic-ai/sdk express-rate-limit
```

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.24.0",
    "express-rate-limit": "^7.1.5"
  }
}
```

---

## ✅ Checklist to Get Started

- [ ] Understand the vision (natural language → code changes)
- [ ] Review the endpoint code (edit-request.js above)
- [ ] Set up dependencies
- [ ] Create the endpoint
- [ ] Test with curl from phone
- [ ] Set up ChatGPT action
- [ ] Test with ChatGPT
- [ ] Add to productization flow

---

## 🎓 Next Questions

1. **Do you want approval workflows?** (Client submits → You approve → Deploy)
2. **Should there be a dashboard?** (View pending requests, history, rollback)
3. **Who are your first clients?** (Helps refine safety rules)
4. **Multi-module support?** (Can clients edit multiple files at once?)
5. **Rate limiting?** (How many changes per day/week?)

---

**Status**: Ready to build
**Complexity**: Medium
**Time to MVP**: 6-8 hours
**Time to Production**: 2-3 weeks
**Productization Value**: Very High

This turns your backend into a **self-service platform** where clients submit change requests in natural language and Claude handles everything automatically. Perfect for mobile work too.

