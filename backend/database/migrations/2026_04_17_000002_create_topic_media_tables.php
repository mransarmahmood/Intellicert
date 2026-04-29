<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // AI-generated discussions/podcasts cached per topic
        Schema::create('topic_discussions', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('topic_id')->nullable();
            $t->string('topic_key', 100);          // string key so it works for legacy JS topic ids too
            $t->string('style', 30)->default('podcast'); // podcast | debate | socratic
            $t->json('dialogue');                  // [{speaker, name, line}]
            $t->unsignedInteger('turn_count')->default(0);
            $t->unsignedInteger('approx_seconds')->default(0);
            $t->string('provider', 30)->default('groq');
            $t->timestamps();
            $t->index(['topic_key', 'style']);
        });

        // AI-generated images cached per topic (Pollinations free tier)
        Schema::create('topic_images', function (Blueprint $t) {
            $t->id();
            $t->string('topic_key', 100);
            $t->string('style', 40)->default('illustration');  // illustration | hero | diagram
            $t->text('prompt');
            $t->string('image_url', 600);
            $t->string('width', 10)->default('768');
            $t->string('height', 10)->default('512');
            $t->string('provider', 30)->default('pollinations');
            $t->timestamps();
            $t->index(['topic_key', 'style']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('topic_discussions');
        Schema::dropIfExists('topic_images');
    }
};
