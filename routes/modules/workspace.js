/**
 * Workspace Module - Creative workspace for Custom GPT graphical media
 *
 * Provides 4 endpoints:
 * - GET  /workspace          - Browse assets and projects
 * - POST /workspace/create   - Create new graphic or new version
 * - POST /workspace/render   - Render graphic to PNG
 * - POST /workspace/organize - Create project folders
 *
 * Storage structure:
 *   /assets/{category}/                    - shared raw materials
 *   /projects/{project}/{id}/v{NNN}/       - versioned graphics
 *   /projects/.index.json                  - ID→project lookup
 */

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// ====================================================================
// CONFIGURATION
// ====================================================================

const PROJECTS_DIR = path.join(__dirname, '../../projects');
const ASSETS_DIR = path.join(__dirname, '../../assets');
const PROJECTS_URL_BASE = process.env.PROJECTS_PUBLIC_URL || 'http://localhost:5001/projects';
const ASSETS_URL_BASE = process.env.ASSETS_PUBLIC_URL || 'http://localhost:5001/assets';
const INDEX_PATH = path.join(PROJECTS_DIR, '.index.json');

const IMAGE_FORMATS = {
  letter: { width: 816, height: 1056 },
  a4: { width: 794, height: 1123 },
  ig_square: { width: 1080, height: 1080 },
  ig_story: { width: 1080, height: 1920 }
};

// ====================================================================
// HTML/CSS SANITIZATION
// ====================================================================

function sanitizeHTML(html) {
  if (!html || typeof html !== 'string') {
    return { isValid: false, error: 'HTML must be a non-empty string' };
  }
  if (/<script[\s\S]*?>[\s\S]*?<\/script>/gi.test(html)) {
    return { isValid: false, error: 'Script tags are not allowed' };
  }
  if (/\bon\w+\s*=/gi.test(html)) {
    return { isValid: false, error: 'Event handlers (onclick, onerror, etc.) are not allowed' };
  }
  if (/javascript:/gi.test(html)) {
    return { isValid: false, error: 'JavaScript URLs are not allowed' };
  }
  if (/data:\s*text\/html/gi.test(html)) {
    return { isValid: false, error: 'Data URLs with HTML content are not allowed' };
  }
  if (/data:[^;]*;base64.*<script/gi.test(html)) {
    return { isValid: false, error: 'Base64 encoded scripts are not allowed' };
  }
  if (/<(iframe|object|embed|applet|form)[\s>]/gi.test(html)) {
    return { isValid: false, error: 'iframe, object, embed, applet, and form tags are not allowed' };
  }
  if (/<meta[^>]*http-equiv\s*=\s*["']?refresh/gi.test(html)) {
    return { isValid: false, error: 'Meta refresh is not allowed' };
  }
  return { isValid: true, sanitized: html };
}

function sanitizeCSS(css) {
  if (!css || typeof css !== 'string') {
    return { isValid: true, sanitized: '' };
  }
  if (/expression\s*\(/gi.test(css)) {
    return { isValid: false, error: 'CSS expressions are not allowed' };
  }
  if (/javascript:/gi.test(css)) {
    return { isValid: false, error: 'JavaScript in CSS is not allowed' };
  }
  if (/@import\s+url\s*\(\s*["']?https?:/gi.test(css)) {
    return { isValid: false, error: 'External @import URLs are not allowed' };
  }
  if (/behavior\s*:/gi.test(css)) {
    return { isValid: false, error: 'CSS behavior property is not allowed' };
  }
  return { isValid: true, sanitized: css };
}

// ====================================================================
// UTILITY FUNCTIONS
// ====================================================================

function generateId() {
  return crypto.randomBytes(8).toString('hex');
}

function formatVersion(version) {
  return `v${String(version).padStart(3, '0')}`;
}

async function ensureDirectoryExists(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
}

async function readIndex() {
  try {
    const data = await fs.readFile(INDEX_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

async function writeIndex(index) {
  await ensureDirectoryExists(PROJECTS_DIR);
  await fs.writeFile(INDEX_PATH, JSON.stringify(index, null, 2), 'utf8');
}

/**
 * Sanitize and validate a project path.
 * Rejects traversal attempts and invalid characters.
 */
function sanitizePath(input) {
  if (!input || typeof input !== 'string') {
    return { isValid: false, error: 'Project path must be a non-empty string' };
  }

  // Strip leading slash
  let cleaned = input.replace(/^\/+/, '');

  // Normalize
  cleaned = path.normalize(cleaned);

  // Reject traversal
  if (cleaned.includes('..')) {
    return { isValid: false, error: 'Path traversal (..) is not allowed' };
  }

  // Allow only safe characters
  if (!/^[a-zA-Z0-9_\-\/]+$/.test(cleaned)) {
    return { isValid: false, error: 'Path contains invalid characters. Allowed: letters, numbers, hyphens, underscores, forward slashes' };
  }

  // Reject empty segments (double slashes after normalize shouldn't exist, but check)
  if (/\/\//.test(cleaned) || cleaned === '') {
    return { isValid: false, error: 'Path contains empty segments' };
  }

  return { isValid: true, sanitized: cleaned };
}

async function getNextVersion(graphicDir) {
  try {
    const entries = await fs.readdir(graphicDir);
    const versions = entries
      .filter(e => e.startsWith('v'))
      .map(e => parseInt(e.substring(1), 10))
      .filter(n => !isNaN(n));
    return versions.length > 0 ? Math.max(...versions) + 1 : 1;
  } catch (error) {
    return 1;
  }
}

async function getLatestVersion(graphicDir) {
  try {
    const entries = await fs.readdir(graphicDir);
    const versions = entries
      .filter(e => e.startsWith('v'))
      .map(e => parseInt(e.substring(1), 10))
      .filter(n => !isNaN(n));
    return versions.length > 0 ? Math.max(...versions) : null;
  } catch (error) {
    return null;
  }
}

// ====================================================================
// GET /workspace - Browse assets and projects
// ====================================================================

router.get('/workspace', async (req, res) => {
  const { assets: assetsParam, project, id, includeVersions, maxVersions } = req.query;

  try {
    const response = {};

    // --- Assets ---
    if (assetsParam === 'true') {
      // Full asset listings with URLs
      const assetData = {};
      const categories = ['logos', 'backgrounds', 'templates'];
      for (const category of categories) {
        const categoryDir = path.join(ASSETS_DIR, category);
        try {
          const files = await fs.readdir(categoryDir);
          assetData[category] = files
            .filter(f => !f.startsWith('.'))
            .map(filename => ({
              filename,
              url: `${ASSETS_URL_BASE}/${category}/${filename}`
            }));
        } catch (e) {
          assetData[category] = [];
        }
      }
      response.assets = assetData;
    } else {
      // Counts only
      const assetCounts = {};
      const categories = ['logos', 'backgrounds', 'templates'];
      for (const category of categories) {
        const categoryDir = path.join(ASSETS_DIR, category);
        try {
          const files = await fs.readdir(categoryDir);
          assetCounts[category] = files.filter(f => !f.startsWith('.')).length;
        } catch (e) {
          assetCounts[category] = 0;
        }
      }
      response.assets = assetCounts;
    }

    // --- Single graphic by ID ---
    if (id) {
      const index = await readIndex();
      const projectName = index[id];
      if (!projectName) {
        return res.status(404).json({ error: 'Graphic not found', message: `No graphic with ID: ${id}` });
      }

      const graphicDir = path.join(PROJECTS_DIR, projectName, id);
      const latestVer = await getLatestVersion(graphicDir);
      if (!latestVer) {
        return res.status(404).json({ error: 'No versions found', message: `Graphic ${id} has no versions` });
      }

      const graphic = { id, project: projectName, latestVersion: latestVer };

      // Always include versions for single-graphic lookup
      graphic.versions = [];
      const entries = await fs.readdir(graphicDir);
      const versionDirs = entries.filter(e => e.startsWith('v')).sort();
      for (const vDir of versionDirs) {
        try {
          const metaPath = path.join(graphicDir, vDir, 'meta.json');
          const meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
          const versionInfo = {
            version: meta.version,
            timestamp: meta.timestamp,
            notes: meta.notes || null,
            renderStatus: meta.renderStatus || 'pending',
            previewUrl: `${PROJECTS_URL_BASE}/${projectName}/${id}/${vDir}/index.html`
          };
          if (meta.renders) {
            versionInfo.renders = {};
            for (const [fmt, renderInfo] of Object.entries(meta.renders)) {
              versionInfo.renders[fmt] = `${PROJECTS_URL_BASE}/${projectName}/${id}/${vDir}/${renderInfo.filename}`;
            }
          }
          graphic.versions.push(versionInfo);
        } catch (e) {
          const vNum = parseInt(vDir.substring(1), 10);
          graphic.versions.push({
            version: vNum,
            previewUrl: `${PROJECTS_URL_BASE}/${projectName}/${id}/${vDir}/index.html`
          });
        }
      }

      response.graphic = graphic;
      return res.json(response);
    }

    // --- Projects ---
    if (project) {
      // Full detail for one project
      const pathResult = sanitizePath(project);
      if (!pathResult.isValid) {
        return res.status(400).json({ error: 'Invalid project path', message: pathResult.error });
      }
      const projectDir = path.join(PROJECTS_DIR, pathResult.sanitized);
      try {
        await fs.access(projectDir);
      } catch (e) {
        return res.status(404).json({ error: 'Project not found', message: `No project: ${pathResult.sanitized}` });
      }

      const index = await readIndex();
      const graphics = [];
      const entries = await fs.readdir(projectDir);

      for (const entry of entries) {
        const entryPath = path.join(projectDir, entry);
        const stat = await fs.stat(entryPath);
        if (!stat.isDirectory()) continue;

        // Check if this is a graphic ID directory (has version subdirs)
        const subEntries = await fs.readdir(entryPath);
        const hasVersions = subEntries.some(e => e.startsWith('v'));
        if (!hasVersions) continue;

        const graphicId = entry;
        const latestVer = await getLatestVersion(entryPath);
        const graphicInfo = { id: graphicId, project: pathResult.sanitized, latestVersion: latestVer };

        if (includeVersions === 'true') {
          graphicInfo.versions = [];
          const versionDirs = subEntries.filter(e => e.startsWith('v')).sort();
          const maxV = maxVersions ? parseInt(maxVersions, 10) : versionDirs.length;
          const dirsToShow = versionDirs.slice(-maxV);

          for (const vDir of dirsToShow) {
            try {
              const metaPath = path.join(entryPath, vDir, 'meta.json');
              const meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
              const versionInfo = {
                version: meta.version,
                timestamp: meta.timestamp,
                notes: meta.notes || null,
                renderStatus: meta.renderStatus || 'pending',
                previewUrl: `${PROJECTS_URL_BASE}/${pathResult.sanitized}/${graphicId}/${vDir}/index.html`
              };
              if (meta.renders) {
                versionInfo.renders = {};
                for (const [fmt, renderInfo] of Object.entries(meta.renders)) {
                  versionInfo.renders[fmt] = `${PROJECTS_URL_BASE}/${pathResult.sanitized}/${graphicId}/${vDir}/${renderInfo.filename}`;
                }
              }
              graphicInfo.versions.push(versionInfo);
            } catch (e) {
              const vNum = parseInt(vDir.substring(1), 10);
              graphicInfo.versions.push({
                version: vNum,
                previewUrl: `${PROJECTS_URL_BASE}/${pathResult.sanitized}/${graphicId}/${vDir}/index.html`
              });
            }
          }
        }

        graphics.push(graphicInfo);
      }

      response.projects = { [pathResult.sanitized]: { graphics } };
    } else {
      // Lightweight: project names with graphic counts
      const projectData = {};
      await ensureDirectoryExists(PROJECTS_DIR);
      const topEntries = await fs.readdir(PROJECTS_DIR);

      for (const entry of topEntries) {
        if (entry.startsWith('.')) continue;
        const entryPath = path.join(PROJECTS_DIR, entry);
        const stat = await fs.stat(entryPath);
        if (!stat.isDirectory()) continue;

        // Count graphics in this project (recursively find dirs with version subdirs)
        const count = await countGraphics(entryPath);
        if (count > 0) {
          projectData[entry] = { count };
        }
      }

      response.projects = projectData;
    }

    res.json(response);
  } catch (error) {
    console.error('Error in GET /workspace:', error);
    res.status(500).json({ error: 'Failed to fetch workspace data', message: error.message });
  }
});

/**
 * Count graphics (directories containing version subdirs) within a project directory
 */
async function countGraphics(dir) {
  let count = 0;
  try {
    const entries = await fs.readdir(dir);
    for (const entry of entries) {
      if (entry.startsWith('.')) continue;
      const entryPath = path.join(dir, entry);
      const stat = await fs.stat(entryPath);
      if (!stat.isDirectory()) continue;

      const subEntries = await fs.readdir(entryPath);
      if (subEntries.some(e => e.startsWith('v'))) {
        count++;
      }
    }
  } catch (e) {}
  return count;
}

// ====================================================================
// POST /workspace/create - Create new graphic or new version
// ====================================================================

router.post('/workspace/create', async (req, res) => {
  const { id, project, html, css, metadata, notes } = req.body;

  // Validate HTML
  if (!html) {
    return res.status(400).json({
      error: 'Missing required field',
      message: 'html is required'
    });
  }

  const htmlResult = sanitizeHTML(html);
  if (!htmlResult.isValid) {
    return res.status(400).json({ error: 'Invalid HTML', message: htmlResult.error });
  }

  const cssResult = sanitizeCSS(css);
  if (!cssResult.isValid) {
    return res.status(400).json({ error: 'Invalid CSS', message: cssResult.error });
  }

  try {
    const index = await readIndex();
    let graphicId, projectName, version;

    if (id) {
      // New version of existing graphic
      graphicId = id;
      projectName = index[graphicId];
      if (!projectName) {
        return res.status(404).json({
          error: 'Graphic not found',
          message: `No graphic with ID: ${graphicId}. To create a new graphic, provide "project" instead of "id".`
        });
      }

      const graphicDir = path.join(PROJECTS_DIR, projectName, graphicId);
      version = await getNextVersion(graphicDir);

      // Concurrency-safe version directory creation
      const versionDir = await createVersionDir(graphicDir, version);
      version = parseInt(path.basename(versionDir).substring(1), 10);

      await writeVersionFiles(versionDir, {
        id: graphicId,
        project: projectName,
        version,
        html,
        css,
        notes: notes || metadata?.notes || null,
        author: req.authLevel || 'unknown'
      });

      const previewUrl = `${PROJECTS_URL_BASE}/${projectName}/${graphicId}/${formatVersion(version)}/index.html`;
      console.log(`Graphic updated: ${graphicId} v${version} in ${projectName}`);

      return res.status(201).json({
        id: graphicId,
        project: projectName,
        version,
        previewUrl,
        message: `Version ${version} created successfully`
      });

    } else {
      // New graphic — project required
      if (!project) {
        return res.status(400).json({
          error: 'Missing required field',
          message: 'Either "id" (for new version) or "project" (for new graphic) is required'
        });
      }

      const pathResult = sanitizePath(project);
      if (!pathResult.isValid) {
        return res.status(400).json({ error: 'Invalid project path', message: pathResult.error });
      }
      projectName = pathResult.sanitized;

      graphicId = generateId();

      // Ensure unique ID
      if (index[graphicId]) {
        graphicId = generateId();
      }

      version = 1;
      const graphicDir = path.join(PROJECTS_DIR, projectName, graphicId);
      const versionDir = path.join(graphicDir, formatVersion(version));
      await ensureDirectoryExists(versionDir);

      await writeVersionFiles(versionDir, {
        id: graphicId,
        project: projectName,
        version,
        html,
        css,
        notes: metadata?.notes || notes || null,
        author: req.authLevel || 'unknown'
      });

      // Update index
      index[graphicId] = projectName;
      await writeIndex(index);

      const previewUrl = `${PROJECTS_URL_BASE}/${projectName}/${graphicId}/${formatVersion(version)}/index.html`;
      console.log(`Graphic created: ${graphicId} v${version} in ${projectName}`);

      return res.status(201).json({
        id: graphicId,
        project: projectName,
        version,
        previewUrl,
        message: 'Graphic created successfully'
      });
    }
  } catch (error) {
    console.error('Error in POST /workspace/create:', error);
    res.status(500).json({ error: 'Failed to create graphic', message: error.message });
  }
});

/**
 * Create version directory with concurrency protection.
 * Uses recursive: false to detect collisions, retries up to 3 times.
 */
async function createVersionDir(graphicDir, startVersion) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const version = startVersion + attempt;
    const versionDir = path.join(graphicDir, formatVersion(version));
    try {
      await fs.mkdir(versionDir, { recursive: false });
      return versionDir;
    } catch (error) {
      if (error.code === 'EEXIST') continue;
      // Parent doesn't exist — create it and retry same version
      if (error.code === 'ENOENT') {
        await ensureDirectoryExists(graphicDir);
        try {
          await fs.mkdir(versionDir, { recursive: false });
          return versionDir;
        } catch (retryError) {
          if (retryError.code === 'EEXIST') continue;
          throw retryError;
        }
      }
      throw error;
    }
  }
  throw new Error('Failed to create version directory after 3 attempts — too many concurrent writes');
}

/**
 * Write index.html, styles.css, and meta.json for a version
 */
async function writeVersionFiles(versionDir, { id, project, version, html, css, notes, author }) {
  const meta = {
    id,
    project,
    version,
    timestamp: new Date().toISOString(),
    author: author || 'unknown',
    source: 'custom_gpt',
    notes: notes || null,
    renderStatus: 'pending',
    renders: {}
  };

  await Promise.all([
    fs.writeFile(path.join(versionDir, 'index.html'), html, 'utf8'),
    fs.writeFile(path.join(versionDir, 'styles.css'), css || '', 'utf8'),
    fs.writeFile(path.join(versionDir, 'meta.json'), JSON.stringify(meta, null, 2), 'utf8')
  ]);
}

// ====================================================================
// POST /workspace/render - Render graphic to PNG
// ====================================================================

router.post('/workspace/render', async (req, res) => {
  let { id, format, version } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Missing required field', message: 'id is required' });
  }

  format = format || 'letter';
  if (!IMAGE_FORMATS[format]) {
    return res.status(400).json({
      error: 'Invalid format',
      message: `Format must be one of: ${Object.keys(IMAGE_FORMATS).join(', ')}`,
      validFormats: Object.keys(IMAGE_FORMATS)
    });
  }

  const index = await readIndex();
  const projectName = index[id];
  if (!projectName) {
    return res.status(404).json({ error: 'Graphic not found', message: `No graphic with ID: ${id}` });
  }

  const graphicDir = path.join(PROJECTS_DIR, projectName, id);

  if (!version) {
    version = await getLatestVersion(graphicDir);
    if (!version) {
      return res.status(404).json({ error: 'No versions found', message: `Graphic ${id} has no versions` });
    }
  }

  const versionDir = path.join(graphicDir, formatVersion(version));
  try {
    await fs.access(versionDir);
  } catch (error) {
    return res.status(404).json({
      error: 'Version not found',
      message: `Version ${version} does not exist for graphic ${id}`
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

    const [htmlContent, cssContent] = await Promise.all([
      fs.readFile(path.join(versionDir, 'index.html'), 'utf8'),
      fs.readFile(path.join(versionDir, 'styles.css'), 'utf8').catch(() => '')
    ]);

    const fullHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>${cssContent}</style>
</head>
<body>
${htmlContent}
</body>
</html>`;

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

    const imageFilename = `graphic_${id}_v${version}_${format}.png`;
    const imagePath = path.join(versionDir, imageFilename);

    await page.screenshot({
      path: imagePath,
      type: 'png',
      fullPage: false
    });

    await browser.close();

    // Update meta.json with render info in renders map
    const metaPath = path.join(versionDir, 'meta.json');
    try {
      const meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
      meta.renderStatus = 'completed';
      if (!meta.renders) meta.renders = {};
      meta.renders[format] = {
        timestamp: new Date().toISOString(),
        filename: imageFilename
      };
      await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf8');
    } catch (e) {
      console.warn('Could not update meta.json:', e.message);
    }

    const imageUrl = `${PROJECTS_URL_BASE}/${projectName}/${id}/${formatVersion(version)}/${imageFilename}`;

    console.log(`Image rendered: ${id} v${version} format=${format}`);

    res.json({
      id,
      project: projectName,
      version,
      format,
      imageUrl,
      message: 'Image rendered successfully'
    });

  } catch (error) {
    console.error('Error rendering image:', error);
    res.status(500).json({ error: 'Failed to render image', message: error.message });
  }
});

// ====================================================================
// POST /workspace/organize - Create project folders
// ====================================================================

router.post('/workspace/organize', async (req, res) => {
  const { project } = req.body;

  if (!project) {
    return res.status(400).json({
      error: 'Missing required field',
      message: 'project is required (e.g. "ramadan-2026" or "ramadan-2026/social-media")'
    });
  }

  const pathResult = sanitizePath(project);
  if (!pathResult.isValid) {
    return res.status(400).json({ error: 'Invalid project path', message: pathResult.error });
  }

  try {
    const projectDir = path.join(PROJECTS_DIR, pathResult.sanitized);
    await ensureDirectoryExists(projectDir);

    console.log(`Project folder created: ${pathResult.sanitized}`);

    res.status(201).json({
      project: pathResult.sanitized,
      message: `Project folder "${pathResult.sanitized}" created successfully`
    });
  } catch (error) {
    console.error('Error creating project folder:', error);
    res.status(500).json({ error: 'Failed to create project folder', message: error.message });
  }
});

module.exports = router;
