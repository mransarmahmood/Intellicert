<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Mastery Track scaffolding — Phase 1.
 *
 * 9 high-yield, advanced-technique categories that sit beside the standard
 * topic library and gate to premium tiers. Categories are the navigation
 * spine of the Mastery Library.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('mastery_categories', function (Blueprint $t) {
            $t->id();
            $t->string('code', 8)->unique();        // 'M1', 'M2', …
            $t->string('name', 120);
            $t->string('short_name', 60)->nullable();
            $t->text('description')->nullable();
            $t->unsignedInteger('topic_count_target')->default(0);
            $t->string('priority', 4)->default('P3'); // P1..P4
            $t->unsignedInteger('sort_order')->default(0);
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mastery_categories');
    }
};
