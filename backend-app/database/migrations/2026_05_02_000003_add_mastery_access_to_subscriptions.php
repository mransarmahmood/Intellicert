<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Premium-gating for the Mastery Library.
 *
 * The Mastery section sits behind a tier flag rather than the existing
 * monthly/sixmonth/yearly enum so it can be unbundled or bundled with
 * future tiers (Team, Business, Enterprise) without re-migrating.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('subscriptions', function (Blueprint $t) {
            if (!Schema::hasColumn('subscriptions', 'mastery_access')) {
                $t->boolean('mastery_access')->default(false)->index();
            }
            if (!Schema::hasColumn('subscriptions', 'mastery_unlocked_at')) {
                $t->timestamp('mastery_unlocked_at')->nullable();
            }
        });

        // Mastery progression per learner (separate from concept_mastery to
        // keep the standard library uncoupled from the premium tier).
        if (!Schema::hasTable('mastery_progress')) {
            Schema::create('mastery_progress', function (Blueprint $t) {
                $t->id();
                $t->unsignedBigInteger('user_id')->index();
                $t->unsignedBigInteger('mastery_topic_id')->index();
                $t->decimal('mastery_percent', 5, 2)->default(0);   // 0–100
                $t->boolean('method_card_downloaded')->default(false);
                $t->boolean('decision_tree_completed')->default(false);
                $t->boolean('calculation_sandbox_completed')->default(false);
                $t->boolean('application_workshop_completed')->default(false);
                $t->unsignedInteger('items_attempted')->default(0);
                $t->unsignedInteger('items_correct')->default(0);
                $t->timestamp('first_attempt_at')->nullable();
                $t->timestamp('last_attempt_at')->nullable();
                $t->timestamp('mastered_at')->nullable();
                $t->timestamps();
                $t->unique(['user_id', 'mastery_topic_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $t) {
            if (Schema::hasColumn('subscriptions', 'mastery_access')) $t->dropColumn('mastery_access');
            if (Schema::hasColumn('subscriptions', 'mastery_unlocked_at')) $t->dropColumn('mastery_unlocked_at');
        });
        Schema::dropIfExists('mastery_progress');
    }
};
