# Workspace Module Documentation

**Purpose**: Creative workspace for Custom GPT graphical media — flyers, social posts, and any graphical content with versioned storage, PNG rendering, and shared asset library.

**Status**: Production-ready

---

## Overview

The Workspace Module enables a Custom GPT to:
1. Submit HTML/CSS graphic designs organized by project
2. Receive versioned storage with preview URLs
3. Request PNG rendering in multiple formats per version
4. Browse available assets (logos, backgrounds, templates)
5. Organize work into named project folders

This module operates independently of the MindRoots graph database and linguistic features.

---

## Architecture

### Multi-Tenant Storage Structure

Each tenant (Custom GPT) gets an isolated workspace under `/workspaces/{tenant}/`:

```
workspaces/                          # Top-level — all tenant data
├── aif/                             # AIF GPT workspace
│   ├── assets/
│   │   ├── logos/
│   │   ├── backgrounds/
│   │   └── templates/
│   └── projects/
│       ├── .index.json              # ID→project lookup map
│       ├── ramadan-2026/
│       │   └── {id}/v001/
│       └── legacy/
├── mindroots/                       # MindRoots branding GPT workspace
│   ├── assets/
│   │   ├── logos/
│   │   ├── backgrounds/
│   │   └── templates/
│   └── projects/
│       └── .index.json
```

### Tenant Resolution

Workspace identity is encoded in self-describing API tokens:

```
ws_<workspaceId>_<randomSecret>
```

Examples: `ws_aif_83fj29fk29`, `ws_mindroots_k29f92jf9`

The auth middleware parses `workspaceId` from the token prefix, validates the workspace directory exists, and sets `req.workspace`. No per-tenant env vars needed.

### .index.json Format

```json
{
  "abc123def456gh78": "ramadan-2026",
  "99ff00aa11bb22cc": "family-social"
}
```

Written on every create, enforces ID uniqueness, enables O(1) lookup.

### meta.json Format

Supports multiple render formats per version via `renders` map:

```json
{
  "id": "abc123def456gh78",
  "project": "ramadan-2026",
  "version": 1,
  "timestamp": "2026-02-13T07:14:58.340Z",
  "author": "flyer",
  "source": "custom_gpt",
  "notes": "Initial design",
  "renderStatus": "completed",
  "renders": {
    "ig_square": {
      "timestamp": "2026-02-13T07:16:53.160Z",
      "filename": "graphic_abc123..._v1_ig_square.png"
    },
    "letter": {
      "timestamp": "2026-02-13T08:00:00.000Z",
      "filename": "graphic_abc123..._v1_letter.png"
    }
  }
}
```

---

## API Endpoints

### Browse Workspace

**GET** `/api/workspace`

One endpoint for all reads. Lightweight by default, query params to expand.

| Param | Effect |
|-------|--------|
| (none) | Returns asset counts + project names with graphic counts |
| `assets=true` | Includes full asset file listings with URLs |
| `project=ramadan-2026` | Returns full detail for one project |
| `id=abc123...` | Returns full detail for one graphic |
| `includeVersions=true` | Includes version arrays when listing projects |
| `maxVersions=3` | Limits version entries returned per graphic |

**Default response:**
```json
{
  "assets": { "logos": 3, "backgrounds": 0, "templates": 0 },
  "projects": {
    "ramadan-2026": { "count": 2 },
    "family-social": { "count": 1 }
  }
}
```

---

### Create Graphic / New Version

**POST** `/api/workspace/create`

Creates a new graphic (provide `project`) or a new version (provide `id`).

**New graphic:**
```json
{
  "project": "ramadan-2026",
  "html": "<div>...</div>",
  "css": "body { ... }",
  "metadata": { "notes": "Initial design" }
}
```

**New version:**
```json
{
  "id": "abc123...",
  "html": "<div>...</div>",
  "css": "body { ... }",
  "notes": "Updated colors"
}
```

**Response (201):**
```json
{
  "id": "abc123...",
  "project": "ramadan-2026",
  "version": 2,
  "previewUrl": "https://theoption.life/workspaces/aif/projects/ramadan-2026/abc123.../v002/index.html",
  "message": "Version 2 created successfully"
}
```

Concurrency protection: version directories created with `fs.mkdir(path, { recursive: false })`. On `EEXIST`, increments version and retries (max 3 attempts).

---

### Render to Image

**POST** `/api/workspace/render`

```json
{
  "id": "abc123...",
  "format": "ig_square",
  "version": 2
}
```

**Supported Formats:**
| Format | Dimensions | Use Case |
|--------|-----------|----------|
| `letter` | 816×1056px | US standard print |
| `a4` | 794×1123px | International print |
| `ig_square` | 1080×1080px | Instagram post |
| `ig_story` | 1080×1920px | Instagram story |

**Response:**
```json
{
  "id": "abc123...",
  "project": "ramadan-2026",
  "version": 2,
  "format": "ig_square",
  "imageUrl": "https://theoption.life/workspaces/aif/projects/ramadan-2026/abc123.../v002/graphic_abc123..._v2_ig_square.png",
  "message": "Image rendered successfully"
}
```

Multiple formats can be rendered per version — each is stored in the `renders` map in meta.json.

---

### Organize Projects

**POST** `/api/workspace/organize`

```json
{ "project": "ramadan-2026/social-media" }
```

**Path hardening:**
- Normalizes with `path.normalize()`, rejects `..` components
- Strips leading `/`
- Allows only: `[a-zA-Z0-9_-/]`
- Rejects empty segments

**Response (201):**
```json
{
  "project": "ramadan-2026/social-media",
  "message": "Project folder \"ramadan-2026/social-media\" created successfully"
}
```

---

## Security

### HTML Sanitization

Blocked: `<script>` tags, event handlers (`onclick`, `onerror`, etc.), `javascript:` URLs, `data:text/html` URLs, `<iframe>`, `<object>`, `<embed>`, `<applet>`, `<form>` tags, meta refresh redirects.

### CSS Sanitization

Blocked: CSS `expression()`, `javascript:` in CSS, external `@import` URLs, `behavior:` property.

### Path Traversal Protection

Project paths are sanitized to prevent directory traversal attacks.

---

## Environment Configuration

Add to `.env`:
```bash
# Multi-tenant workspace public URL (used for generating asset/preview URLs)
WORKSPACES_PUBLIC_URL=https://theoption.life/workspaces
```

No per-tenant env vars needed — workspace identity is encoded in the token itself.

Workspace API tokens follow the format `ws_<workspaceId>_<secret>` and are passed as Bearer tokens in the Authorization header.

---

## Dependencies

### Required
- `express`, `fs`, `path`, `crypto` (all existing/built-in)

### Optional (for image rendering)
- `puppeteer` — Install with: `npm install puppeteer`

---

## Testing

```bash
# Lightweight browse
curl http://localhost:5001/api/workspace -H "Authorization: Bearer KEY"

# Full assets + project detail
curl "http://localhost:5001/api/workspace?assets=true&project=test&includeVersions=true" -H "Authorization: Bearer KEY"

# Create project folder
curl -X POST http://localhost:5001/api/workspace/organize \
  -H "Authorization: Bearer KEY" -H "Content-Type: application/json" \
  -d '{"project": "test"}'

# Create graphic
curl -X POST http://localhost:5001/api/workspace/create \
  -H "Authorization: Bearer KEY" -H "Content-Type: application/json" \
  -d '{"project": "test", "html": "<h1>Test</h1>", "metadata": {"notes": "Testing"}}'

# New version
curl -X POST http://localhost:5001/api/workspace/create \
  -H "Authorization: Bearer KEY" -H "Content-Type: application/json" \
  -d '{"id": "GRAPHIC_ID", "html": "<h1>Updated</h1>", "notes": "v2"}'

# Render
curl -X POST http://localhost:5001/api/workspace/render \
  -H "Authorization: Bearer KEY" -H "Content-Type: application/json" \
  -d '{"id": "GRAPHIC_ID", "format": "ig_square"}'
```

---

## Migration History

### Flyer → Workspace (Feb 2026)
- `flyers/` → `projects/` (top-level directory)
- `flyers/assets/` → `assets/` (top-level directory)
- Legacy flyer `311afed1674226c7` moved to `projects/legacy/`
- `routes/modules/flyer.js` → `routes/modules/workspace.js`
- Response field `flyerId` → `id`
- Static serving: `/flyers` → `/projects` and new `/assets`

### Single-tenant → Multi-tenant (Mar 2026)
- `projects/` → `workspaces/aif/projects/`
- `assets/` → `workspaces/aif/assets/`
- New `workspaces/mindroots/` tenant created
- Static serving: `/projects` + `/assets` → single `/workspaces` mount
- Auth: workspace tokens (`ws_<id>_<secret>`) replace `FLYER_API_KEY`
- URLs: `/projects/...` → `/workspaces/{tenant}/projects/...`
- URLs: `/assets/...` → `/workspaces/{tenant}/assets/...`

### nginx (production)
Replace `/projects/` and `/assets/` location blocks with:
```nginx
location /workspaces/ {
    alias /home/omaribrahim/mindroots/workspaces/;
}
```

---

**Last Updated**: March 3, 2026
**Module Location**: `routes/modules/workspace.js`
**OpenAPI Spec**: `docs/features/workspace-openapi-spec.yaml`
