#!/usr/bin/env node
// Builds all 3 React apps into backend/public so a single Apache vhost
// (the Laravel one) serves API + marketing + admin + student.
//
// Usage:
//   node build-prod.cjs            # build all
//   node build-prod.cjs marketing  # build only marketing
//   node build-prod.cjs admin
//   node build-prod.cjs student

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const BACKEND_PUBLIC = path.resolve(ROOT, 'backend', 'public');

// All apps build with `./` (relative) so the same artifact serves correctly
// from any URL prefix — Hostinger root, local XAMPP at /visuallearn/, or any
// other subfolder. Routing basename is detected at runtime (see main.tsx).
const apps = [
  {
    name: 'marketing',
    dir: 'marketing-react',
    base: './',
    out: BACKEND_PUBLIC, // root
    keep: ['index.php', '.htaccess', 'admin', 'app', 'favicon.ico', 'robots.txt', 'icons', 'logo.png', 'logo-icon.png'],
  },
  {
    name: 'admin',
    dir: 'admin-react',
    base: './',
    out: path.join(BACKEND_PUBLIC, 'admin'),
  },
  {
    name: 'student',
    dir: 'student-react',
    base: './',
    out: path.join(BACKEND_PUBLIC, 'app'),
  },
];

const target = process.argv[2];
const toBuild = target ? apps.filter((a) => a.name === target) : apps;
if (target && toBuild.length === 0) {
  console.error('Unknown app:', target, '— valid: marketing, admin, student');
  process.exit(1);
}

function run(cmd, cwd) {
  console.log(`\n› ${cmd}  (in ${path.relative(ROOT, cwd) || '.'})`);
  execSync(cmd, { cwd, stdio: 'inherit', shell: true });
}

function rmRecursive(p, keep = []) {
  if (!fs.existsSync(p)) return;
  for (const entry of fs.readdirSync(p)) {
    if (keep.includes(entry)) continue;
    const full = path.join(p, entry);
    fs.rmSync(full, { recursive: true, force: true });
  }
}

if (!fs.existsSync(BACKEND_PUBLIC)) {
  fs.mkdirSync(BACKEND_PUBLIC, { recursive: true });
}

for (const app of toBuild) {
  const cwd = path.resolve(ROOT, app.dir);
  if (!fs.existsSync(cwd)) {
    console.warn(`! skipping ${app.name}: ${cwd} not found`);
    continue;
  }

  console.log(`\n=== Building ${app.name} → ${path.relative(ROOT, app.out)} ===`);

  // Make sure deps are installed
  if (!fs.existsSync(path.join(cwd, 'node_modules'))) {
    run('npm install --silent', cwd);
  }

  // Clean target (preserving Laravel files for the marketing build)
  if (app.keep) {
    console.log(`  cleaning ${path.relative(ROOT, app.out)} (keeping ${app.keep.join(', ')})`);
    rmRecursive(app.out, app.keep);
  } else {
    console.log(`  cleaning ${path.relative(ROOT, app.out)}`);
    fs.rmSync(app.out, { recursive: true, force: true });
    fs.mkdirSync(app.out, { recursive: true });
  }

  // Build with explicit base + outDir so we don't trust per-app vite.config defaults
  const outRel = path.relative(cwd, app.out).replace(/\\/g, '/');
  run(
    `npx vite build --mode production --base=${app.base} --outDir=${outRel} --emptyOutDir=false`,
    cwd
  );
}

// Copy /icons folder into backend/public/icons so /icons/icon-512.png resolves
// at the production domain root (the marketing nav, footer, and student PDF
// header reference these directly).
const ICONS_SRC = path.join(ROOT, 'icons');
const ICONS_DEST = path.join(BACKEND_PUBLIC, 'icons');
if (fs.existsSync(ICONS_SRC)) {
  fs.cpSync(ICONS_SRC, ICONS_DEST, { recursive: true });
  console.log(`  copied icons/ → ${path.relative(ROOT, ICONS_DEST)}`);
}

console.log('\n✓ Build complete.');
console.log(`  Output: ${BACKEND_PUBLIC}`);
console.log('\nNext steps:');
console.log('  1. Make sure backend/.env has APP_ENV=production and APP_DEBUG=false');
console.log('  2. cd backend && php artisan config:cache && php artisan route:cache');
console.log('  3. Point Apache vhost DocumentRoot at backend/public');
