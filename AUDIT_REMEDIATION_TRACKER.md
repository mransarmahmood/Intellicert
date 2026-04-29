# IntelliCert Audit Remediation Tracker

Last updated: 2026-04-17

This tracker converts the multidisciplinary audit findings into an implementation backlog. Maturity scores use the same 1-5 scale from the audit. "Current" reflects code changes completed after the audit, not a full re-audit.

## Scoring Dashboard

| Domain | Audit Maturity | Current Maturity | Main Finding | Priority | Current Status |
|---|---:|---:|---|---|---|
| Workflow & user journey | 3.2 | 3.2 | Strong learner navigation, but onboarding and role journeys are thin | High | Not started |
| Content & curriculum | 3.8 | 3.8 | Deep CSP/OSHA coverage; needs objective and competency mapping | High | Not started |
| Content quality | 3.5 | 3.5 | Rich explanations and examples; needs SME review and version governance | High | Not started |
| Learning experience | 4.0 | 4.0 | SRS, Feynman, maps, drills, and gamification are strong | Medium | Not started |
| Assessment & certification | 3.1 | 3.3 | Good practice engine; weak certification governance and psychometrics | Critical | In progress |
| Memory & retention | 4.1 | 4.1 | Strong SRS and retrieval foundation | Medium | Not started |
| Technology architecture | 3.0 | 3.1 | Laravel/React direction is good; legacy duplication creates risk | Critical | In progress |
| Security & privacy | 2.0 | 2.8 | Hard-coded keys, wildcard CORS, and weak compliance workflows | Critical | In progress |
| Accessibility & inclusion | 2.6 | 2.6 | Some TTS/focus support; no WCAG 2.2 AA assurance | High | Not started |
| Analytics & reporting | 2.8 | 2.8 | Event capture exists; dashboards are not yet L&D-grade | High | Not started |
| QA & compliance | 2.2 | 2.4 | Minimal automated tests and limited audit governance | Critical | In progress |
| Business sustainability | 3.0 | 3.0 | Clear niche advantage; partner/SaaS model needs operational systems | Medium | Not started |

## Implemented Remediation

| Finding | Implementation | Files |
|---|---|---|
| Hard-coded third-party API keys | Moved legacy API provider keys to environment variables and added production/env examples | `api/config.php`, `backend/.env.example`, `backend/.env.production.example` |
| Wildcard legacy CORS | Replaced `Access-Control-Allow-Origin: *` with origin allow-list behavior and localhost dev support | `api/config.php` |
| Sensitive legacy database errors | Database errors are generic unless `APP_DEBUG` is enabled | `api/config.php`, `api/certifications.php` |
| Weak legacy endpoint auth helpers | Added bearer token extraction, authenticated user lookup, admin/superadmin role guards, and user ownership checks | `api/config.php` |
| Certificate issuance trust gap | Made legacy certificate issuance admin-only, personal record reads authenticated, delete superadmin-only, and learner claims pending-review instead of auto-issued | `api/certifications.php` |
| Missing security headers | Added referrer policy, permissions policy, HTTPS-only HSTS, and report-only CSP at Apache and Laravel layers | `.htaccess`, `backend/app/Http/Middleware/SecurityHeaders.php`, `backend/bootstrap/app.php` |
| GDPR/data subject workflow gap | Added authenticated data export, deletion request creation, request listing, and admin status update workflow | `backend/app/Http/Controllers/PrivacyController.php`, `backend/routes/api.php`, `backend/database/migrations/2026_04_17_000001_create_privacy_requests_table.php` |

## Remaining Critical Gaps

| Domain | Gap | Recommended Next Action | Target |
|---|---|---|---|
| Security & privacy | Previously exposed API keys may still be valid | Rotate Groq, Gemini, DeepAI, Unsplash, Pexels, and Pixabay keys in vendor consoles | 0-7 days |
| Security & privacy | Tokens are still stored in browser localStorage | Move session handling toward HttpOnly secure cookies or short-lived access tokens with refresh rotation | 0-3 months |
| Security & privacy | Privacy workflow is started but not a full GDPR program | Add privacy notice, consent registry, retention rules, DSR SLA dashboard, deletion/anonymization jobs, and processor register | 0-3 months |
| Assessment & certification | Certification is not yet ISO 17024-grade | Add candidate eligibility rules, assessor separation, certificate revocation, verification endpoint, decision audit trail, and appeal workflow | 0-6 months |
| Assessment & certification | No item psychometrics | Track item difficulty, discrimination, exposure, blueprint coverage, reliability, and item review status | 0-6 months |
| Technology architecture | Legacy PHP and Laravel APIs overlap | Route all production API traffic through Laravel, freeze legacy writes, then retire legacy endpoints | 0-6 months |
| QA & compliance | Minimal automated tests | Add feature tests for auth, privacy export/request, certification issuance guards, and assessment ownership | 0-3 months |
| Accessibility & inclusion | No WCAG 2.2 AA assurance | Run axe/manual keyboard audit, fix labels/focus/modal traps, add accessible chart tables, document WCAG evidence | 0-3 months |

## Domain Backlog

### Workflow & User Journey
- Add role-specific onboarding for learner, trainer, assessor, admin, and tenant owner.
- Add guided placement/diagnostic flow before first study plan.
- Add clearer completion states for course, assessment, certification, and revision workflows.

### Content & Curriculum
- Map every topic, concept, flashcard, quiz, and learning step to learning objectives and competency framework IDs.
- Add support for standards references such as ISO, OSHA, NEBOSH, CSP blueprint, and regional variants.
- Add localization metadata for language, region, examples, and regulatory context.

### Content Quality
- Add SME review states: draft, reviewed, approved, retired.
- Add version history and change rationale for high-stakes content.
- Add source/citation fields and last-reviewed dates.

### Learning Experience
- Keep SRS, Feynman, mind maps, drills, and gamification as differentiators.
- Add personalization rules that explain why each recommendation was made.
- Add collaborative/cohort learning features for trainer-led programs.

### Analytics & Reporting
- Build learner, trainer, admin, and L&D dashboards separately.
- Add cohort progress, competency heatmaps, at-risk learners, seat utilization, completion, engagement, and retention metrics.
- Add exportable reports for training partners.

### Business Sustainability
- Add tenant configuration, partner branding, seat management, pricing/package rules, invoice/payment lifecycle, and partner analytics.
- Define clear value proposition versus Coursera, Udemy Business, LinkedIn Learning, Moodle, and TalentLMS.

## Verification Notes

- PHP syntax checks passed for edited PHP files using `C:\xampp1\php\php.exe -l`.
- Laravel route and migration runtime checks require PHP 8.2+. The local XAMPP binary is PHP 8.0.30, while the backend dependencies require PHP >= 8.2.
- A secret scan over non-vendor and non-node_modules source found no remaining matches for the exposed key patterns or `Access-Control-Allow-Origin: *`.
