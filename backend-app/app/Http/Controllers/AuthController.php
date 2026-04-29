<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use App\Models\User;
use App\Models\UserSession;
use App\Services\MailService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string|min:6',
            'name'     => 'nullable|string|max:255',
        ]);

        if (User::where('email', $data['email'])->exists()) {
            return response()->json(['success' => false, 'error' => 'Email already registered'], 409);
        }

        return DB::transaction(function () use ($data, $request) {
            $verifyCode = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            $user = User::create([
                'email'         => $data['email'],
                'password_hash' => password_hash($data['password'], PASSWORD_DEFAULT),
                'name'          => $data['name'] ?? null,
                'role'          => 'user',
                'email_verified' => 0,
                'email_verify_code'    => $verifyCode,
                'email_verify_expires' => now()->addHours(24),
            ]);

            Subscription::create([
                'user_id'    => $user->id,
                'plan'       => 'demo',
                'status'     => 'active',
                'started_at' => now(),
                'expires_at' => now()->addDays(7),
            ]);

            $token = bin2hex(random_bytes(64));
            UserSession::create([
                'user_id'       => $user->id,
                'session_token' => $token,
                'device_info'   => $request->userAgent() ?? 'unknown',
                'ip_address'    => $request->ip() ?? '0.0.0.0',
                'is_active'     => 1,
                'expires_at'    => now()->addDays(30),
            ]);

            // Fire welcome + verify-code emails (non-blocking — never break signup)
            MailService::send($user->email, $user->name ?? '', 'Welcome to IntelliCert!', MailService::welcomeBody($user->name));
            MailService::send($user->email, $user->name ?? '', 'IntelliCert — Verify your email', MailService::verifyBody($verifyCode));

            return response()->json([
                'success' => true,
                'token'   => $token,
                'user'    => [
                    'id'             => $user->id,
                    'email'          => $user->email,
                    'name'           => $user->name,
                    'role'           => $user->role,
                    'email_verified' => false,
                ],
                'subscription' => ['plan' => 'demo', 'status' => 'active'],
            ], 201);
        });
    }

    /**
     * POST /api/auth/verify-email
     * body: { code }
     * Validates the 6-digit code stored on the user record.
     */
    public function verifyEmail(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $data = $request->validate(['code' => 'required|string|size:6']);

        if (!$user->email_verify_code || $user->email_verify_code !== $data['code']) {
            return response()->json(['success' => false, 'error' => 'Incorrect verification code'], 400);
        }
        if ($user->email_verify_expires && now()->greaterThan($user->email_verify_expires)) {
            return response()->json(['success' => false, 'error' => 'Verification code expired'], 400);
        }
        $user->update([
            'email_verified'        => 1,
            'email_verify_code'     => null,
            'email_verify_expires'  => null,
        ]);
        return response()->json(['success' => true]);
    }

    /**
     * POST /api/auth/resend-verification
     * Generates a fresh code and emails it to the current user.
     */
    public function resendVerification(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        if ($user->email_verified) {
            return response()->json(['success' => true, 'message' => 'Already verified']);
        }
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $user->update([
            'email_verify_code'    => $code,
            'email_verify_expires' => now()->addHours(24),
        ]);
        MailService::send($user->email, $user->name ?? '', 'IntelliCert — Verify your email', MailService::verifyBody($code));
        return response()->json(['success' => true]);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $data['email'])->first();

        if (!$user || !password_verify($data['password'], $user->password_hash)) {
            return response()->json(['success' => false, 'error' => 'Invalid email or password'], 401);
        }

        // Single-device enforcement (matches legacy behaviour)
        UserSession::where('user_id', $user->id)
            ->where('is_active', 1)
            ->update(['is_active' => 0]);

        $token = bin2hex(random_bytes(64));
        UserSession::create([
            'user_id'       => $user->id,
            'session_token' => $token,
            'device_info'   => $request->userAgent() ?? 'unknown',
            'ip_address'    => $request->ip() ?? '0.0.0.0',
            'is_active'     => 1,
            'expires_at'    => now()->addDays(30),
        ]);

        return response()->json([
            'success'      => true,
            'token'        => $token,
            'user'         => [
                'id'             => $user->id,
                'email'          => $user->email,
                'name'           => $user->name,
                'role'           => $user->role,
                'email_verified' => (bool) $user->email_verified,
            ],
            'subscription' => $user->latestSubscription(),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $session = $request->attributes->get('auth_session');
        if ($session) {
            $session->update(['is_active' => 0]);
        }
        return response()->json(['success' => true]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        return response()->json([
            'success' => true,
            'user'    => [
                'id'             => $user->id,
                'email'          => $user->email,
                'name'           => $user->name,
                'role'           => $user->role,
                'email_verified' => (bool) $user->email_verified,
            ],
            'subscription' => $user->latestSubscription(),
        ]);
    }
}
