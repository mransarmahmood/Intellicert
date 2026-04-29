<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('coupons', function (Blueprint $table) {
            $table->boolean('is_gift')->default(false)->after('is_active');
            $table->string('recipient_email', 255)->nullable()->after('is_gift');
            $table->string('recipient_name', 120)->nullable()->after('recipient_email');
            $table->string('sender_name', 120)->nullable()->after('recipient_name');
            $table->string('gift_message', 500)->nullable()->after('sender_name');
            $table->timestamp('redeemed_at')->nullable()->after('gift_message');
            $table->unsignedInteger('redeemed_by_user_id')->nullable()->after('redeemed_at');
        });

        // Extend plan_type enum to include annual + a single-cert "gift" passthrough
        DB::statement(
            "ALTER TABLE coupons
             MODIFY COLUMN plan_type ENUM('monthly','sixmonth','annual','both') NULL DEFAULT 'both'"
        );
    }

    public function down(): void
    {
        Schema::table('coupons', function (Blueprint $table) {
            $table->dropColumn([
                'is_gift', 'recipient_email', 'recipient_name',
                'sender_name', 'gift_message', 'redeemed_at', 'redeemed_by_user_id',
            ]);
        });
        DB::statement(
            "ALTER TABLE coupons
             MODIFY COLUMN plan_type ENUM('monthly','sixmonth','both') NULL DEFAULT 'both'"
        );
    }
};
