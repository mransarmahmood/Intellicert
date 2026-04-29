<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasColumn('quizzes', 'kind')) {
            Schema::table('quizzes', function (Blueprint $t) {
                $t->string('kind', 20)->default('regular')->index();
            });
        }
        if (!Schema::hasColumn('quizzes', 'topic_key')) {
            Schema::table('quizzes', function (Blueprint $t) {
                $t->string('topic_key', 80)->nullable()->index();
            });
        }
        if (!Schema::hasColumn('quizzes', 'difficulty')) {
            Schema::table('quizzes', function (Blueprint $t) {
                $t->string('difficulty', 20)->default('medium');
            });
        }
    }

    public function down(): void
    {
        Schema::table('quizzes', function (Blueprint $t) {
            if (Schema::hasColumn('quizzes', 'kind'))       $t->dropColumn('kind');
            if (Schema::hasColumn('quizzes', 'topic_key'))  $t->dropColumn('topic_key');
            if (Schema::hasColumn('quizzes', 'difficulty')) $t->dropColumn('difficulty');
        });
    }
};
