<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Mastery topics — extends the standard topics table semantically but lives
 * in its own table to avoid coupling. Each Mastery topic is gated to premium
 * tiers and authored to the 18-element Mastery Gold Standard.
 *
 * Status workflow:
 *   draft_for_sme → AI-generated, awaiting first SME pass
 *   needs_sme     → Failed defensibility check OR SME flagged
 *   mastery_gold  → Passed all 12 points; live to learners
 *   archived      → Retired
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('mastery_topics', function (Blueprint $t) {
            $t->id();
            $t->string('mastery_id', 12)->unique();          // 'M1.01' … 'M9.65'
            $t->string('mastery_category_code', 8)->index(); // 'M1' .. 'M9'
            $t->string('slug', 120)->unique();
            $t->string('name', 200);
            $t->string('subtitle', 240)->nullable();

            // CSP11 blueprint mapping — primary + optional secondary
            $t->string('primary_blueprint_code', 40)->index();
            $t->string('secondary_blueprint_code', 40)->nullable();

            // 18-element gold standard fields. Most are JSON for nested structure.
            // Standard 1-15 (mirroring the topic 9-layer + concepts + flow):
            $t->text('hook_text')->nullable();
            $t->json('learning_objectives_json')->nullable();
            $t->text('overview_html')->nullable();
            $t->json('concepts_json')->nullable();           // Flat concept list
            $t->json('worked_example_json')->nullable();
            $t->json('field_application_json')->nullable();
            $t->json('mnemonics_json')->nullable();
            $t->json('common_pitfalls_json')->nullable();
            $t->json('cross_domain_links_json')->nullable();
            $t->json('citations_json')->nullable();          // Primary sources
            $t->json('flow_steps_json')->nullable();         // 10-step flow content

            // Mastery-only elements 16, 17, 18:
            $t->json('method_card_json')->nullable();
            $t->string('method_card_pdf_path', 300)->nullable();
            $t->json('decision_tree_json')->nullable();
            $t->string('decision_tree_svg_path', 300)->nullable();
            $t->json('calculation_sandbox_json')->nullable();
            $t->json('application_workshop_json')->nullable();

            $t->decimal('mastery_threshold', 4, 3)->default(0.85);
            $t->boolean('requires_calculator')->default(false);
            $t->boolean('is_calculation_topic')->default(false);

            // Defensibility audit
            $t->json('defensibility_checklist_json')->nullable();
            $t->string('status', 24)->default('draft_for_sme')->index();
            $t->timestamp('sme_reviewed_at')->nullable();
            $t->unsignedBigInteger('sme_reviewed_by_user_id')->nullable();
            $t->text('sme_notes')->nullable();

            $t->unsignedInteger('sort_order')->default(0);
            $t->timestamps();

            $t->index(['mastery_category_code', 'sort_order']);
        });

        // Mastery items (quiz questions tied to mastery topics) — separate from
        // standard `quizzes` so the Mastery Library can be queried in isolation.
        Schema::create('mastery_items', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('mastery_topic_id')->index();
            $t->string('item_kind', 20)->default('mcq');     // mcq|calculation|scenario
            $t->string('cognitive_level', 20)->default('apply'); // recall|application|analysis|scenario|calculation
            $t->text('stem');
            $t->json('options_json')->nullable();             // [{label, body}, …]
            $t->unsignedTinyInteger('correct_index')->nullable();
            $t->json('calculation_inputs_json')->nullable();  // for kind=calculation
            $t->text('correct_rationale')->nullable();
            $t->json('option_rationales_json')->nullable();   // {a,b,c,d}
            $t->text('common_trap')->nullable();
            $t->string('memory_hook', 200)->nullable();
            $t->unsignedTinyInteger('bloom_level')->nullable();
            $t->string('source_reference', 300)->nullable();
            $t->string('status', 16)->default('draft_for_sme');
            $t->unsignedInteger('sort_order')->default(0);
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mastery_items');
        Schema::dropIfExists('mastery_topics');
    }
};
