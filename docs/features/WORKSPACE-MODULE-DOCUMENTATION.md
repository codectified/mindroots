# Workspace Module Documentation

**Purpose**: Creative workspace for Custom GPT graphical media — flyers, social posts, and any graphical content with versioned storage, PNG rendering, and shared asset library.

**Status**: Production-ready

---

## Overview

The Workspace Module enables a Custom GPT to:
1. Submit HTML/CSS graphic designs organized by project
2. Receive versioned storage with preview URLs
3. Retrieve source HTML/CSS/metadata for any version
4. Get inline (self-contained) HTML previews with embedded CSS
5. Request PNG rendering in multiple formats per version
6. Browse available assets (logos, backgrounds, templates)
7. Organize work into named project folders

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

The auth middleware parses `workspaceId` from the token prefix, reads the `.token` file from that workspace directory, and validates the full token matches. On success it sets `req.workspace`. No per-tenant env vars needed.

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
  "baseVersion": null,
  "author": "workspace",
  "source": "custom_gpt",
  "notes": "Initial design",
  "renderStatus": "pending",
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
| `id=abc123...&version=2` | Returns source `html`, `css`, and `meta` for that specific version |
| `id=abc123...&version=2&inline=true` | Returns self-contained HTML with CSS embedded in a `<style>` tag |

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

**Source retrieval response** (`?id=abc123...&version=1`):
```json
{
  "id": "abc123...",
  "project": "ramadan-2026",
  "version": 1,
  "html": "<!DOCTYPE html>...",
  "css": "body { ... }",
  "meta": { "id": "abc123...", "version": 1, "baseVersion": null, "notes": "Initial design", ... }
}
```

**Inline preview response** (`?id=abc123...&version=1&inline=true`):
```json
{
  "id": "abc123...",
  "project": "ramadan-2026",
  "version": 1,
  "inlineHTML": "<!DOCTYPE html><html><head><style>body { ... }</style></head><body>...</body></html>"
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

**New version (with ancestry tracking):**
```json
{
  "id": "abc123...",
  "html": "<div>...</div>",
  "css": "body { ... }",
  "notes": "Updated colors",
  "baseVersion": 1
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

**Font handling**: The backend auto-injects `@font-face` declarations for all shared Arabic fonts. The GPT just writes `font-family: "Amiri"` — no manual `@font-face` needed.

- **Browser previews**: `@font-face` with HTTP URLs pointing to `_shared/fonts/` (loaded over the network)
- **Puppeteer renders**: `@font-face` with base64 data URIs (fonts read from disk and embedded inline). This is required because `page.setContent()` creates an `about:blank` origin — Chromium blocks both `file://` and self-referencing HTTP URLs from this origin.
- **System fonts**: Fonts are also installed to `/usr/share/fonts/truetype/arabic-workspace/` with `fc-cache -fv` as a fallback for any CSS that references fonts without `@font-face`.
- **Font cache**: Base64 font data is cached in memory after first read (no repeated disk I/O).
- The render endpoint calls `document.fonts.ready` before taking the screenshot to ensure fonts are fully loaded.

**Available fonts**: Amiri, Noto Naskh Arabic, IBM Plex Sans Arabic, Scheherazade New (regular + bold each).

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

## Managing Tenants

### Adding a New Tenant

On the **production server** (see `DEPLOYMENT-PRIVATE.md` for SSH details):

```bash
TENANT=newtenant

# 1. Create directory structure
mkdir -p <app-root>/workspaces/$TENANT/assets/{logos,backgrounds,templates}
mkdir -p <app-root>/workspaces/$TENANT/projects
echo '{}' > <app-root>/workspaces/$TENANT/projects/.index.json

# 2. Generate and store API token
TOKEN="ws_${TENANT}_$(openssl rand -hex 16)"
echo -n "$TOKEN" > <app-root>/workspaces/$TENANT/.token
echo "Token for $TENANT: $TOKEN"
```

Then set up the Custom GPT with this token (see [GPT Base Instructions](CREATIVE-WORKSPACE-AGENT-INSTRUCTIONS.md)).

Do the same locally for development:
```bash
mkdir -p workspaces/$TENANT/assets/{logos,backgrounds,templates}
mkdir -p workspaces/$TENANT/projects
echo '{}' > workspaces/$TENANT/projects/.index.json
echo -n "$TOKEN" > workspaces/$TENANT/.token
```

### Uploading Tenant Assets

Assets are static files (logos, backgrounds, templates) served by nginx. Upload via `scp`:

```bash
# Upload a logo (see DEPLOYMENT-PRIVATE.md for SSH/SCP details)
scp -i <key-path> logo.png <user>@<host>:<app-root>/workspaces/$TENANT/assets/logos/

# Upload a background
scp -i <key-path> bg.jpg <user>@<host>:<app-root>/workspaces/$TENANT/assets/backgrounds/
```

Assets are immediately available at:
```
https://<domain>/workspaces/<tenant>/assets/logos/logo.png
https://<domain>/workspaces/<tenant>/assets/backgrounds/bg.jpg
```

No server restart needed — nginx serves them as static files.

The GPT sees these assets when it calls `getWorkspace` with `assets=true`.

### Asset Categories

| Directory | Purpose | Examples |
|-----------|---------|----------|
| `logos/` | Organization logos and branding | host-logo.png, org-icon.svg |
| `backgrounds/` | Background images for graphics | pattern.png, gradient.jpg |
| `templates/` | Reusable HTML/CSS templates | (future use) |

### Shared Assets

Assets in `workspaces/_shared/` are available to all tenants. These **are** tracked in git.

- `_shared/icons/` — 19 SVG icons (calendar, location, mosque, etc.)
- `_shared/fonts/` — Arabic web fonts in woff2 format (Amiri, Noto Naskh Arabic, IBM Plex Sans Arabic, Scheherazade New — regular + bold)

### Current Tenant Assets

**AIF** (`workspaces/aif/assets/`):
- `logos/host-logo.jpg` — AIF organization logo
- `logos/Deif.jpeg` — Imam photo

**MindRoots** (`workspaces/mindroots/assets/`):
- `logos/root-tree.jpeg` — MindRoots tree logo

### Security Notes

- `.token` files are gitignored — secrets never enter the repository
- Tenant assets and projects are gitignored — only `_shared/` is tracked
- Token validation reads `.token` on each request (no caching, so token rotation is instant)
- To rotate a token: overwrite the `.token` file and update the Custom GPT's API key

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

# New version with baseVersion
curl -X POST http://localhost:5001/api/workspace/create \
  -H "Authorization: Bearer KEY" -H "Content-Type: application/json" \
  -d '{"id": "GRAPHIC_ID", "html": "<h1>Updated</h1>", "notes": "v2", "baseVersion": 1}'

# Retrieve source for a specific version
curl "http://localhost:5001/api/workspace?id=GRAPHIC_ID&version=1" \
  -H "Authorization: Bearer KEY"

# Get inline preview (self-contained HTML)
curl "http://localhost:5001/api/workspace?id=GRAPHIC_ID&version=1&inline=true" \
  -H "Authorization: Bearer KEY"

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
    alias <app-root>/workspaces/;
}
```

---

**Last Updated**: March 6, 2026
**Module Location**: `routes/modules/workspace.js`
**OpenAPI Spec**: `docs/features/workspace-openapi-spec.yaml`
