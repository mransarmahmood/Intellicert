<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Models\QuizCalibration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuizController extends Controller
{
    private function requireAdmin(Request $request): ?JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        if (!$user || !in_array($user->role, ['admin', 'superadmin'])) {
            return response()->json(['success' => false, 'error' => 'Admin access required'], 403);
        }
        return null;
    }

    public function index(Request $request): JsonResponse
    {
        $domainId = $request->input('domain_id');
        $search   = trim((string) $request->input('search', ''));
        $kind     = $request->input('kind');
        $status   = $request->input('status');

        $query = Quiz::with('domain:id,name,number')->orderByDesc('id');

        if ($domainId) $query->where('domain_id', $domainId);
        if ($kind)     $query->where('kind', $kind);
        if ($status)   $query->where('status', $status);
        // Default: hide drafts and retired items from learners. Admins can pass status=draft explicitly.
        $user = $request->attributes->get('auth_user');
        $isAdmin = $user && in_array($user->role, ['admin', 'superadmin']);
        if (!$isAdmin && !$status) {
            $query->where('status', 'live');
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('question', 'like', "%{$search}%")
                  ->orWhere('quiz_key', 'like', "%{$search}%");
            });
        }

        $quizzes = $query->get();
        return response()->json(['success' => true, 'quizzes' => $quizzes, 'total' => $quizzes->count()]);
    }

    /**
     * Validation rules common to store + update.
     */
    private function quizFieldRules(bool $forUpdate, ?int $id = null): array
    {
        $req = $forUpdate ? 'sometimes' : 'required';
        return [
            'quiz_key'            => $forUpdate
                ? 'sometimes|string|max:30|unique:quizzes,quiz_key,' . $id
                : 'required|string|max:30|unique:quizzes,quiz_key',
            'domain_id'           => "$req|string|exists:domains,id",
            'question'            => "$req|string",
            'option_a'            => "$req|string",
            'option_b'            => "$req|string",
            'option_c'            => "$req|string",
            'option_d'            => "$req|string",
            'correct_index'       => "$req|integer|between:0,3",
            'explanation'         => 'nullable|string',
            // Track 1 — 4-component rationale standard
            'option_a_rationale'  => 'nullable|string',
            'option_b_rationale'  => 'nullable|string',
            'option_c_rationale'  => 'nullable|string',
            'option_d_rationale'  => 'nullable|string',
            'common_trap'         => 'nullable|string',
            'memory_hook_topic_id'=> 'nullable|integer|exists:topics,id',
            'bloom_level'         => 'nullable|integer|between:1,6',
            'sub_domain_code'     => 'nullable|string|max:40',
            'status'              => 'nullable|in:draft,live,retired',
            'source_reference'    => 'nullable|string|max:200',
            'difficulty'          => 'nullable|in:easy,medium,hard',
            'kind'                => 'nullable|string|max:20',
            'topic_key'           => 'nullable|string|max:80',
        ];
    }

    public function store(Request $request): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) return $err;
        $data = $request->validate($this->quizFieldRules(false));
        $user = $request->attributes->get('auth_user');
        if (!empty($data['option_a_rationale']) || !empty($data['common_trap'])) {
            $data['last_reviewed_at'] = now();
            $data['last_reviewed_by_user_id'] = $user->id ?? null;
        }
        $quiz = Quiz::create($data);
        return response()->json(['success' => true, 'quiz' => $quiz], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) return $err;

        $quiz = Quiz::find($id);
        if (!$quiz) return response()->json(['success' => false, 'error' => 'Quiz not found'], 404);

        $data = $request->validate($this->quizFieldRules(true, $id));
        $user = $request->attributes->get('auth_user');

        // Touch the SME review audit fields whenever rationale-track content changes.
        $rationaleTouched = collect([
            'option_a_rationale','option_b_rationale','option_c_rationale','option_d_rationale',
            'common_trap','memory_hook_topic_id','source_reference','bloom_level','sub_domain_code',
        ])->some(fn($k) => array_key_exists($k, $data));
        if ($rationaleTouched) {
            $data['last_reviewed_at'] = now();
            $data['last_reviewed_by_user_id'] = $user->id ?? null;
        }

        $quiz->update($data);
        return response()->json(['success' => true, 'quiz' => $quiz->fresh()]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) return $err;

        $quiz = Quiz::find($id);
        if (!$quiz) return response()->json(['success' => false, 'error' => 'Quiz not found'], 404);

        $quiz->delete();
        return response()->json(['success' => true, 'message' => 'Quiz deleted']);
    }

    /**
     * GET /api/admin/quizzes/{id}/calibration
     *
     * Admin-only. Returns the cached psychometric stats from
     * quiz_calibrations (populated nightly by `php artisan calibrate:item-bank`).
     */
    public function calibration(Request $request, int $id): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) return $err;

        $quiz = Quiz::find($id);
        if (!$quiz) return response()->json(['success' => false, 'error' => 'Quiz not found'], 404);

        $calibration = QuizCalibration::where('quiz_id', $id)->first();

        return response()->json([
            'success'     => true,
            'quiz_id'     => $id,
            'calibration' => $calibration ? [
                'attempts'              => (int) $calibration->attempts,
                'p_value'               => $calibration->p_value !== null ? (float) $calibration->p_value : null,
                'discrimination'        => $calibration->discrimination !== null ? (float) $calibration->discrimination : null,
                'distractor_choice_pct' => $calibration->distractor_choice_pct,
                'avg_seconds'           => $calibration->avg_seconds !== null ? (float) $calibration->avg_seconds : null,
                'computed_at'           => $calibration->computed_at,
                'flag'                  => $this->flagItem($calibration),
            ] : null,
        ]);
    }

    /**
     * Returns a short flag string describing the item's psychometric health.
     * Used by the admin UI to highlight items needing SME review.
     */
    private function flagItem(QuizCalibration $c): ?string
    {
        if ($c->attempts < 30) return 'uncalibrated';
        if ($c->p_value !== null && $c->p_value > 0.92) return 'too_easy';
        if ($c->p_value !== null && $c->p_value < 0.25) return 'too_hard';
        if ($c->discrimination !== null && $c->discrimination < 0.2) return 'low_discrimination';
        $picks = $c->distractor_choice_pct ?? [];
        foreach (['a','b','c','d'] as $k) {
            if (isset($picks[$k]) && (float) $picks[$k] > 0 && (float) $picks[$k] < 0.05) {
                return 'dead_distractor';
            }
        }
        return null;
    }
}
