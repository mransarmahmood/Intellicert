<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('user_notes', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedInteger('user_id')->index();
            // Polymorphic reference: ref_type ∈ {topic, concept, flashcard, quiz, formula, regulation}
            $table->string('ref_type', 30);
            $table->string('ref_id', 80); // topic_key, concept id, etc — string to support both numeric IDs and slug keys
            $table->longText('body');
            $table->json('meta')->nullable(); // optional: highlight ranges, color, etc.
            $table->timestamps();

            $table->index(['user_id', 'ref_type', 'ref_id'], 'user_notes_lookup_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_notes');
    }
};
