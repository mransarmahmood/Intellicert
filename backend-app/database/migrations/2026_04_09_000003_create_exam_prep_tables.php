<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('calculations')) {
            Schema::create('calculations', function (Blueprint $t) {
                $t->bigIncrements('id');
                $t->string('calc_key', 50)->unique();
                $t->string('domain_id', 20)->nullable();
                $t->string('category', 80);
                $t->string('difficulty', 20)->default('easy');
                $t->string('title');
                $t->text('problem');
                $t->string('formula', 255)->nullable();
                $t->longText('variables_json')->nullable(); // {"N": {"label":..,"value":..,"unit":..}, ...}
                $t->longText('steps_json')->nullable();     // [{"instruction":..,"calculation":..,"result":..}]
                $t->double('answer')->nullable();
                $t->string('answer_unit', 20)->nullable();
                $t->double('tolerance')->default(0.01);
                $t->text('interpretation')->nullable();
                $t->text('exam_tip')->nullable();
                $t->timestamps();
                $t->index('domain_id');
                $t->index('category');
            });
        }

        if (!Schema::hasTable('critical_numbers')) {
            Schema::create('critical_numbers', function (Blueprint $t) {
                $t->bigIncrements('id');
                $t->string('number_key', 80)->unique();
                $t->string('category', 40);
                $t->string('number', 80);
                $t->string('label', 255);
                $t->string('domain_id', 20)->nullable();
                $t->string('standard', 80)->nullable();
                $t->text('memory')->nullable();
                $t->timestamps();
                $t->index('category');
                $t->index('domain_id');
            });
        }

        if (!Schema::hasTable('regulations')) {
            Schema::create('regulations', function (Blueprint $t) {
                $t->bigIncrements('id');
                $t->string('reg_key', 80)->unique();
                $t->string('code', 80);
                $t->string('short_name', 120);
                $t->string('category', 80);
                $t->string('domain_id', 20)->nullable();
                $t->text('covers')->nullable();
                $t->longText('key_numbers_json')->nullable();
                $t->longText('common_exam_questions_json')->nullable();
                $t->timestamps();
                $t->index('domain_id');
                $t->index('category');
            });
        }

        if (!Schema::hasTable('flagged_quizzes')) {
            Schema::create('flagged_quizzes', function (Blueprint $t) {
                $t->bigIncrements('id');
                $t->unsignedBigInteger('user_id');
                $t->unsignedBigInteger('quiz_id');
                $t->text('note')->nullable();
                $t->timestamp('created_at')->useCurrent();
                $t->unique(['user_id', 'quiz_id']);
                $t->index('user_id');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('flagged_quizzes');
        Schema::dropIfExists('regulations');
        Schema::dropIfExists('critical_numbers');
        Schema::dropIfExists('calculations');
    }
};
