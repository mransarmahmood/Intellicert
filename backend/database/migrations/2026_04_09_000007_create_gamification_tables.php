<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('user_xp_ledger')) {
            Schema::create('user_xp_ledger', function (Blueprint $t) {
                $t->bigIncrements('id');
                $t->unsignedBigInteger('user_id');
                $t->integer('xp_delta');
                $t->string('source', 80);
                $t->unsignedBigInteger('topic_id')->nullable();
                $t->unsignedBigInteger('concept_id')->nullable();
                $t->json('meta_json')->nullable();
                $t->timestamp('awarded_at')->useCurrent();
                $t->timestamps();

                $t->index('user_id');
                $t->index(['user_id', 'awarded_at']);
                $t->index('source');
            });
        }

        if (!Schema::hasTable('user_gamification_state')) {
            Schema::create('user_gamification_state', function (Blueprint $t) {
                $t->bigIncrements('id');
                $t->unsignedBigInteger('user_id');
                $t->integer('total_xp')->default(0);
                $t->integer('current_streak_days')->default(0);
                $t->integer('best_streak_days')->default(0);
                $t->date('last_activity_date')->nullable();
                $t->timestamps();

                $t->unique('user_id');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('user_gamification_state');
        Schema::dropIfExists('user_xp_ledger');
    }
};
