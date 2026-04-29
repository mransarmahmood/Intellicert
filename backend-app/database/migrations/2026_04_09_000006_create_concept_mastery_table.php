<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('concept_mastery')) {
            Schema::create('concept_mastery', function (Blueprint $t) {
                $t->bigIncrements('id');
                $t->unsignedBigInteger('user_id');
                $t->unsignedBigInteger('topic_id');
                $t->unsignedBigInteger('concept_id');
                $t->unsignedInteger('attempts')->default(0);
                $t->unsignedInteger('correct_attempts')->default(0);
                $t->unsignedTinyInteger('mastery_score')->default(0); // 0-100
                $t->float('ease_factor', 8, 2)->default(2.5);
                $t->integer('interval_days')->default(0);
                $t->integer('repetitions')->default(0);
                $t->unsignedTinyInteger('last_quality')->nullable(); // 0-5
                $t->timestamp('last_practiced_at')->nullable();
                $t->timestamp('next_review_at')->nullable();
                $t->timestamps();

                $t->unique(['user_id', 'concept_id']);
                $t->index(['user_id', 'next_review_at']);
                $t->index(['topic_id', 'concept_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('concept_mastery');
    }
};
