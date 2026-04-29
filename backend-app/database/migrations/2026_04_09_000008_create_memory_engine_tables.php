<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('concept_memory_profiles')) {
            Schema::create('concept_memory_profiles', function (Blueprint $t) {
                $t->bigIncrements('id');
                $t->unsignedBigInteger('user_id');
                $t->unsignedBigInteger('topic_id');
                $t->unsignedBigInteger('concept_id');
                $t->unsignedTinyInteger('mastery_percent')->default(0);
                $t->unsignedTinyInteger('retention_score')->default(0);
                $t->string('forgetting_risk', 20)->default('moderate'); // low|moderate|high|critical
                $t->unsignedInteger('review_count')->default(0);
                $t->unsignedInteger('streak_days')->default(0);
                $t->integer('interval_days')->default(0);
                $t->integer('current_stage')->default(0); // 0..7 for fixed intervals
                $t->timestamp('last_reviewed_at')->nullable();
                $t->timestamp('next_review_at')->nullable();
                $t->timestamps();

                $t->unique(['user_id', 'concept_id']);
                $t->index(['user_id', 'next_review_at']);
            });
        }

        // Ensure flashcards exists and has concept-aware columns for memory engine.
        if (!Schema::hasTable('flashcards')) {
            Schema::create('flashcards', function (Blueprint $t) {
                $t->bigIncrements('id');
                $t->string('card_key', 80)->unique();
                $t->string('domain_id', 20)->nullable();
                $t->unsignedBigInteger('concept_id')->nullable();
                $t->string('source', 30)->default('manual');
                $t->string('card_type', 30)->default('qa');
                $t->text('front');
                $t->longText('back');
                $t->string('image_url', 500)->nullable();
                $t->timestamps();
                $t->index('domain_id');
                $t->index('concept_id');
            });
        } else {
            Schema::table('flashcards', function (Blueprint $t) {
                if (!Schema::hasColumn('flashcards', 'concept_id')) $t->unsignedBigInteger('concept_id')->nullable()->after('domain_id');
                if (!Schema::hasColumn('flashcards', 'source')) $t->string('source', 30)->default('manual')->after('concept_id');
                if (!Schema::hasColumn('flashcards', 'card_type')) $t->string('card_type', 30)->default('qa')->after('source');
            });
        }

        if (!Schema::hasTable('user_flashcard_reviews')) {
            Schema::create('user_flashcard_reviews', function (Blueprint $t) {
                $t->bigIncrements('id');
                $t->unsignedBigInteger('user_id');
                $t->unsignedBigInteger('flashcard_id');
                $t->unsignedTinyInteger('quality')->default(2); // Again(0)/Hard(1)/Good(2)/Easy(3)
                $t->unsignedTinyInteger('recall_score')->default(0);
                $t->boolean('correct')->default(false);
                $t->integer('interval_days')->default(0);
                $t->integer('stage')->default(0);
                $t->timestamp('reviewed_at')->useCurrent();
                $t->timestamp('next_review_at')->nullable();
                $t->timestamps();
                $t->index(['user_id', 'next_review_at']);
                $t->index(['user_id', 'flashcard_id']);
            });
        }

        if (!Schema::hasTable('daily_review_queues')) {
            Schema::create('daily_review_queues', function (Blueprint $t) {
                $t->bigIncrements('id');
                $t->unsignedBigInteger('user_id');
                $t->date('queue_date');
                $t->unsignedBigInteger('concept_id')->nullable();
                $t->unsignedBigInteger('flashcard_id')->nullable();
                $t->string('status', 20)->default('pending'); // pending|completed|skipped
                $t->unsignedTinyInteger('priority')->default(2);
                $t->timestamps();
                $t->unique(['user_id', 'queue_date', 'concept_id', 'flashcard_id'], 'daily_review_unique');
                $t->index(['user_id', 'queue_date', 'status']);
            });
        }

        if (!Schema::hasTable('memory_events')) {
            Schema::create('memory_events', function (Blueprint $t) {
                $t->bigIncrements('id');
                $t->unsignedBigInteger('user_id');
                $t->unsignedBigInteger('topic_id')->nullable();
                $t->unsignedBigInteger('concept_id')->nullable();
                $t->unsignedBigInteger('flashcard_id')->nullable();
                $t->string('event_type', 80);
                $t->json('payload_json')->nullable();
                $t->timestamp('occurred_at')->useCurrent();
                $t->timestamps();
                $t->index(['user_id', 'occurred_at']);
                $t->index(['concept_id', 'flashcard_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('memory_events');
        Schema::dropIfExists('daily_review_queues');
        Schema::dropIfExists('user_flashcard_reviews');
        Schema::dropIfExists('concept_memory_profiles');
        // Do not drop flashcards table in rollback because it may pre-exist.
    }
};
