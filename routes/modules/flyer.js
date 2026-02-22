/**
 * Flyer Module - AI-assisted flyer generation via Custom GPT
 *
 * Provides endpoints for:
 * - Creating flyers with HTML/CSS
 * - Versioned updates
 * - PNG rendering via Puppeteer
 * - Asset library discovery
 *
 * Storage structure:
 *   /flyers/{flyerId}/v{version}/index.html, styles.css, meta.json
 *   /flyers/assets/{category}/            - shared asset library
 */

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// ====================================================================
// CONFIGURATION
// ====================================================================

const FLYERS_DIR = path.join(__dirname, '../../flyers');
const PUBLIC_URL_BASE = process.env.FLYER_PUBLIC_URL || 'http://localhost:5001/flyers';

// Supported image formats with dimensions (in pixels at 96 DPI)
const IMAGE_FORMATS = {
  letter: { width: 816, height: 1056 },      // 8.5" x 11"
  a4: { width: 794, height: 1123 },          // 210mm x 297mm
  ig_square: { width: 1080, height: 1080 },  // Instagram square
  ig_story: { width: 1080, height: 1920 }    // Instagram story
};

const ASSETS_DIR = path.join(FLYERS_DIR, 'assets');

// ====================================================================
// HTML/CSS SANITIZATION
// ====================================================================

/**
 * Sanitize HTML to prevent script execution and unsafe content
 * Strips <script>, event handlers, javascript: URLs, and other risks
 */
function sanitizeHTML(html) {
  if (!html || typeof html !== 'string') {
    return { isValid: false, error: 'HTML must be a non-empty string' };
  }

  // Check for script tags (case-insensitive)
  if (/<script[\s\S]*?>[\s\S]*?<\/script>/gi.test(html)) {
    return { isValid: false, error: 'Script tags are not allowed' };
  }

  // Check for event handlers (onclick, onerror, onload, etc.)
  if (/\bon\w+\s*=/gi.test(html)) {
    return { isValid: false, error: 'Event handlers (onclick, onerror, etc.) are not allowed' };
  }

  // Check for javascript: URLs
  if (/javascript:/gi.test(html)) {
    return { isValid: false, error: 'JavaScript URLs are not allowed' };
  }

  // Check for data: URLs with scripts
  if (/data:\s*text\/html/gi.test(html)) {
    return { isValid: false, error: 'Data URLs with HTML content are not allowed' };
  }

  // Check for base64 encoded scripts
  if (/data:[^;]*;base64.*<script/gi.test(html)) {
    return { isValid: false, error: 'Base64 encoded scripts are not allowed' };
  }

  // Check for iframe, object, embed tags
  if (/<(iframe|object|embed|applet|form)[\s>]/gi.test(html)) {
    return { isValid: false, error: 'iframe, object, embed, applet, and form tags are not allowed' };
  }

  // Check for meta refresh
  if (/<meta[^>]*http-equiv\s*=\s*["']?refresh/gi.test(html)) {
    return { isValid: false, error: 'Meta refresh is not allowed' };
  }

  return { isValid: true, sanitized: html };
}

/**
 * Sanitize CSS to prevent expression() and other potentially harmful content
 */
function sanitizeCSS(css) {
  if (!css || typeof css !== 'string') {
    return { isValid: true, sanitized: '' }; // CSS is optional
  }

  // Check for CSS expressions (IE-specific but still check)
  if (/expression\s*\(/gi.test(css)) {
    return { isValid: false, error: 'CSS expressions are not allowed' };
  }

  // Check for JavaScript in CSS
  if (/javascript:/gi.test(css)) {
    return { isValid: false, error: 'JavaScript in CSS is not allowed' };
  }

  // Check for @import with external URLs (potential data exfiltration)
  if (/@import\s+url\s*\(\s*["']?https?:/gi.test(css)) {
    return { isValid: false, error: 'External @import URLs are not allowed' };
  }

  // Check for behavior property (IE-specific)
  if (/behavior\s*:/gi.test(css)) {
    return { isValid: false, error: 'CSS behavior property is not allowed' };
  }

  return { isValid: true, sanitized: css };
}

// ====================================================================
// UTILITY FUNCTIONS
// ====================================================================

/**
 * Generate a unique flyer ID
 */
function generateFlyerId() {
  return crypto.randomBytes(8).toString('hex');
}

/**
 * Get the next version number for a flyer
 */
async function getNextVersion(flyerId) {
  const flyerDir = path.join(FLYERS_DIR, flyerId);

  try {
    const entries = await fs.readdir(flyerDir);
    const versions = entries
      .filter(e => e.startsWith('v'))
      .map(e => parseInt(e.substring(1), 10))
      .filter(n => !isNaN(n));

    return versions.length > 0 ? Math.max(...versions) + 1 : 1;
  } catch (error) {
    // Directory doesn't exist yet
    return 1;
  }
}

/**
 * Get the latest version number for a flyer
 */
async function getLatestVersion(flyerId) {
  const flyerDir = path.join(FLYERS_DIR, flyerId);

  try {
    const entries = await fs.readdir(flyerDir);
    const versions = entries
      .filter(e => e.startsWith('v'))
      .map(e => parseInt(e.substring(1), 10))
      .filter(n => !isNaN(n));

    return versions.length > 0 ? Math.max(...versions) : null;
  } catch (error) {
    return null;
  }
}

/**
 * Format version number with leading zeros
 */
function formatVersion(version) {
  return `v${String(version).padStart(3, '0')}`;
}

/**
 * Ensure flyers directory exists
 */
async function ensureDirectoryExists(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
}

// ====================================================================
// API ENDPOINTS
// ====================================================================

/**
 * POST /api/flyers
 * Create a new flyer (initial version)
 *
 * Input:
 *   - html: string (required)
 *   - css: string (optional)
 *   - metadata: object (optional) - event name, format, notes
 *
 * Output:
 *   - flyerId: string
 *   - version: number
 *   - previewUrl: string
 */
router.post('/flyers', async (req, res) => {
  const { html, css, metadata } = req.body;

  // Validate required input
  if (!html) {
    return res.status(400).json({
      error: 'Missing required field',
      message: 'html is required',
      format: { html: 'string', css: 'string (optional)', metadata: 'object (optional)' }
    });
  }

  // Sanitize HTML
  const htmlResult = sanitizeHTML(html);
  if (!htmlResult.isValid) {
    return res.status(400).json({
      error: 'Invalid HTML',
      message: htmlResult.error
    });
  }

  // Sanitize CSS
  const cssResult = sanitizeCSS(css);
  if (!cssResult.isValid) {
    return res.status(400).json({
      error: 'Invalid CSS',
      message: cssResult.error
    });
  }

  try {
    const flyerId = generateFlyerId();
    const version = 1;
    const versionDir = path.join(FLYERS_DIR, flyerId, formatVersion(version));

    // Create directory structure
    await ensureDirectoryExists(versionDir);

    // Prepare meta.json
    const meta = {
      flyerId,
      version,
      timestamp: new Date().toISOString(),
      author: req.authLevel || 'unknown',
      source: 'custom_gpt',
      notes: metadata?.notes || null,
      eventName: metadata?.eventName || null,
      format: metadata?.format || null,
      renderStatus: 'pending'
    };

    // Write files
    await Promise.all([
      fs.writeFile(path.join(versionDir, 'index.html'), html, 'utf8'),
      fs.writeFile(path.join(versionDir, 'styles.css'), css || '', 'utf8'),
      fs.writeFile(path.join(versionDir, 'meta.json'), JSON.stringify(meta, null, 2), 'utf8')
    ]);

    const previewUrl = `${PUBLIC_URL_BASE}/${flyerId}/${formatVersion(version)}/index.html`;

    console.log(`Flyer created: ${flyerId} v${version} by ${req.authLevel} at ${meta.timestamp}`);

    res.status(201).json({
      flyerId,
      version,
      previewUrl,
      message: 'Flyer created successfully'
    });

  } catch (error) {
    console.error('Error creating flyer:', error);
    res.status(500).json({
      error: 'Failed to create flyer',
      message: error.message
    });
  }
});

/**
 * POST /api/flyers/:flyerId/versions
 * Create a new version of an existing flyer
 *
 * Input:
 *   - html: string (required)
 *   - css: string (optional)
 *   - notes: string (optional)
 *
 * Output:
 *   - version: number
 *   - previewUrl: string
 */
router.post('/flyers/:flyerId/versions', async (req, res) => {
  const { flyerId } = req.params;
  const { html, css, notes } = req.body;

  // Validate flyer ID format
  if (!flyerId || !/^[a-f0-9]{16}$/.test(flyerId)) {
    return res.status(400).json({
      error: 'Invalid flyer ID',
      message: 'Flyer ID must be a 16-character hex string'
    });
  }

  // Validate required input
  if (!html) {
    return res.status(400).json({
      error: 'Missing required field',
      message: 'html is required',
      format: { html: 'string', css: 'string (optional)', notes: 'string (optional)' }
    });
  }

  // Check if flyer exists
  const flyerDir = path.join(FLYERS_DIR, flyerId);
  try {
    await fs.access(flyerDir);
  } catch (error) {
    return res.status(404).json({
      error: 'Flyer not found',
      message: `No flyer exists with ID: ${flyerId}`
    });
  }

  // Sanitize HTML
  const htmlResult = sanitizeHTML(html);
  if (!htmlResult.isValid) {
    return res.status(400).json({
      error: 'Invalid HTML',
      message: htmlResult.error
    });
  }

  // Sanitize CSS
  const cssResult = sanitizeCSS(css);
  if (!cssResult.isValid) {
    return res.status(400).json({
      error: 'Invalid CSS',
      message: cssResult.error
    });
  }

  try {
    const version = await getNextVersion(flyerId);
    const versionDir = path.join(flyerDir, formatVersion(version));

    // Create version directory
    await ensureDirectoryExists(versionDir);

    // Prepare meta.json
    const meta = {
      flyerId,
      version,
      timestamp: new Date().toISOString(),
      author: req.authLevel || 'unknown',
      source: 'custom_gpt',
      notes: notes || null,
      renderStatus: 'pending'
    };

    // Write files
    await Promise.all([
      fs.writeFile(path.join(versionDir, 'index.html'), html, 'utf8'),
      fs.writeFile(path.join(versionDir, 'styles.css'), css || '', 'utf8'),
      fs.writeFile(path.join(versionDir, 'meta.json'), JSON.stringify(meta, null, 2), 'utf8')
    ]);

    const previewUrl = `${PUBLIC_URL_BASE}/${flyerId}/${formatVersion(version)}/index.html`;

    console.log(`Flyer updated: ${flyerId} v${version} by ${req.authLevel} at ${meta.timestamp}`);

    res.status(201).json({
      flyerId,
      version,
      previewUrl,
      message: 'New version created successfully'
    });

  } catch (error) {
    console.error('Error creating flyer version:', error);
    res.status(500).json({
      error: 'Failed to create flyer version',
      message: error.message
    });
  }
});

/**
 * POST /api/flyers/:flyerId/render
 * Render a flyer to PNG image
 *
 * Input:
 *   - version: number (optional, defaults to latest)
 *   - format: string (optional, defaults to 'letter')
 *            Valid: 'letter', 'a4', 'ig_square', 'ig_story'
 *
 * Output:
 *   - imageUrl: string
 */
router.post('/flyers/:flyerId/render', async (req, res) => {
  const { flyerId } = req.params;
  let { version, format } = req.body;

  // Validate flyer ID format
  if (!flyerId || !/^[a-f0-9]{16}$/.test(flyerId)) {
    return res.status(400).json({
      error: 'Invalid flyer ID',
      message: 'Flyer ID must be a 16-character hex string'
    });
  }

  // Default format
  format = format || 'letter';
  if (!IMAGE_FORMATS[format]) {
    return res.status(400).json({
      error: 'Invalid format',
      message: `Format must be one of: ${Object.keys(IMAGE_FORMATS).join(', ')}`,
      validFormats: Object.keys(IMAGE_FORMATS)
    });
  }

  // Check if flyer exists
  const flyerDir = path.join(FLYERS_DIR, flyerId);
  try {
    await fs.access(flyerDir);
  } catch (error) {
    return res.status(404).json({
      error: 'Flyer not found',
      message: `No flyer exists with ID: ${flyerId}`
    });
  }

  // Determine version
  if (!version) {
    version = await getLatestVersion(flyerId);
    if (!version) {
      return res.status(404).json({
        error: 'No versions found',
        message: `Flyer ${flyerId} has no versions`
      });
    }
  }

  const versionDir = path.join(flyerDir, formatVersion(version));

  try {
    await fs.access(versionDir);
  } catch (error) {
    return res.status(404).json({
      error: 'Version not found',
      message: `Version ${version} does not exist for flyer ${flyerId}`
    });
  }

  try {
    let puppeteer;
    try {
      puppeteer = require('puppeteer');
    } catch (e) {
      return res.status(503).json({
        error: 'Image rendering unavailable',
        message: 'Puppeteer is not installed. Run: npm install puppeteer'
      });
    }

    // Read HTML and CSS
    const [htmlContent, cssContent] = await Promise.all([
      fs.readFile(path.join(versionDir, 'index.html'), 'utf8'),
      fs.readFile(path.join(versionDir, 'styles.css'), 'utf8').catch(() => '')
    ]);

    // Combine HTML with inline CSS for rendering
    const fullHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>${cssContent}</style>
</head>
<body>
${htmlContent}
</body>
</html>`;

    // Launch browser and render
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const dimensions = IMAGE_FORMATS[format];

    await page.setViewport({
      width: dimensions.width,
      height: dimensions.height,
      deviceScaleFactor: 2
    });

    await page.setContent(fullHTML, { waitUntil: 'networkidle0' });

    // Generate PNG
    const imageFilename = `flyer_${flyerId}_v${version}_${format}.png`;
    const imagePath = path.join(versionDir, imageFilename);

    await page.screenshot({
      path: imagePath,
      type: 'png',
      fullPage: false
    });

    await browser.close();

    // Update meta.json with render status
    const metaPath = path.join(versionDir, 'meta.json');
    try {
      const meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
      meta.renderStatus = 'completed';
      meta.lastRender = {
        timestamp: new Date().toISOString(),
        format,
        filename: imageFilename
      };
      await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf8');
    } catch (e) {
      console.warn('Could not update meta.json:', e.message);
    }

    const imageUrl = `${PUBLIC_URL_BASE}/${flyerId}/${formatVersion(version)}/${imageFilename}`;

    console.log(`Image rendered: ${flyerId} v${version} format=${format} at ${new Date().toISOString()}`);

    res.json({
      flyerId,
      version,
      format,
      imageUrl,
      message: 'Image rendered successfully'
    });

  } catch (error) {
    console.error('Error rendering image:', error);
    res.status(500).json({
      error: 'Failed to render image',
      message: error.message
    });
  }
});

// ====================================================================
// ASSET LIBRARY
// ====================================================================

/**
 * GET /api/flyers/assets
 * List all available assets (logos, backgrounds, templates, etc.)
 *
 * Assets are stored in /flyers/assets/{category}/ and served statically.
 * This endpoint makes them discoverable so the GPT knows what's available.
 *
 * Output:
 *   - assets: object keyed by category, each containing array of { filename, url }
 */
router.get('/flyers/assets', async (req, res) => {
  try {
    await ensureDirectoryExists(ASSETS_DIR);

    const categories = await fs.readdir(ASSETS_DIR);
    const assets = {};

    for (const category of categories) {
      const categoryDir = path.join(ASSETS_DIR, category);
      try {
        const stat = await fs.stat(categoryDir);
        if (!stat.isDirectory()) continue;
      } catch (e) {
        continue;
      }

      const files = await fs.readdir(categoryDir);
      assets[category] = files
        .filter(f => !f.startsWith('.'))
        .map(filename => ({
          filename,
          url: `${PUBLIC_URL_BASE}/assets/${category}/${filename}`
        }));
    }

    res.json({ assets });

  } catch (error) {
    console.error('Error listing assets:', error);
    res.status(500).json({
      error: 'Failed to list assets',
      message: error.message
    });
  }
});

// ====================================================================
// FLYER INFO & LISTING
// ====================================================================

/**
 * GET /api/flyers/:flyerId
 * Get flyer metadata and all versions
 *
 * Output:
 *   - flyerId: string
 *   - versions: array of version info
 *   - latestVersion: number
 *   - latestPreviewUrl: string
 */
router.get('/flyers/:flyerId', async (req, res) => {
  const { flyerId } = req.params;

  // Validate flyer ID format
  if (!flyerId || !/^[a-f0-9]{16}$/.test(flyerId)) {
    return res.status(400).json({
      error: 'Invalid flyer ID',
      message: 'Flyer ID must be a 16-character hex string'
    });
  }

  const flyerDir = path.join(FLYERS_DIR, flyerId);

  try {
    await fs.access(flyerDir);
  } catch (error) {
    return res.status(404).json({
      error: 'Flyer not found',
      message: `No flyer exists with ID: ${flyerId}`
    });
  }

  try {
    const entries = await fs.readdir(flyerDir);
    const versionDirs = entries.filter(e => e.startsWith('v')).sort();

    const versions = [];
    for (const vDir of versionDirs) {
      try {
        const metaPath = path.join(flyerDir, vDir, 'meta.json');
        const meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
        versions.push({
          version: meta.version,
          timestamp: meta.timestamp,
          notes: meta.notes,
          renderStatus: meta.renderStatus,
          previewUrl: `${PUBLIC_URL_BASE}/${flyerId}/${vDir}/index.html`
        });
      } catch (e) {
        // Skip versions with missing/invalid meta
        const vNum = parseInt(vDir.substring(1), 10);
        versions.push({
          version: vNum,
          previewUrl: `${PUBLIC_URL_BASE}/${flyerId}/${vDir}/index.html`
        });
      }
    }

    const latestVersion = versions.length > 0 ? versions[versions.length - 1].version : null;

    res.json({
      flyerId,
      versions,
      latestVersion,
      latestPreviewUrl: latestVersion
        ? `${PUBLIC_URL_BASE}/${flyerId}/${formatVersion(latestVersion)}/index.html`
        : null
    });

  } catch (error) {
    console.error('Error fetching flyer:', error);
    res.status(500).json({
      error: 'Failed to fetch flyer',
      message: error.message
    });
  }
});

/**
 * GET /api/flyers
 * List all flyers (basic info only)
 *
 * Output:
 *   - flyers: array of { flyerId, latestVersion, createdAt }
 */
router.get('/flyers', async (req, res) => {
  try {
    await ensureDirectoryExists(FLYERS_DIR);

    const entries = await fs.readdir(FLYERS_DIR);
    const flyers = [];

    for (const flyerId of entries) {
      // Skip non-directory entries
      const flyerDir = path.join(FLYERS_DIR, flyerId);
      try {
        const stat = await fs.stat(flyerDir);
        if (!stat.isDirectory()) continue;
      } catch (e) {
        continue;
      }

      // Get version info
      try {
        const versionDirs = (await fs.readdir(flyerDir))
          .filter(e => e.startsWith('v'))
          .sort();

        if (versionDirs.length === 0) continue;

        // Get first version meta for creation date
        let createdAt = null;
        try {
          const firstMeta = JSON.parse(
            await fs.readFile(path.join(flyerDir, versionDirs[0], 'meta.json'), 'utf8')
          );
          createdAt = firstMeta.timestamp;
        } catch (e) {}

        const latestVersion = parseInt(versionDirs[versionDirs.length - 1].substring(1), 10);

        flyers.push({
          flyerId,
          latestVersion,
          createdAt,
          previewUrl: `${PUBLIC_URL_BASE}/${flyerId}/${versionDirs[versionDirs.length - 1]}/index.html`
        });
      } catch (e) {
        continue;
      }
    }

    res.json({
      count: flyers.length,
      flyers
    });

  } catch (error) {
    console.error('Error listing flyers:', error);
    res.status(500).json({
      error: 'Failed to list flyers',
      message: error.message
    });
  }
});

module.exports = router;
