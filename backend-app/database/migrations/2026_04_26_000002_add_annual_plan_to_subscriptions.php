<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Add 'annual' to the existing enum on `subscriptions.plan` (and subscriptions.coupons.plan if any)
        DB::statement(
            "ALTER TABLE subscriptions
             MODIFY COLUMN plan ENUM('demo','monthly','sixmonth','annual') NOT NULL DEFAULT 'demo'"
        );

        // Coupons table may not have a plan column, but just in case it does and uses the same enum
        try {
            DB::statement(
                "ALTER TABLE coupons
                 MODIFY COLUMN plan ENUM('demo','monthly','sixmonth','annual') NULL"
            );
        } catch (\Throwable $e) {
            // Column doesn't exist — fine, ignore
        }
    }

    public function down(): void
    {
        DB::statement(
            "ALTER TABLE subscriptions
             MODIFY COLUMN plan ENUM('demo','monthly','sixmonth') NOT NULL DEFAULT 'demo'"
        );
        try {
            DB::statement(
                "ALTER TABLE coupons
                 MODIFY COLUMN plan ENUM('demo','monthly','sixmonth') NULL"
            );
        } catch (\Throwable $e) { /* ignore */ }
    }
};
