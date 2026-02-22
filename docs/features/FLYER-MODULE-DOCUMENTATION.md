# Flyer Module Documentation

**Purpose**: AI-assisted flyer generation via Custom GPT with versioned storage, PNG rendering, and asset library.

**Status**: ✅ Production-ready

---

## Overview

The Flyer Module enables a Custom GPT to:
1. Submit HTML/CSS flyer designs
2. Receive versioned storage with preview URLs
3. Request PNG rendering in multiple formats
4. Browse available assets (logos, backgrounds, templates)

This module operates independently of the MindRoots graph database and linguistic features.

---

## Architecture

### Storage Structure

```
flyers/
├── assets/                              # Shared asset library
│   ├── logos/
│   ├── backgrounds/
│   └── templates/
├── {flyerId}/
│   ├── v001/
│   │   ├── index.html                   # Flyer HTML content
│   │   ├── styles.css                   # Flyer CSS styles
│   │   └── meta.json                    # Version metadata
│   ├── v002/
│   │   ├── index.html
│   │   ├── styles.css
│   │   ├── meta.json
│   │   └── flyer_{id}_v2_letter.png     # Rendered PNG
│   └── ...
```

### meta.json Format

```json
{
  "flyerId": "a1b2c3d4e5f6g7h8",
  "version": 1,
  "timestamp": "2025-01-29T12:00:00.000Z",
  "author": "flyer",
  "source": "custom_gpt",
  "notes": "Initial design",
  "eventName": "Community Iftar",
  "format": "letter",
  "renderStatus": "completed",
  "lastRender": {
    "timestamp": "2025-01-29T12:05:00.000Z",
    "format": "letter",
    "filename": "flyer_a1b2c3d4e5f6g7h8_v1_letter.png"
  }
}
```

---

## API Endpoints

### Create Flyer

**POST** `/api/flyers`

Creates a new flyer with initial version (v001).

**Request:**
```json
{
  "html": "<div class='flyer'>...</div>",
  "css": ".flyer { background: #fff; }",
  "metadata": {
    "eventName": "Community Iftar",
    "format": "letter",
    "notes": "Initial design"
  }
}
```

**Response (201):**
```json
{
  "flyerId": "a1b2c3d4e5f6g7h8",
  "version": 1,
  "previewUrl": "http://localhost:5001/flyers/a1b2c3d4e5f6g7h8/v001/index.html",
  "message": "Flyer created successfully"
}
```

---

### Update Flyer (New Version)

**POST** `/api/flyers/{flyerId}/versions`

Creates a new version of an existing flyer.

**Request:**
```json
{
  "html": "<div class='flyer'>...</div>",
  "css": ".flyer { background: #f0f0f0; }",
  "notes": "Updated color scheme"
}
```

**Response (201):**
```json
{
  "flyerId": "a1b2c3d4e5f6g7h8",
  "version": 2,
  "previewUrl": "http://localhost:5001/flyers/a1b2c3d4e5f6g7h8/v002/index.html",
  "message": "New version created successfully"
}
```

---

### Render Image

**POST** `/api/flyers/{flyerId}/render`

Renders the flyer HTML/CSS to a high-resolution PNG image using Puppeteer.

**Request:**
```json
{
  "version": 2,
  "format": "letter"
}
```

**Supported Formats:**
| Format | Dimensions | Use Case |
|--------|-----------|----------|
| `letter` | 8.5" × 11" (816×1056px) | US standard print |
| `a4` | 210mm × 297mm (794×1123px) | International print |
| `ig_square` | 1080×1080px | Instagram post |
| `ig_story` | 1080×1920px | Instagram story |

**Response:**
```json
{
  "flyerId": "a1b2c3d4e5f6g7h8",
  "version": 2,
  "format": "letter",
  "imageUrl": "http://localhost:5001/flyers/a1b2c3d4e5f6g7h8/v002/flyer_a1b2c3d4e5f6g7h8_v2_letter.png",
  "message": "Image rendered successfully"
}
```

---

### Get Flyer Info

**GET** `/api/flyers/{flyerId}`

Returns flyer metadata and all versions.

**Response:**
```json
{
  "flyerId": "a1b2c3d4e5f6g7h8",
  "versions": [
    {
      "version": 1,
      "timestamp": "2025-01-29T12:00:00.000Z",
      "notes": "Initial design",
      "renderStatus": "completed",
      "previewUrl": "http://localhost:5001/flyers/a1b2c3d4e5f6g7h8/v001/index.html"
    },
    {
      "version": 2,
      "timestamp": "2025-01-29T14:00:00.000Z",
      "notes": "Updated color scheme",
      "renderStatus": "pending",
      "previewUrl": "http://localhost:5001/flyers/a1b2c3d4e5f6g7h8/v002/index.html"
    }
  ],
  "latestVersion": 2,
  "latestPreviewUrl": "http://localhost:5001/flyers/a1b2c3d4e5f6g7h8/v002/index.html"
}
```

---

### List All Flyers

**GET** `/api/flyers`

Returns summary of all flyers.

**Response:**
```json
{
  "count": 3,
  "flyers": [
    {
      "flyerId": "a1b2c3d4e5f6g7h8",
      "latestVersion": 2,
      "createdAt": "2025-01-29T12:00:00.000Z",
      "previewUrl": "http://localhost:5001/flyers/a1b2c3d4e5f6g7h8/v002/index.html"
    }
  ]
}
```

---

### List Assets

**GET** `/api/flyers/assets`

Lists all available assets (logos, backgrounds, templates) organized by category. Assets are files stored in `flyers/assets/{category}/` and served statically. This endpoint makes them discoverable.

**Response:**
```json
{
  "assets": {
    "logos": [
      { "filename": "mosque-logo.png", "url": "http://localhost:5001/flyers/assets/logos/mosque-logo.png" }
    ],
    "backgrounds": [
      { "filename": "geometric-pattern.png", "url": "http://localhost:5001/flyers/assets/backgrounds/geometric-pattern.png" }
    ]
  }
}
```

To add assets, place files in `flyers/assets/{category}/` on the server.

---

## Security

### HTML Sanitization

The following are **blocked**:
- `<script>` tags
- Event handlers (`onclick`, `onerror`, etc.)
- `javascript:` URLs
- `data:text/html` URLs
- `<iframe>`, `<object>`, `<embed>`, `<applet>`, `<form>` tags
- Meta refresh redirects

### CSS Sanitization

The following are **blocked**:
- CSS `expression()` (IE)
- `javascript:` in CSS
- External `@import` URLs
- `behavior:` property (IE)

### API Key Scoping

Add to `.env`:
```
FLYER_API_KEY=your-secure-flyer-key-here
```

This key provides access only to flyer endpoints. The auth level is set to `flyer` for tracking.

---

## Dependencies

### Required
- `express` (existing)
- `fs` (Node built-in)
- `path` (Node built-in)
- `crypto` (Node built-in)

### Optional (for image rendering)
- `puppeteer` - Install with: `npm install puppeteer`

If Puppeteer is not installed, the `/render` endpoint returns a 503 error with installation instructions.

---

## Environment Configuration

Add to `.env`:
```bash
# Optional: Public URL base for flyer previews (defaults to localhost)
FLYER_PUBLIC_URL=https://your-domain.com/flyers

# Optional: Scoped API key for Custom GPT
FLYER_API_KEY=your-secure-key
```

---

## Custom GPT Integration

### OpenAPI Spec Location

See: `docs/features/flyer-openapi-spec.yaml`

### Setup Steps

1. Create Custom GPT in ChatGPT
2. Add OpenAPI spec as an Action
3. Configure authentication with API key
4. Set the server URL to your production endpoint

### Example GPT System Prompt

```
You are a professional flyer designer. When the user describes their event:

1. Generate clean, semantic HTML and CSS for the flyer
2. Call the create_flyer action with the HTML/CSS
3. Share the preview URL with the user
4. Ask for feedback and iterate using create_version
5. When approved, call render_image to generate a high-res PNG
6. Use the PNG as a base for image enhancement with your built-in image generation
7. Browse available assets with list_assets for logos and templates to incorporate
```

---

## Testing

### Create a Test Flyer

```bash
curl -X POST http://localhost:5001/api/flyers \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<div style=\"padding: 40px; text-align: center;\"><h1>Test Event</h1><p>Date: January 29, 2025</p></div>",
    "css": "body { font-family: Arial; background: #f5f5f5; }",
    "metadata": { "eventName": "Test Event", "notes": "Testing" }
  }'
```

### Render Image

```bash
curl -X POST http://localhost:5001/api/flyers/{flyerId}/render \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"format": "ig_square"}'
```

### List Assets

```bash
curl http://localhost:5001/api/flyers/assets \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

## Future Considerations (Not Implemented)

Design allows for future expansion:
- **Template system**: JSON-to-HTML rendering
- **Image upload endpoint**: Accept base64 images for storage via API
- **Client namespaces**: Multi-tenant isolation
- **Compositing**: Layer AI-generated backgrounds under code-rendered text
- **Task delegation**: Background job queue for rendering

---

**Last Updated**: February 13, 2026
**Module Location**: `routes/modules/flyer.js`
