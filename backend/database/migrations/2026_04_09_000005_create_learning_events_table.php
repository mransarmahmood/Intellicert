<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('learning_events')) {
            Schema::create('learning_events', function (Blueprint $t) {
                $t->bigIncrements('id');
                $t->unsignedBigInteger('user_id');
                $t->unsignedBigInteger('topic_id')->nullable();
                $t->unsignedBigInteger('concept_id')->nullable();
                $t->string('event_type', 80);
                $t->string('step_type', 40)->nullable();
                $t->unsignedTinyInteger('step_order')->nullable();
                $t->boolean('is_correct')->nullable();
                $t->unsignedTinyInteger('confidence')->nullable();
                $t->unsignedInteger('time_spent_ms')->nullable();
                $t->json('meta_json')->nullable();
                $t->timestamp('occurred_at')->useCurrent();
                $t->timestamps();

                $t->index('user_id');
                $t->index(['user_id', 'occurred_at']);
                $t->index(['topic_id', 'concept_id']);
                $t->index('event_type');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('learning_events');
    }
};
