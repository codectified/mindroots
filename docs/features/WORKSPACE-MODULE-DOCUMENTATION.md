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
6. Browse available assets (logos, backgrounds, templates, images)
7. Organize work into named project folders
8. Upload image assets directly (base64, magic-byte validated) — no manual `scp` required

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
│   │   ├── templates/
│   │   └── images/
│   └── projects/
│       ├── .index.json              # ID→project lookup map
│       ├── ramadan-2026/
│       │   └── {id}/v001/
│       └── legacy/
├── cicit/                           # CICIT GPT workspace
│   ├── assets/
│   │   ├── logos/
│   │   ├── backgrounds/
│   │   ├── templates/
│   │   └── images/
│   └── projects/
│       └── .index.json
├── mindroots/                       # MindRoots branding GPT workspace
│   ├── assets/
│   │   ├── logos/
│   │   ├── backgrounds/
│   │   ├── templates/
│   │   └── images/
│   └── projects/
│       └── .index.json
```

### Tenant Resolution

Two access patterns:

**Workspace-scoped token** (tenant GPT):
```
Authorization: Bearer ws_<workspaceId>_<randomSecret>
```
The auth middleware parses `workspaceId` from the token prefix, reads the `.token` file, and validates the full token. On success it sets `req.workspace`. No per-tenant env vars needed.

**Admin/main key** (master agent):
```
Authorization: Bearer <admin-or-main-key>
GET/POST /api/workspace?workspace=cicit
```
When an admin or main key is used, the caller must supply `?workspace=<id>` on every request. The middleware resolves the workspace from the query param and checks that a `.token` file exists (workspace must be provisioned — never auto-created). This is the pattern used by the master workspace agent.

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

### List All Workspaces

**GET** `/api/workspaces`

Admin/main key only. Returns all provisioned tenant workspaces with per-category asset counts.

```json
{
  "workspaces": [
    { "id": "aif",      "assets": { "logos": 3, "backgrounds": 0, "templates": 0, "images": 0 }, "total_assets": 3 },
    { "id": "cicit",    "assets": { "logos": 3, "backgrounds": 0, "templates": 0, "images": 2 }, "total_assets": 5 },
    { "id": "mindroots","assets": { "logos": 1, "backgrounds": 0, "templates": 0, "images": 0 }, "total_assets": 1 }
  ]
}
```

Only directories that have a `.token` file are included — prevents listing non-workspace subdirectories. Directories starting with `_` (e.g. `_shared`) are skipped automatically.

---

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

### Upload Image Asset

**POST** `/api/workspace/upload`

Uploads a base64-encoded image directly into the workspace asset library. Designed for agents — eliminates the need for manual `scp` per client.

**Request:**
```json
{
  "category": "logos",
  "filename": "client-logo.png",
  "data": "<base64-encoded image data>"
}
```

`data` may optionally include a data URL prefix (e.g. `data:image/png;base64,...`) — it is stripped automatically.

**Security layers (applied in order):**
| Layer | What it checks |
|-------|---------------|
| Workspace token | Auth middleware — only workspace-authenticated agents can write |
| Category allowlist | Must be one of: `logos`, `backgrounds`, `templates`, `images` |
| Filename sanitization | Path separators stripped; only `[a-zA-Z0-9._-]` allowed |
| Size cap | Decoded file must be ≤ 10MB |
| Magic byte validation | Binary header inspected — not just the filename extension |
| Extension match | File extension must match the detected MIME type |
| Path confinement | Resolved destination must stay inside the workspace assets dir |

**Allowed image types:** JPEG (`.jpg`, `.jpeg`), PNG (`.png`), GIF (`.gif`), WebP (`.webp`)

**Response (201):**
```json
{
  "filename": "client-logo.png",
  "category": "logos",
  "url": "https://theoption.life/workspaces/cicit/assets/logos/client-logo.png",
  "size": 48320,
  "type": "image/png",
  "message": "Asset uploaded successfully"
}
```

If a file with the same filename already exists in the category it is overwritten (intentional — replacing a logo is a valid use case).

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

Project paths and asset filenames are sanitized to prevent directory traversal attacks. Asset uploads additionally enforce a final resolved-path check — the destination must start with the workspace's `assets/` directory.

### Asset Upload Security

Image uploads use magic byte validation: the binary file header is read and compared against known signatures before the file is written. Mismatches between the file's actual content and its declared extension are rejected. SVG is intentionally not supported (it can embed `<script>` tags and event handlers).

The JSON body parser limit was raised to 15MB (`server.js`) to accommodate base64-encoded images — base64 inflation is ~33%, so a 10MB image becomes ~13.3MB in the request body.

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

**Preferred: via API (agents can do this themselves)**

```bash
# Encode a local file and POST it
DATA=$(base64 -i logo.png)
curl -X POST https://theoption.life/api/workspace/upload \
  -H "Authorization: Bearer ws_<tenant>_<secret>" \
  -H "Content-Type: application/json" \
  -d "{\"category\": \"logos\", \"filename\": \"logo.png\", \"data\": \"$DATA\"}"
```

**Fallback: manual `scp`** (use when bootstrapping a workspace before token setup)

```bash
# Upload a logo (see DEPLOYMENT-PRIVATE.md for SSH/SCP details)
scp -i <key-path> logo.png <user>@<host>:<app-root>/workspaces/$TENANT/assets/logos/
```

Assets are immediately available at:
```
https://<domain>/workspaces/<tenant>/assets/logos/logo.png
```

No server restart needed — Express serves them as static files. The GPT sees uploaded assets when it calls `getWorkspace` with `assets=true`.

### Asset Categories

| Directory | Purpose | Examples |
|-----------|---------|----------|
| `logos/` | Organization logos and branding | host-logo.png, org-icon.png |
| `backgrounds/` | Background images for graphics | pattern.png, gradient.jpg |
| `templates/` | Reusable HTML/CSS templates | (future use) |
| `images/` | General images (photos, illustrations) | header-photo.jpg, calligraphy.png |

The `ALLOWED_CATEGORIES` constant in `workspace.js` is the single source of truth — both the upload endpoint and the browse endpoint use it. Add a new category there if needed.

### Shared Assets

Assets in `workspaces/_shared/` are available to all tenants. These **are** tracked in git.

- `_shared/icons/` — 19 SVG icons (calendar, location, mosque, etc.)
- `_shared/fonts/` — Arabic web fonts in woff2 format (Amiri, Noto Naskh Arabic, IBM Plex Sans Arabic, Scheherazade New — regular + bold)

### Current Tenant Assets

**AIF** (`workspaces/aif/assets/`):
- `logos/host-logo.jpg` — AIF organization logo
- `logos/Deif.jpeg` — Imam photo

**CICIT** (`workspaces/cicit/assets/`):
- `logos/logo.png`, `logos/logo_front.png`, `logos/smalllogo.jpeg` — CICIT branding
- `images/` — processed event/promo images

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

# Upload an image asset (base64-encode a local file first)
DATA=$(base64 -i /path/to/logo.png)
curl -X POST http://localhost:5001/api/workspace/upload \
  -H "Authorization: Bearer KEY" -H "Content-Type: application/json" \
  -d "{\"category\": \"logos\", \"filename\": \"logo.png\", \"data\": \"$DATA\"}"
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
    expires 1h;
    add_header Cache-Control "public";
    add_header Access-Control-Allow-Origin *;
}
```

The `Access-Control-Allow-Origin *` header is required for cross-origin font loading — specifically for Claude Artifacts (and any other iframe/browser context on a different origin). Without it, browsers silently refuse to load the fonts and fall back to a generic serif.

Note: this does **not** affect Puppeteer rendering (which uses base64 data URIs due to `about:blank` origin restrictions) or the Custom GPT backend (same-origin). It only unlocks third-party browser contexts like Claude Artifacts.

---

**Last Updated**: May 2026
**Module Location**: `routes/modules/workspace.js`
**OpenAPI Specs**:
- `docs/features/openapi-specs/workspace-openapi-spec.yaml` — tenant agent (ws_* token)
- `docs/features/openapi-specs/master-workspace-openapi-spec.yaml` — master agent (admin/main key)
