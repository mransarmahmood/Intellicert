<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Per-user, per-card SM-2 state
        if (!Schema::hasTable('card_reviews')) {
            Schema::create('card_reviews', function (Blueprint $t) {
                $t->bigIncrements('id');
                $t->unsignedBigInteger('user_id');
                $t->unsignedBigInteger('card_id');
                $t->float('ease_factor', 8, 2)->default(2.5);
                $t->integer('interval_days')->default(0);
                $t->integer('repetitions')->default(0);
                $t->tinyInteger('last_quality')->nullable();
                $t->timestamp('last_reviewed_at')->nullable();
                $t->timestamp('next_review_at')->nullable();
                $t->timestamps();

                $t->unique(['user_id', 'card_id']);
                $t->index('user_id');
                $t->index('next_review_at');
            });
        }

        // Quiz attempts log
        if (!Schema::hasTable('quiz_attempts')) {
            Schema::create('quiz_attempts', function (Blueprint $t) {
                $t->bigIncrements('id');
                $t->unsignedBigInteger('user_id');
                $t->unsignedBigInteger('quiz_id');
                $t->tinyInteger('picked_index');
                $t->boolean('correct');
                $t->timestamp('taken_at')->useCurrent();

                $t->index('user_id');
                $t->index(['user_id', 'quiz_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_attempts');
        Schema::dropIfExists('card_reviews');
    }
};
