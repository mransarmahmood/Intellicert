<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('study_plans')) {
            Schema::create('study_plans', function (Blueprint $t) {
                $t->bigIncrements('id');
                $t->unsignedBigInteger('user_id');
                $t->date('exam_date')->nullable();
                $t->integer('weeks')->default(8);
                $t->integer('hours_per_week')->default(10);
                $t->longText('plan_json'); // [{week, focus_domain, tasks: []}]
                $t->timestamps();
                $t->unique('user_id');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('study_plans');
    }
};
