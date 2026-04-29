# Mastery Library — Phase 1+2+3 Release Report

**Generated:** 2026-04-29
**Build:** Phase 1 (scaffold) + Phase 2 (3 exemplars + tooling) + Phase 3 (UI integration)
**Status:** Foundation shipped. Content authoring is the long pole.

---

## Headline numbers

| Metric | Count |
|---|---|
| Categories seeded | **9 / 9** |
| Topics seeded (registry complete) | **65 / 65** |
| Topics at status `mastery_gold` | **3 / 65** (4.6%) |
| Topics at status `needs_sme` (failed defensibility) | **62 / 65** |
| Calculation topics (sandbox required) | **35 / 65** |
| Method Cards authored | **3 / 65** |
| Decision Trees authored | **3 / 65** |
| Calculation Sandboxes authored | **2 / 35** (M5.37 TRIR, M4.30 Stats) |
| Application Workshops authored | **1 / 30** (M1.01 FTA) |
| Mastery items authored | **15 / 325** (5 per topic × 3 topics) |
| Defensibility audits run | **65 / 65** |
| 12-point checklist passes (all 12 green) | **3 / 65** |

## What ships at `mastery_gold` today

| ID | Topic | Category | Calc | Notes |
|---|---|---|---|---|
| **M1.01** | Fault Tree Analysis (FTA) | M1 System Safety | — | Application Workshop variant; primary references IEC 61025 + NUREG-0492. Mastery threshold elevated to 0.90 (high-stakes process safety). |
| **M4.30** | Descriptive Statistics | M4 Statistics | ✓ | Foundation under M4.31 CIs and M4.35 Control Charts. Variant challenge re-verified arithmetic. |
| **M5.37** | TRIR | M5 Incident Metrics | ✓ | Selected as the methodological exemplar — single primary-source formula, clean discriminator with DART/LTIFR. |

These three set the quality bar that the remaining 62 topics must clear before they go live.

## SME review queue (62 topics — top 10 priorities)

Sequenced by exam-yield × under-taught factor × dependency chain:

1. **M5.38 DART** — pairs with M5.37; finishes the incident-metrics quartet.
2. **M5.39 LTIFR** — international companion to TRIR; closes the metrics frame.
3. **M5.40 Severity Rate** — completes M5 category coverage.
4. **M4.31 Confidence Intervals** — depends on M4.30 (descriptive stats) which is gold.
5. **M4.35 Control Charts (UCL/LCL)** — also builds on M4.30; high CSP exam yield.
6. **M1.03 FMEA** — pairs with M1.01 FTA on the selection-logic decision tree.
7. **M1.02 ETA** — completes the FTA / ETA / FMEA decision-logic triad.
8. **M3.20 TWA Calculation** — most-tested IH calculation; primary OSHA formula.
9. **M3.23 Noise Dose (OSHA & ACGIH)** — high CSP yield, well-defined inputs.
10. **M2.12 NIOSH Lifting Equation** — NIOSH RWL multipliers must be cited from the 1991 publication; one of the most error-prone calculations on the exam.

The remaining 52 topics are queued by priority tier:
- **P1 unfinished:** 14 topics across M1, M4, M5
- **P2:** 18 topics across M2 (Ergonomics), M3 (IH)
- **P3:** 13 topics across M6 (Investigation), M7 (Financial/PM)
- **P4:** 10 topics across M8 (CSP11-new), M9 (Process Safety)

## Tooling shipped (used to author the next 62)

```bash
# Author a topic via AI draft (saves to status='draft_for_sme')
php artisan content:generate-9-layer --topic=<topic_id>

# Run the 12-point defensibility check; auto-flips to mastery_gold or needs_sme
php artisan mastery:check-defensibility --id=M1.02 --report

# Audit the entire library
php artisan mastery:check-defensibility --all
php artisan content:audit
```

The defensibility check enforces:
1. All 18 elements present
2. Calculations sample-answer numeric (calc topics)
3. ≥1 primary-source citation
4. Decision tree ≥2 alternatives
5. Method card ≤3,500 chars (1-page heuristic)
6. GCC anchoring in field application
7. Distinction with related methods explicit
8. All items have 4-component rationale
9. Cross-domain links ≥2
10. Bloom distribution diverse (max 2 per level)
11. Method-selection logic tested in ≥1 item
12. SME notes captured

## API surface (live and verified)

| Route | Method | Auth | Status |
|---|---|---|---|
| `/api/mastery/categories` | GET | mastery.access | ✅ 200 (returns 9 categories with 65 topics nested) |
| `/api/mastery/topics` | GET | mastery.access | ✅ 200 |
| `/api/mastery/topics/{masteryId}` | GET | mastery.access | ✅ 200 (M5.37 confirmed has method_card + decision_tree + sandbox) |
| `/api/mastery/topics/{masteryId}/items` | GET | mastery.access | ✅ 200 (M1.01 returns 5 mastery_gold items) |
| `/api/mastery/topics/{masteryId}/progress` | POST | mastery.access | ✅ wired |

Premium gate behavior:
- Admin/superadmin: always allowed
- Subscription with `mastery_access=1` OR plan ∈ {`sixmonth`, `yearly`}: allowed
- Otherwise: HTTP 402 + `{ upgrade_required: true }` → React renders the paywall card

## React UI shipped (premium-gated)

- `MasteryLibraryPage` — 9-category overview with topic counts, live-vs-SME status, and explicit upgrade card on 402
- `MasteryTopicPage` — full 18-element topic renderer with prominent Method Card panel, Decision Tree panel, and Calculation Sandbox preview
- Routes `/mastery` and `/mastery/:masteryId` registered with lazy loading
- Sidebar: "Mastery Library" entry in Layout.tsx (Trophy icon)

## Marketing claim — eligibility status

> **"65 advanced techniques every CSP must master — the only CSP11 prep with a full Mastery Library"**

Eligibility threshold: **≥30 / 65 topics at `mastery_gold`** (rolling — first 30 unlock baseline marketing; ≥50 unlocks the "full library" claim).

Current: **3 / 65** — claim is **NOT yet eligible**. The first 30 P1 topics complete the baseline.

## Recommended SME workflow for the remaining 62

1. **Batch-author 5 topics per sitting** via `content:generate-9-layer`. AI draft is the starting point, not the destination.
2. **For each draft topic, do these manual passes:**
   - Verify every formula against the cited primary source (NIOSH 1991 RWL multipliers, ACGIH TLVs, IEC 61508 SIL targets, etc.)
   - Recompute every sample answer by hand
   - Replace any GCC anchoring placeholder with a real Saudi Aramco / NEOM / RSG / Etihad case
   - Tighten the method card to fit ≤3,500 JSON chars (1 printed page)
   - Add the 5 mastery items (4-component rationale each); ensure ≥1 tests selection logic
   - Run `php artisan mastery:check-defensibility --id=<id> --report` and iterate until all 12 are green
3. **Cross-topic check after every category completes:**
   - Run a "distinction with related methods" review across the category (the existing `categories/Mn.md` file has a placeholder section for this)
   - Verify decision trees in adjacent topics agree (e.g., FTA decision tree's "use FMEA when…" matches FMEA's "use FTA when…")

## Refuse conditions encountered

- None during Phase 1+2+3 (the 3 exemplars all passed without flag).
- The defensibility checker will surface refuse conditions automatically as remaining topics are authored. Topics that fail a refuse condition (formula not verified, decision branch not defended, method card >1 page) stay at `needs_sme` and are not surfaced to learners.

## What's deliberately NOT done in this release

- **PDF rendering of Method Cards** — the JSON spec is captured per topic; the actual PDF render is a separate engineer pass (use Spatie Browsershot or Dompdf with a reusable LaTeX-style template). Out of scope for the foundation release.
- **SVG rendering of Decision Trees** — the JSON spec is captured per topic; SVG generation can be done with d3-tree or hand-authored per topic during SME review.
- **Calculation Sandbox interactive UI** — the JSON spec is captured; the React form-and-evaluate widget is a separate component build (similar pattern to the existing `CalculatorOverlay`). The current page renders the spec read-only.
- **Application Workshop AI-grading endpoint** — workshop spec includes `ai_grading: true`; the `/api/mastery/workshop-grade` endpoint can be added by adapting the existing `/api/ai/feynman` handler.
- **Mastery progression integration** with the existing `concept_mastery` SRS — `mastery_progress` table is in place, but the schedule-into-daily-queue wiring is a separate task.
- **Authoring of 62 remaining topics** — see SME workflow above.

## Files of record

- Schema: `backend/database/migrations/2026_05_02_*` (3 migrations)
- Registry seeder: `backend/database/seeders/MasteryRegistrySeeder.php`
- Exemplar seeder (3 gold topics): `backend/database/seeders/MasteryExemplarsSeeder.php`
- Models: `backend/app/Models/{MasteryCategory,MasteryTopic,MasteryItem}.php`
- Premium-gate middleware: `backend/app/Http/Middleware/RequireMasteryAccess.php`
- Controller: `backend/app/Http/Controllers/MasteryController.php`
- Tooling: `backend/app/Console/Commands/{MasteryScaffold,MasteryDefensibilityCheck}.php`
- Evidence files: `docs/csp11_mastery/topics/M*.md` (65 files) + `categories/M*.md` (9) + `00_index.md`
- React: `student-react/src/pages/{MasteryLibraryPage,MasteryTopicPage}.tsx`
- Storage: `backend/storage/mastery/{method_cards,decision_trees,sandbox_specs}/`

---

**Phase 1 + 2 + 3 complete.** The Mastery Library has a defensible foundation with 3 gold-standard exemplars proving the quality bar is achievable, and the tooling to author the remaining 62 topics in measured SME-supervised batches.
