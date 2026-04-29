<?php

namespace App\Http\Controllers;

use App\Models\AppSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class SettingsController extends Controller
{
    private const DEFAULTS = [
        'price_monthly'          => '12.00',
        'price_sixmonth'         => '60.00',
        'currency'               => 'USD',
        'trial_days'             => '7',
        'app_name'               => 'IntelliCert',
        'allow_registration'     => '1',
        'maintenance_mode'       => '0',
        'stripe_publishable_key' => '',
        'stripe_secret_key'      => '',
        'stripe_webhook_secret'  => '',
        'paypal_client_id'       => '',
        'paypal_secret'          => '',
        'paypal_mode'            => 'sandbox',
        'smtp_from_email'        => 'noreply@intellicert.com',
        'smtp_from_name'         => 'IntelliCert',
        'smtp_host'              => '',
        'smtp_port'              => '587',
        'smtp_username'          => '',
        'smtp_password'          => '',
        'smtp_encryption'        => 'tls',
        'email_enabled'          => '0',
    ];

    private const SECRET_KEYS = ['stripe_secret_key', 'stripe_webhook_secret', 'paypal_secret', 'smtp_password'];

    private function requireSuperadmin(Request $request): ?JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        if (!$user || $user->role !== 'superadmin') {
            return response()->json(['success' => false, 'error' => 'Superadmin access required'], 403);
        }
        return null;
    }

    private function ensureTable(): void
    {
        if (!Schema::hasTable('app_settings')) {
            Schema::create('app_settings', function ($t) {
                $t->string('setting_key', 100)->primary();
                $t->text('setting_value');
                $t->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            });
        }
    }

    public function index(Request $request): JsonResponse
    {
        if ($err = $this->requireSuperadmin($request)) return $err;

        $this->ensureTable();
        $stored = AppSetting::all()->pluck('setting_value', 'setting_key')->toArray();
        $merged = array_merge(self::DEFAULTS, $stored);

        // Mask secrets — show only whether they're set
        foreach (self::SECRET_KEYS as $k) {
            if (!empty($merged[$k])) {
                $merged[$k . '_set'] = true;
                $merged[$k] = '••••••••';
            } else {
                $merged[$k . '_set'] = false;
            }
        }

        return response()->json(['success' => true, 'settings' => $merged]);
    }

    public function update(Request $request): JsonResponse
    {
        if ($err = $this->requireSuperadmin($request)) return $err;

        $this->ensureTable();

        $payload = $request->input('settings', []);
        if (!is_array($payload)) {
            return response()->json(['success' => false, 'error' => 'settings must be an object'], 400);
        }

        $allowed = array_keys(self::DEFAULTS);
        $updated = [];
        foreach ($payload as $k => $v) {
            if (!in_array($k, $allowed, true)) continue;
            // Don't overwrite secrets with the masked placeholder
            if (in_array($k, self::SECRET_KEYS, true) && $v === '••••••••') continue;
            AppSetting::updateOrCreate(
                ['setting_key' => $k],
                ['setting_value' => (string) $v]
            );
            $updated[] = $k;
        }

        return response()->json(['success' => true, 'updated' => $updated]);
    }
}
