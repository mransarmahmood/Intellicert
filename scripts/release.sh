#!/usr/bin/env bash
# scripts/release.sh — one-shot deploy to the production branch.
#
# Builds fresh artifacts and replaces the contents of the production branch
# with them, then pushes. Hostinger auto-pulls (if Auto-deploy is enabled
# in hPanel → Git) within ~30 seconds.
#
# Run from the repo root on the `main` branch with a clean working tree:
#
#   bash scripts/release.sh "Short description of what changed"
#
# Requires: node, npm, composer, git, and the working tree on main.
set -euo pipefail

MSG="${1:-Deploy update}"

if [ "$(git rev-parse --abbrev-ref HEAD)" != "main" ]; then
  echo "✗ Must run from the main branch."
  exit 1
fi
if ! git diff-index --quiet HEAD --; then
  echo "✗ Working tree is dirty. Commit or stash first."
  exit 1
fi

echo "→ 1/5 Building fresh production bundle…"
node deploy-bundle.cjs

echo "→ 2/5 Switching to production branch…"
git checkout production

echo "→ 3/5 Replacing artifacts…"
# Wipe everything except .git, DEPLOY.md, .gitignore, and the freshly-built
# folders we're about to drop in.
find . -mindepth 1 -maxdepth 1 \
  ! -name '.git' \
  ! -name 'DEPLOY.md' \
  ! -name '.gitignore' \
  ! -name 'public_html' \
  ! -name 'backend-app' \
  -exec rm -rf {} +
rm -rf public_html backend-app
cp -r dist/public_html .
cp -r dist/backend-app .

echo "→ 4/5 Committing…"
git add -A
if git diff-index --quiet HEAD --; then
  echo "  (no changes — nothing to deploy)"
else
  git commit -m "Deploy: $MSG"
fi

echo "→ 5/5 Pushing to origin/production…"
git push origin production

echo "→ Switching back to main…"
git checkout main

echo
echo "✓ Released. Hostinger will auto-pull within ~30s if Auto-deploy is on."
echo "  Verify: https://your-domain.com/api/auth/me (after 30s)"
