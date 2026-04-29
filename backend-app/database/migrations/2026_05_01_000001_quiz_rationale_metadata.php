<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Track 1 — Quiz item metadata expansion.
 *
 * Adds the fields required for the 4-component rationale standard
 * (per-option rationales, common trap, memory hook), Bloom level,
 * sub-domain blueprint code, status workflow, and source attribution.
 *
 * All columns are nullable so existing 360 items keep working until
 * authoring backfills them.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('quizzes', function (Blueprint $t) {
            if (!Schema::hasColumn('quizzes', 'option_a_rationale')) $t->text('option_a_rationale')->nullable();
            if (!Schema::hasColumn('quizzes', 'option_b_rationale')) $t->text('option_b_rationale')->nullable();
            if (!Schema::hasColumn('quizzes', 'option_c_rationale')) $t->text('option_c_rationale')->nullable();
            if (!Schema::hasColumn('quizzes', 'option_d_rationale')) $t->text('option_d_rationale')->nullable();
            if (!Schema::hasColumn('quizzes', 'common_trap'))        $t->text('common_trap')->nullable();
            if (!Schema::hasColumn('quizzes', 'memory_hook_topic_id')) {
                $t->unsignedBigInteger('memory_hook_topic_id')->nullable();
                // Soft FK — no constraint to avoid blocking topic deletes during content edits.
                $t->index('memory_hook_topic_id');
            }
            if (!Schema::hasColumn('quizzes', 'bloom_level'))        $t->unsignedTinyInteger('bloom_level')->nullable();
            if (!Schema::hasColumn('quizzes', 'sub_domain_code'))    $t->string('sub_domain_code', 40)->nullable()->index();
            if (!Schema::hasColumn('quizzes', 'status'))             $t->string('status', 16)->default('live')->index();
            if (!Schema::hasColumn('quizzes', 'source_reference'))   $t->string('source_reference', 200)->nullable();
            if (!Schema::hasColumn('quizzes', 'last_reviewed_at'))   $t->timestamp('last_reviewed_at')->nullable();
            if (!Schema::hasColumn('quizzes', 'last_reviewed_by_user_id')) $t->unsignedBigInteger('last_reviewed_by_user_id')->nullable();
        });

        // Calibration cache (Track 2 reads existing quiz_attempts; this caches the result).
        if (!Schema::hasTable('quiz_calibrations')) {
            Schema::create('quiz_calibrations', function (Blueprint $t) {
                $t->id();
                $t->unsignedBigInteger('quiz_id')->unique();
                $t->unsignedInteger('attempts')->default(0);
                $t->decimal('p_value', 5, 4)->nullable();           // proportion correct
                $t->decimal('discrimination', 5, 4)->nullable();    // top27%-bottom27%
                $t->json('distractor_choice_pct')->nullable();      // {a: 0.12, b: 0.55, c: 0.25, d: 0.08}
                $t->decimal('avg_seconds', 7, 2)->nullable();
                $t->timestamp('computed_at')->nullable();
                $t->timestamps();
                $t->index('p_value');
                $t->index('discrimination');
            });
        }
    }

    public function down(): void
    {
        Schema::table('quizzes', function (Blueprint $t) {
            foreach ([
                'option_a_rationale','option_b_rationale','option_c_rationale','option_d_rationale',
                'common_trap','memory_hook_topic_id','bloom_level','sub_domain_code',
                'status','source_reference','last_reviewed_at','last_reviewed_by_user_id',
            ] as $col) {
                if (Schema::hasColumn('quizzes', $col)) $t->dropColumn($col);
            }
        });
        Schema::dropIfExists('quiz_calibrations');
    }
};
