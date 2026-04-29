<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('privacy_requests')) {
            Schema::create('privacy_requests', function (Blueprint $t) {
                $t->bigIncrements('id');
                $t->unsignedBigInteger('user_id');
                $t->enum('request_type', ['access', 'export', 'delete', 'correction'])->default('delete');
                $t->enum('status', ['open', 'in_review', 'completed', 'rejected'])->default('open');
                $t->text('reason')->nullable();
                $t->text('admin_notes')->nullable();
                $t->unsignedBigInteger('handled_by')->nullable();
                $t->timestamp('requested_at')->useCurrent();
                $t->timestamp('fulfilled_at')->nullable();
                $t->timestamps();

                $t->index('user_id');
                $t->index(['status', 'request_type']);
                $t->index('requested_at');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('privacy_requests');
    }
};
