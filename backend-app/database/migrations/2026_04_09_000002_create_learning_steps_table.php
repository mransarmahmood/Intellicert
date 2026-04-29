<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('learning_steps')) {
            Schema::create('learning_steps', function (Blueprint $t) {
                $t->bigIncrements('id');
                $t->integer('topic_id'); // matches existing topics.id type INT(11)
                // 10 step types in order
                $t->enum('step_type', [
                    'hook', 'try', 'core', 'visual', 'example',
                    'memory', 'recall', 'apply', 'teach', 'summary',
                ]);
                $t->longText('content_json');
                $t->timestamps();

                $t->unique(['topic_id', 'step_type']);
                $t->foreign('topic_id')->references('id')->on('topics')->cascadeOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('learning_steps');
    }
};
