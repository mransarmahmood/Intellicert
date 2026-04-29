<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    private function requireSuperadmin(Request $request): ?JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        if (!$user || $user->role !== 'superadmin') {
            return response()->json(['success' => false, 'error' => 'Superadmin access required'], 403);
        }
        return null;
    }

    public function listUsers(Request $request): JsonResponse
    {
        if ($err = $this->requireSuperadmin($request)) return $err;

        $search = trim((string) $request->input('search', ''));
        $page   = max(1, (int) $request->input('page', 1));
        $limit  = min(100, max(10, (int) $request->input('limit', 50)));

        $query = User::query();
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('email', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%");
            });
        }

        $total = (clone $query)->count();

        // Latest subscription per user
        $users = $query
            ->orderByDesc('id')
            ->offset(($page - 1) * $limit)
            ->limit($limit)
            ->get(['id', 'email', 'name', 'role', 'created_at'])
            ->map(function ($u) {
                $sub = DB::table('subscriptions')
                    ->where('user_id', $u->id)
                    ->orderByDesc('id')
                    ->first(['plan', 'status', 'expires_at']);
                return [
                    'id'          => $u->id,
                    'email'       => $u->email,
                    'name'        => $u->name,
                    'role'        => $u->role,
                    'created_at'  => $u->created_at,
                    'plan'        => $sub->plan ?? null,
                    'sub_status'  => $sub->status ?? null,
                    'sub_expires' => $sub->expires_at ?? null,
                ];
            });

        return response()->json([
            'success' => true,
            'users'   => $users,
            'total'   => $total,
            'page'    => $page,
            'limit'   => $limit,
        ]);
    }

    public function createUser(Request $request): JsonResponse
    {
        if ($err = $this->requireSuperadmin($request)) return $err;

        $data = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string|min:6',
            'name'     => 'nullable|string|max:255',
            'role'     => 'nullable|in:user,admin,superadmin',
        ]);

        if (User::where('email', $data['email'])->exists()) {
            return response()->json(['success' => false, 'error' => 'Email already registered'], 409);
        }

        $user = User::create([
            'email'         => $data['email'],
            'password_hash' => password_hash($data['password'], PASSWORD_DEFAULT),
            'name'          => $data['name'] ?? null,
            'role'          => $data['role'] ?? 'user',
            'email_verified' => 0,
        ]);

        return response()->json([
            'success' => true,
            'user_id' => $user->id,
            'message' => 'User created',
        ], 201);
    }

    public function updateRole(Request $request): JsonResponse
    {
        if ($err = $this->requireSuperadmin($request)) return $err;

        $data = $request->validate([
            'user_id' => 'required|integer',
            'role'    => 'required|in:user,admin,superadmin',
        ]);

        $authUser = $request->attributes->get('auth_user');
        if ((int) $data['user_id'] === (int) $authUser->id) {
            return response()->json(['success' => false, 'error' => 'Cannot change your own role'], 400);
        }

        $target = User::find($data['user_id']);
        if (!$target) {
            return response()->json(['success' => false, 'error' => 'User not found'], 404);
        }

        $target->update(['role' => $data['role']]);
        return response()->json(['success' => true, 'message' => 'Role updated to ' . $data['role']]);
    }

    /**
     * PATCH /api/admin/users/{id}
     * Update name / email for a user. Superadmin only.
     */
    public function updateUser(Request $request, int $id): JsonResponse
    {
        if ($err = $this->requireSuperadmin($request)) return $err;

        $data = $request->validate([
            'name'  => 'nullable|string|max:100',
            'email' => 'nullable|email|max:255',
        ]);

        $target = User::find($id);
        if (!$target) return response()->json(['success' => false, 'error' => 'User not found'], 404);

        // Email-uniqueness check
        if (!empty($data['email']) && $data['email'] !== $target->email) {
            if (User::where('email', $data['email'])->where('id', '!=', $id)->exists()) {
                return response()->json(['success' => false, 'error' => 'Email already in use'], 422);
            }
        }

        $updates = array_filter($data, fn ($v) => $v !== null && $v !== '');
        if ($updates) $target->update($updates);

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $target->id,
                'email' => $target->email,
                'name' => $target->name,
                'role' => $target->role,
            ],
        ]);
    }

    /**
     * POST /api/admin/users/{id}/password
     * Reset a user's password. Superadmin only.
     */
    public function resetPassword(Request $request, int $id): JsonResponse
    {
        if ($err = $this->requireSuperadmin($request)) return $err;

        $data = $request->validate([
            'password' => 'required|string|min:8|max:100',
        ]);

        $target = User::find($id);
        if (!$target) return response()->json(['success' => false, 'error' => 'User not found'], 404);

        $target->update(['password_hash' => Hash::make($data['password'])]);

        // Invalidate all existing sessions for this user for safety
        DB::table('user_sessions')->where('user_id', $id)->update(['is_active' => 0]);

        return response()->json(['success' => true, 'message' => 'Password reset; existing sessions revoked']);
    }

    /**
     * POST /api/admin/users/{id}/subscription
     * Set/update a user's subscription (plan, status, expiry).
     */
    public function setSubscription(Request $request, int $id): JsonResponse
    {
        if ($err = $this->requireSuperadmin($request)) return $err;

        $data = $request->validate([
            'plan'   => 'required|in:demo,monthly,sixmonth,annual',
            'status' => 'nullable|in:active,expired,cancelled',
            'duration_days' => 'nullable|integer|min:0|max:3650',
            'amount_paid' => 'nullable|numeric|min:0',
        ]);

        $target = User::find($id);
        if (!$target) return response()->json(['success' => false, 'error' => 'User not found'], 404);

        $defaultDays = ['monthly' => 30, 'sixmonth' => 180, 'annual' => 365, 'demo' => 7];
        $days = $data['duration_days'] ?? ($defaultDays[$data['plan']] ?? 7);
        $expires = $days > 0 ? now()->addDays($days) : null;

        // Mark any existing subscriptions cancelled
        DB::table('subscriptions')->where('user_id', $id)->update([
            'status' => 'cancelled',
        ]);

        // Insert new subscription
        $subId = DB::table('subscriptions')->insertGetId([
            'user_id' => $id,
            'plan' => $data['plan'],
            'status' => $data['status'] ?? 'active',
            'started_at' => now(),
            'expires_at' => $expires,
            'amount_paid' => $data['amount_paid'] ?? 0,
        ]);

        return response()->json([
            'success' => true,
            'subscription' => [
                'id' => $subId,
                'plan' => $data['plan'],
                'status' => $data['status'] ?? 'active',
                'expires_at' => $expires,
            ],
        ]);
    }

    /**
     * POST /api/admin/users/{id}/impersonate
     * Mint a short-lived session token that authenticates as the target user.
     * Superadmin only. The minted token is marked with device_info='impersonated:by={admin_id}'
     * so an audit trail is preserved. Existing admin session is left alone.
     */
    public function impersonate(Request $request, int $id): JsonResponse
    {
        if ($err = $this->requireSuperadmin($request)) return $err;

        $admin = $request->attributes->get('auth_user');
        if ((int) $id === (int) $admin->id) {
            return response()->json(['success' => false, 'error' => 'Cannot impersonate yourself'], 400);
        }

        $target = User::find($id);
        if (!$target) {
            return response()->json(['success' => false, 'error' => 'User not found'], 404);
        }

        $token = bin2hex(random_bytes(40)); // 80-char hex
        $expiresAt = now()->addHours(2); // short-lived

        DB::table('user_sessions')->insert([
            'user_id'       => $target->id,
            'session_token' => $token,
            'device_info'   => 'impersonated:by=' . $admin->id . ':' . ($admin->email ?? 'admin'),
            'ip_address'    => $request->ip(),
            'created_at'    => now(),
            'expires_at'    => $expiresAt,
            'is_active'     => 1,
        ]);

        // Best-effort audit log
        try {
            DB::table('activity_log')->insert([
                'action'      => 'impersonate_start',
                'entity_type' => 'user',
                'entity_id'   => $target->id,
                'details'     => json_encode([
                    'admin_id'    => $admin->id,
                    'admin_email' => $admin->email,
                    'target_email'=> $target->email,
                    'ip_address'  => $request->ip(),
                ]),
                'created_at'  => now(),
            ]);
        } catch (\Throwable $e) { /* ignore if schema mismatch */ }

        return response()->json([
            'success' => true,
            'token'   => $token,
            'expires_at' => $expiresAt,
            'user' => [
                'id'    => $target->id,
                'email' => $target->email,
                'name'  => $target->name,
                'role'  => $target->role,
            ],
            'impersonated_by' => [
                'id'    => $admin->id,
                'email' => $admin->email,
            ],
        ]);
    }

    /**
     * DELETE /api/admin/users/{id}
     * Hard-delete a user and their sessions. Superadmin only.
     */
    public function deleteUser(Request $request, int $id): JsonResponse
    {
        if ($err = $this->requireSuperadmin($request)) return $err;

        $authUser = $request->attributes->get('auth_user');
        if ((int) $id === (int) $authUser->id) {
            return response()->json(['success' => false, 'error' => 'Cannot delete your own account'], 400);
        }

        $target = User::find($id);
        if (!$target) return response()->json(['success' => false, 'error' => 'User not found'], 404);

        // Cascade manually for safety (sessions cascade via FK; subscriptions cascade)
        DB::table('user_sessions')->where('user_id', $id)->delete();
        DB::table('subscriptions')->where('user_id', $id)->delete();
        $target->delete();

        return response()->json(['success' => true, 'message' => 'User deleted']);
    }

    public function dashboardStats(Request $request): JsonResponse
    {
        if ($err = $this->requireSuperadmin($request)) return $err;

        $totalUsers = (int) DB::table('users')->count();

        $activeSubscribers = (int) DB::table('subscriptions')
            ->where('status', 'active')
            ->where('plan', '!=', 'demo')
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->distinct('user_id')
            ->count('user_id');

        $demoUsers = (int) DB::table('subscriptions')
            ->where('status', 'active')
            ->where('plan', 'demo')
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->distinct('user_id')
            ->count('user_id');

        $totalRevenue = (float) DB::table('payments')
            ->where('status', 'completed')
            ->sum('amount');

        $monthRevenue = (float) DB::table('payments')
            ->where('status', 'completed')
            ->whereRaw('MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())')
            ->sum('amount');

        $recentUsers = DB::table('users')
            ->orderByDesc('id')
            ->limit(10)
            ->get(['id', 'email', 'name', 'role', 'created_at']);

        $recentSubscriptions = DB::table('subscriptions as s')
            ->join('users as u', 'u.id', '=', 's.user_id')
            ->where('s.plan', '!=', 'demo')
            ->orderByDesc('s.id')
            ->limit(10)
            ->get(['s.id', 's.plan', 's.status', 's.started_at', 's.expires_at', 's.amount_paid', 'u.email', 'u.name']);

        return response()->json([
            'success' => true,
            'stats'   => [
                'total_users'        => $totalUsers,
                'active_subscribers' => $activeSubscribers,
                'demo_users'         => $demoUsers,
                'total_revenue'      => $totalRevenue,
                'month_revenue'      => $monthRevenue,
            ],
            'recent_users'         => $recentUsers,
            'recent_subscriptions' => $recentSubscriptions,
        ]);
    }
}
