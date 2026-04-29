<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('content_sources', function (Blueprint $t) {
            $t->id();
            $t->enum('type', ['pdf', 'docx', 'txt', 'image', 'audio', 'video', 'formula', 'other'])
              ->default('other');
            $t->string('title');
            $t->text('description')->nullable();
            $t->string('original_filename');
            $t->string('stored_filename');
            $t->string('mime_type', 100)->nullable();
            $t->unsignedBigInteger('file_size')->default(0);
            $t->string('file_path'); // relative path under storage/app/public/content
            $t->string('thumbnail_path')->nullable();
            $t->json('domain_ids')->nullable();     // which CSP domains this relates to
            $t->json('cert_keys')->nullable();      // which certs (csp, asp, ohst, etc.)
            $t->json('tags')->nullable();           // array of free-form tags
            $t->longText('extracted_text')->nullable(); // raw text for PDFs/DOCX/TXT
            $t->unsignedInteger('chunk_count')->default(0);
            $t->unsignedInteger('page_count')->nullable();
            $t->unsignedInteger('duration_seconds')->nullable(); // audio/video
            $t->string('author')->nullable();
            $t->string('publisher')->nullable();
            $t->year('publish_year')->nullable();
            $t->enum('status', ['uploading', 'processing', 'ready', 'failed'])->default('ready');
            $t->text('processing_error')->nullable();
            $t->unsignedBigInteger('uploaded_by')->nullable();
            $t->timestamps();

            $t->index(['type', 'status']);
            $t->index('uploaded_by');
        });

        Schema::create('content_chunks', function (Blueprint $t) {
            $t->id();
            $t->foreignId('source_id')->constrained('content_sources')->cascadeOnDelete();
            $t->unsignedInteger('chunk_index');
            $t->unsignedInteger('page_number')->nullable();
            $t->string('heading')->nullable();   // parsed section heading if any
            $t->text('text');
            $t->unsignedInteger('text_length')->default(0);
            $t->json('keywords')->nullable();    // auto-extracted keywords for matching
            $t->timestamps();

            $t->index(['source_id', 'chunk_index']);
            $t->fullText(['text']); // MySQL 8+ full-text index for search
        });

        // Many-to-many: which content sources are linked to which topics
        Schema::create('content_topic_links', function (Blueprint $t) {
            $t->id();
            $t->foreignId('source_id')->constrained('content_sources')->cascadeOnDelete();
            $t->unsignedBigInteger('topic_id');
            $t->unsignedInteger('relevance_score')->default(0); // 0-100
            $t->string('link_type', 32)->default('reference'); // reference | citation | embedded
            $t->json('cited_pages')->nullable();
            $t->timestamps();

            $t->unique(['source_id', 'topic_id']);
            $t->index('topic_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_topic_links');
        Schema::dropIfExists('content_chunks');
        Schema::dropIfExists('content_sources');
    }
};
