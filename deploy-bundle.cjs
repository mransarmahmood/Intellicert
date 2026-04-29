#!/usr/bin/env node
// Builds production bundles AND prepares two upload-ready folders for Hostinger:
//
//   dist/public_html/   →  upload as the contents of public_html/
//   dist/backend-app/   →  upload to a folder ONE LEVEL ABOVE public_html
//                          (e.g. ~/backend-app/ on Hostinger)
//
// Usage:
//   node deploy-bundle.cjs              # build + bundle
//   node deploy-bundle.cjs --skip-build # bundle only (use existing backend/public)
//   node deploy-bundle.cjs --zip        # also produce dist/intellicert-deploy.zip

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const PUBLIC_HTML = path.join(DIST, 'public_html');
const BACKEND_APP = path.join(DIST, 'backend-app');
const BACKEND_SRC = path.join(ROOT, 'backend');
const BACKEND_PUBLIC = path.join(BACKEND_SRC, 'public');

const args = process.argv.slice(2);
const skipBuild = args.includes('--skip-build');
const wantZip = args.includes('--zip');

function log(msg) {
  console.log(msg);
}

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function copyDir(src, dest, skip = []) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (skip.includes(entry.name)) continue;
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d, skip);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

// ─── 1. Build (unless --skip-build) ────────────────────────────────────────
if (!skipBuild) {
  log('\n=== Step 1/4: Building all React apps ===');
  execSync('node build-prod.cjs', { cwd: ROOT, stdio: 'inherit' });
} else {
  log('\n(skipping build, using existing backend/public/)');
}

// ─── 2. Reset dist/ ────────────────────────────────────────────────────────
log('\n=== Step 2/4: Preparing dist/ ===');
rmrf(DIST);
fs.mkdirSync(PUBLIC_HTML, { recursive: true });
fs.mkdirSync(BACKEND_APP, { recursive: true });

// ─── 3. Copy backend/public/* → dist/public_html/ ──────────────────────────
log('=== Step 3/4: Copying public_html (frontend + Laravel entry) ===');
copyDir(BACKEND_PUBLIC, PUBLIC_HTML);

// Patch index.php to point to ../backend-app instead of ..
const indexPhpPath = path.join(PUBLIC_HTML, 'index.php');
if (fs.existsSync(indexPhpPath)) {
  let php = fs.readFileSync(indexPhpPath, 'utf8');
  php = php.replace(
    "$maintenance = __DIR__.'/../storage/framework/maintenance.php'",
    "$maintenance = __DIR__.'/../backend-app/storage/framework/maintenance.php'"
  );
  php = php.replace(
    "require __DIR__.'/../vendor/autoload.php';",
    "require __DIR__.'/../backend-app/vendor/autoload.php';"
  );
  php = php.replace(
    "(require_once __DIR__.'/../bootstrap/app.php')",
    "(require_once __DIR__.'/../backend-app/bootstrap/app.php')"
  );
  fs.writeFileSync(indexPhpPath, php);
  log('  patched index.php paths → ../backend-app/');
}

// ─── 4. Copy backend/* (except public/) → dist/backend-app/ ────────────────
log('=== Step 4/4: Copying backend-app (Laravel) ===');
copyDir(BACKEND_SRC, BACKEND_APP, [
  'public',           // already in public_html
  'node_modules',     // not needed at runtime
  '.env',             // local dev creds — do NOT ship
  '.env.backup',
  'storage',          // copy clean storage skeleton instead (below)
  'tests',            // not needed in prod
  '.phpunit.cache',
  '.phpunit.result.cache',
]);

// Build a clean storage/ skeleton so Laravel can write logs and cache.
// (Hostinger users should `chmod -R 775 storage bootstrap/cache` after upload.)
const STORAGE_SKELETON = [
  'storage/app/public',
  'storage/framework/cache/data',
  'storage/framework/sessions',
  'storage/framework/testing',
  'storage/framework/views',
  'storage/logs',
];
for (const dir of STORAGE_SKELETON) {
  const full = path.join(BACKEND_APP, dir);
  fs.mkdirSync(full, { recursive: true });
  fs.writeFileSync(path.join(full, '.gitkeep'), '');
}

// Drop the production .env template so the user can rename it on the server.
const envExample = path.join(BACKEND_APP, '.env.production.example');
if (fs.existsSync(envExample)) {
  fs.copyFileSync(envExample, path.join(BACKEND_APP, '.env.example'));
}

// Write a README for the user.
fs.writeFileSync(path.join(DIST, 'UPLOAD-INSTRUCTIONS.md'), `# IntelliCert — Hostinger Upload

## What's in this folder

- \`public_html/\`  — upload contents into Hostinger's \`public_html/\`
- \`backend-app/\`  — upload as a folder ONE LEVEL ABOVE \`public_html/\`
                  (so the final path is \`~/backend-app/\`)

The patched \`public_html/index.php\` already points to \`../backend-app/\`.

## Step-by-step (one-time setup)

1. **Hostinger File Manager → public_html/** — DELETE everything currently there.
2. Upload **contents** of \`public_html/\` into \`public_html/\` (drag the files, not the folder).
3. Go up one level. Upload the \`backend-app/\` folder so it sits next to \`public_html/\`.
4. SSH (or Hostinger Terminal):
   \`\`\`bash
   cd ~/backend-app
   composer install --no-dev --optimize-autoloader
   cp .env.example .env
   nano .env                       # set DB_*, APP_URL, GROQ_API_KEY etc.
   php artisan key:generate
   php artisan migrate --force
   php artisan config:cache
   php artisan route:cache
   chmod -R 775 storage bootstrap/cache
   \`\`\`
5. Visit https://www.intellicert.co.uk/ — should load the marketing site.
6. Visit https://www.intellicert.co.uk/api/topics — should return JSON.

## Re-deploying later

Just re-run \`node deploy-bundle.cjs\` locally, then re-upload \`public_html/\`
(\`backend-app/\` only needs re-upload when you change PHP or add packages).
`);

log('\n✓ Bundle ready at: ' + DIST);
log('  • dist/public_html/   → upload to Hostinger public_html/');
log('  • dist/backend-app/   → upload one level above public_html/');
log('  • dist/UPLOAD-INSTRUCTIONS.md');

// ─── Optional: zip ─────────────────────────────────────────────────────────
if (wantZip) {
  log('\n=== Zipping bundle ===');
  const zipPath = path.join(DIST, 'intellicert-deploy.zip');
  rmrf(zipPath);
  // PowerShell Compress-Archive is available on Windows by default.
  const psCmd = `Compress-Archive -Path '${PUBLIC_HTML}','${BACKEND_APP}','${path.join(DIST, 'UPLOAD-INSTRUCTIONS.md')}' -DestinationPath '${zipPath}'`;
  try {
    execSync(`powershell -NoProfile -Command "${psCmd}"`, { stdio: 'inherit' });
    log('  → ' + zipPath);
  } catch (e) {
    log('  ! zip failed (PowerShell not available?). Skipping.');
  }
}

log('');
