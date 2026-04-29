<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Track 1 — Topic 9-layer anatomy fields.
 *
 * Adds the four content fields the existing 10-step LearningFlow doesn't
 * already cover: explicit hook, learning objectives, worked example, and
 * GCC-anchored field application. The flow steps (try/recall/apply/teach)
 * remain in the existing LearningStep table.
 *
 * All fields nullable; existing topics keep rendering until backfill.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('topics', function (Blueprint $t) {
            if (!Schema::hasColumn('topics', 'hook_text'))               $t->text('hook_text')->nullable();
            if (!Schema::hasColumn('topics', 'hook_image_url'))          $t->string('hook_image_url', 500)->nullable();
            if (!Schema::hasColumn('topics', 'learning_objectives_json')) $t->json('learning_objectives_json')->nullable();
            if (!Schema::hasColumn('topics', 'worked_example_json'))     $t->json('worked_example_json')->nullable();
            if (!Schema::hasColumn('topics', 'field_application_json'))  $t->json('field_application_json')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('topics', function (Blueprint $t) {
            foreach ([
                'hook_text','hook_image_url','learning_objectives_json',
                'worked_example_json','field_application_json',
            ] as $col) {
                if (Schema::hasColumn('topics', $col)) $t->dropColumn($col);
            }
        });
    }
};
