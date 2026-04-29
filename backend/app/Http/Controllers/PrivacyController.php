<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PrivacyController extends Controller
{
    private const USER_SCOPED_TABLES = [
        'subscriptions',
        'card_reviews',
        'quiz_attempts',
        'learning_events',
        'concept_mastery',
        'study_plans',
        'flagged_quizzes',
        'user_certificates',
        'self_assessments',
        'user_enrollments',
        'user_xp_ledger',
        'user_gamification_state',
        'concept_memory_profiles',
        'user_flashcard_reviews',
        'daily_review_queues',
        'memory_events',
        'gamification_profiles',
        'xp_events',
        'user_badges',
        'user_missions',
        'achievement_events',
        'privacy_requests',
    ];

    private function isPrivileged(object $user): bool
    {
        return in_array($user->role ?? '', ['admin', 'superadmin'], true);
    }

    private function visibleRequestQuery(object $user)
    {
        $query = DB::table('privacy_requests')->orderByDesc('requested_at');
        if (!$this->isPrivileged($user)) {
            $query->where('user_id', $user->id);
        }
        return $query;
    }

    public function export(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $bundle = [
            'generated_at' => now()->toIso8601String(),
            'subject' => [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $user->name,
                'role' => $user->role,
                'email_verified' => (bool) $user->email_verified,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ],
            'records' => [],
        ];

        foreach (self::USER_SCOPED_TABLES as $table) {
            if (!Schema::hasTable($table) || !Schema::hasColumn($table, 'user_id')) {
                continue;
            }

            $bundle['records'][$table] = DB::table($table)
                ->where('user_id', $user->id)
                ->orderByDesc(Schema::hasColumn($table, 'id') ? 'id' : 'user_id')
                ->limit(5000)
                ->get();
        }

        return response()->json([
            'success' => true,
            'data_subject_export' => $bundle,
        ]);
    }

    public function deleteRequest(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        if (!Schema::hasTable('privacy_requests')) {
            return response()->json(['success' => false, 'error' => 'Privacy request table is not available. Run migrations.'], 503);
        }

        $data = $request->validate([
            'reason' => 'nullable|string|max:2000',
        ]);

        $open = DB::table('privacy_requests')
            ->where('user_id', $user->id)
            ->where('request_type', 'delete')
            ->whereIn('status', ['open', 'in_review'])
            ->first();

        if ($open) {
            return response()->json([
                'success' => true,
                'privacy_request' => $open,
                'message' => 'A deletion request is already open for this account.',
            ], 200);
        }

        $id = DB::table('privacy_requests')->insertGetId([
            'user_id' => $user->id,
            'request_type' => 'delete',
            'status' => 'open',
            'reason' => $data['reason'] ?? null,
            'requested_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $row = DB::table('privacy_requests')->where('id', $id)->first();

        return response()->json([
            'success' => true,
            'privacy_request' => $row,
            'message' => 'Deletion request received for administrator review.',
        ], 201);
    }

    public function requests(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');

        if (!Schema::hasTable('privacy_requests')) {
            return response()->json(['success' => true, 'privacy_requests' => []]);
        }

        $limit = min(200, max(10, (int) $request->input('limit', 50)));
        $rows = $this->visibleRequestQuery($user)->limit($limit)->get();

        return response()->json([
            'success' => true,
            'privacy_requests' => $rows,
        ]);
    }

    public function updateRequest(Request $request, int $id): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        if (!Schema::hasTable('privacy_requests')) {
            return response()->json(['success' => false, 'error' => 'Privacy request table is not available. Run migrations.'], 503);
        }

        if (!$this->isPrivileged($user)) {
            return response()->json(['success' => false, 'error' => 'Admin access required'], 403);
        }

        $data = $request->validate([
            'status' => 'required|in:open,in_review,completed,rejected',
            'admin_notes' => 'nullable|string|max:4000',
        ]);

        $updates = [
            'status' => $data['status'],
            'admin_notes' => $data['admin_notes'] ?? null,
            'handled_by' => $user->id,
            'updated_at' => now(),
        ];

        if (in_array($data['status'], ['completed', 'rejected'], true)) {
            $updates['fulfilled_at'] = now();
        }

        $updated = DB::table('privacy_requests')->where('id', $id)->update($updates);
        if (!$updated) {
            return response()->json(['success' => false, 'error' => 'Privacy request not found'], 404);
        }

        return response()->json([
            'success' => true,
            'privacy_request' => DB::table('privacy_requests')->where('id', $id)->first(),
        ]);
    }
}
