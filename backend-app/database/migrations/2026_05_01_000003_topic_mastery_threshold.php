<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Track 1 — Per-topic mastery threshold.
 *
 * The LearningFlowPage will gate progression on quiz score ≥ this value.
 * Default 0.85 (85%) for safety; high-stakes topics (LOTO, confined space,
 * fall protection) can be raised to 0.90 in content authoring.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('topics', function (Blueprint $t) {
            if (!Schema::hasColumn('topics', 'mastery_threshold')) {
                $t->decimal('mastery_threshold', 4, 3)->default(0.85);
            }
        });
    }

    public function down(): void
    {
        Schema::table('topics', function (Blueprint $t) {
            if (Schema::hasColumn('topics', 'mastery_threshold')) {
                $t->dropColumn('mastery_threshold');
            }
        });
    }
};
