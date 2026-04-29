# IntelliCert — Hostinger Git Deploy Branch

This is the **`production`** branch. It contains pre-built artifacts ready for
direct deployment to Hostinger via Hostinger's Git auto-deploy feature.

**Do not edit files here directly.** Source lives on `main`. Update flow:

```
main:           develop + commit source
local build:    node build-prod.cjs && node deploy-bundle.cjs
production:     replace contents with dist/, commit, push
Hostinger:      auto-pull on push (or manual pull from hPanel)
```

## Layout

```
public_html/    →  Hostinger maps this to /home/<user>/public_html/
backend-app/    →  Hostinger maps this to /home/<user>/backend-app/
                   (one level above public_html, NOT web-accessible)
```

## Hostinger configuration (one-time)

### 1. Connect the Git repository

hPanel → Websites → your domain → **Advanced → Git**:

- **Repository address:** `https://github.com/mransarmahmood/Intellicert.git`
- **Branch:** `production`
- **Repository directory:** `~/` (the user's home directory — NOT public_html)

This places the cloned repo at `/home/<user>/Intellicert/` so:
- `public_html/` content needs to be linked or symlinked into `/home/<user>/public_html/`
- `backend-app/` content needs to be linked into `/home/<user>/backend-app/`

**Symlink approach (recommended on Hostinger):**

After the first Git pull, SSH (or use File Manager) to run:

```bash
cd ~
# Replace existing public_html and backend-app with symlinks into the cloned repo
rm -rf public_html backend-app   # ONLY first time, after backing up if needed
ln -s ~/Intellicert/public_html ~/public_html
ln -s ~/Intellicert/backend-app ~/backend-app
```

**Direct-clone-into-public_html approach (if symlinks aren't allowed):**

Set the Git repository directory to `~/public_html/`, then accept that
`backend-app/` will live at `~/public_html/backend-app/`. Block direct web
access via the existing `.htaccess` deny rule (already configured to deny
`backend-app/`).

### 2. Create `backend-app/.env` (one-time, manual)

The `.env` file is **not** committed to git. Create it on the server:

```bash
cd ~/backend-app
cp .env.production.example .env
nano .env
```

Required values:

| Key | Source |
|---|---|
| `APP_KEY` | Run `php artisan key:generate` to populate |
| `APP_URL` | Your domain, e.g. `https://intellicert.com` |
| `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | hPanel → Databases → MySQL |
| `GROQ_API_KEY` | https://console.groq.com (rotated key) |
| `GEMINI_API_KEY` | https://console.cloud.google.com (rotated key) |
| `STRIPE_SECRET` | Stripe dashboard |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks → after configuring endpoint |
| `CORS_ALLOWED_ORIGINS` | `https://your-domain.com` |

Then:

```bash
php artisan migrate --force
php artisan db:seed --class=MasteryRegistrySeeder
php artisan db:seed --class=MasteryExemplarsSeeder
php artisan config:cache
php artisan route:cache
```

### 3. Configure Stripe webhook

Stripe dashboard → Webhooks → Add endpoint:
- URL: `https://your-domain.com/api/checkout?action=webhook-stripe`
- Events: `checkout.session.completed`, `customer.subscription.deleted`
- Copy the signing secret into `backend-app/.env` `STRIPE_WEBHOOK_SECRET`.

### 4. Enable auto-deploy (optional but recommended)

hPanel → Git → toggle **Auto-deploy on push**. Every `git push origin production`
from your machine then triggers a Hostinger pull within ~30 seconds. No more
manual uploads.

## Verifying a deploy succeeded

After Hostinger pulls:

```
GET  https://your-domain.com/                  → marketing site loads
GET  https://your-domain.com/app/              → student app loads
GET  https://your-domain.com/admin/            → admin app loads
POST https://your-domain.com/api/auth/login    → 200 with token (using seeded admin)
```

## Rollback

```bash
git revert <commit-sha>
git push origin production
# Hostinger auto-pulls; site is back to the prior version
```

Or via Hostinger UI: hPanel → Git → Pull Specific Commit.

## Updating after a code change

From your dev machine on `main`:

```bash
# 1. Build fresh artifacts
node deploy-bundle.cjs

# 2. Switch to production, replace artifacts, commit, push
git checkout production
rm -rf public_html backend-app
cp -r dist/public_html .
cp -r dist/backend-app .
git add -A
git commit -m "Deploy: <short description of change>"
git push origin production

# 3. Switch back to main
git checkout main
```

A helper script (`scripts/release.sh`) is on `main` to automate steps 1–3.
