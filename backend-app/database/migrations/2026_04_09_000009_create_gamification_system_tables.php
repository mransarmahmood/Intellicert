<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('gamification_profiles')) {
            Schema::create('gamification_profiles', function (Blueprint $t) {
                $t->bigIncrements('id');
                $t->unsignedBigInteger('user_id')->unique();
                $t->unsignedInteger('total_xp')->default(0);
                $t->unsignedInteger('current_level')->default(1);
                $t->string('level_title', 80)->default('Foundation Learner');
                $t->unsignedInteger('xp_to_next_level')->default(100);
                $t->unsignedTinyInteger('level_progress_percent')->default(0);
                $t->unsignedInteger('current_streak_days')->default(0);
                $t->unsignedInteger('longest_streak_days')->default(0);
                $t->date('last_activity_date')->nullable();
                $t->unsignedTinyInteger('readiness_score')->default(0);
                $t->timestamps();
            });
        }

        if (!Schema::hasTable('xp_events')) {
            Schema::create('xp_events', function (Blueprint $t) {
                $t->bigIncrements('id');
                $t->unsignedBigInteger('user_id');
                $t->string('event_type', 80);
                $t->integer('xp_awarded');
                $t->unsignedBigInteger('topic_id')->nullable();
                $t->unsignedBigInteger('concept_id')->nullable();
                $t->json('meta_json')->nullable();
                $t->timestamp('occurred_at')->useCurrent();
                $t->timestamps();
                $t->index(['user_id', 'occurred_at']);
                $t->index(['user_id', 'event_type']);
            });
        }

        if (!Schema::hasTable('badges')) {
            Schema::create('badges', function (Blueprint $t) {
                $t->bigIncrements('id');
                $t->string('code', 80)->unique();
                $t->string('name', 120);
                $t->string('category', 40); // learning|revision|mastery|assessment|consistency|recovery
                $t->text('description')->nullable();
                $t->string('icon', 80)->nullable();
                $t->unsignedInteger('xp_reward')->default(0);
                $t->json('criteria_json')->nullable();
                $t->boolean('is_active')->default(true);
                $t->timestamps();
            });
        }

        if (!Schema::hasTable('user_badges')) {
            Schema::create('user_badges', function (Blueprint $t) {
                $t->bigIncrements('id');
                $t->unsignedBigInteger('user_id');
                $t->unsignedBigInteger('badge_id');
                $t->timestamp('awarded_at')->useCurrent();
                $t->json('meta_json')->nullable();
                $t->timestamps();
                $t->unique(['user_id', 'badge_id']);
                $t->index(['user_id', 'awarded_at']);
            });
        }

        if (!Schema::hasTable('missions')) {
            Schema::create('missions', function (Blueprint $t) {
                $t->bigIncrements('id');
                $t->string('code', 80)->unique();
                $t->string('name', 140);
                $t->string('type', 20)->default('daily'); // daily|weekly
                $t->string('event_type', 80);
                $t->unsignedInteger('target_count')->default(1);
                $t->unsignedInteger('xp_reward')->default(20);
                $t->json('rules_json')->nullable();
                $t->boolean('is_active')->default(true);
                $t->timestamps();
            });
        }

        if (!Schema::hasTable('user_missions')) {
            Schema::create('user_missions', function (Blueprint $t) {
                $t->bigIncrements('id');
                $t->unsignedBigInteger('user_id');
                $t->unsignedBigInteger('mission_id');
                $t->date('window_start');
                $t->date('window_end');
                $t->unsignedInteger('progress_count')->default(0);
                $t->unsignedInteger('target_count')->default(1);
                $t->string('status', 20)->default('active'); // active|completed|claimed|expired
                $t->timestamp('completed_at')->nullable();
                $t->timestamp('claimed_at')->nullable();
                $t->timestamps();
                $t->index(['user_id', 'status']);
                $t->index(['user_id', 'window_start', 'window_end']);
            });
        }

        if (!Schema::hasTable('achievement_events')) {
            Schema::create('achievement_events', function (Blueprint $t) {
                $t->bigIncrements('id');
                $t->unsignedBigInteger('user_id');
                $t->string('event_type', 80);
                $t->string('title', 160);
                $t->text('description')->nullable();
                $t->unsignedBigInteger('badge_id')->nullable();
                $t->unsignedBigInteger('mission_id')->nullable();
                $t->integer('xp_delta')->default(0);
                $t->json('meta_json')->nullable();
                $t->timestamp('occurred_at')->useCurrent();
                $t->timestamps();
                $t->index(['user_id', 'occurred_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('achievement_events');
        Schema::dropIfExists('user_missions');
        Schema::dropIfExists('missions');
        Schema::dropIfExists('user_badges');
        Schema::dropIfExists('badges');
        Schema::dropIfExists('xp_events');
        Schema::dropIfExists('gamification_profiles');
    }
};
