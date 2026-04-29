<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExamPrepController extends Controller
{
    // ─── Calculations ────────────────────────────────────────
    public function calculations(Request $request): JsonResponse
    {
        $domainId = $request->input('domain_id');
        $category = $request->input('category');
        $q = DB::table('calculations')->orderBy('id');
        if ($domainId) $q->where('domain_id', $domainId);
        if ($category) $q->where('category', $category);
        $rows = $q->get()->map(fn ($r) => [
            'id'             => $r->id,
            'calc_key'       => $r->calc_key,
            'domain_id'      => $r->domain_id,
            'category'       => $r->category,
            'difficulty'     => $r->difficulty,
            'title'          => $r->title,
            'problem'        => $r->problem,
            'formula'        => $r->formula,
            'variables'      => $r->variables_json ? json_decode($r->variables_json, true) : null,
            'steps'          => $r->steps_json ? json_decode($r->steps_json, true) : null,
            'answer'         => $r->answer !== null ? (float) $r->answer : null,
            'answer_unit'    => $r->answer_unit,
            'tolerance'      => (float) $r->tolerance,
            'interpretation' => $r->interpretation,
            'exam_tip'       => $r->exam_tip,
        ]);
        return response()->json(['success' => true, 'calculations' => $rows, 'total' => $rows->count()]);
    }

    // ─── Critical numbers ────────────────────────────────────
    public function criticalNumbers(Request $request): JsonResponse
    {
        $category = $request->input('category');
        $domainId = $request->input('domain_id');
        $q = DB::table('critical_numbers')->orderBy('category')->orderBy('id');
        if ($category) $q->where('category', $category);
        if ($domainId) $q->where('domain_id', $domainId);
        $rows = $q->get();
        return response()->json(['success' => true, 'numbers' => $rows, 'total' => $rows->count()]);
    }

    // ─── Formula guide (read directly from seed.json) ───────
    public function formulaGuide(): JsonResponse
    {
        $path = database_path('seed.json');
        if (!file_exists($path)) {
            return response()->json(['success' => false, 'error' => 'Formula guide not seeded'], 404);
        }
        $seed = json_decode(file_get_contents($path), true);
        $guide = $seed['formulaGuide'] ?? null;
        if (!$guide) {
            return response()->json(['success' => false, 'error' => 'Formula guide missing'], 404);
        }
        return response()->json(['success' => true, 'guide' => $guide]);
    }

    // ─── Regulations ─────────────────────────────────────────
    public function regulations(Request $request): JsonResponse
    {
        $category = $request->input('category');
        $domainId = $request->input('domain_id');
        $q = DB::table('regulations')->orderBy('category')->orderBy('id');
        if ($category) $q->where('category', $category);
        if ($domainId) $q->where('domain_id', $domainId);
        $rows = $q->get()->map(fn ($r) => [
            'id'                    => $r->id,
            'code'                  => $r->code,
            'short_name'            => $r->short_name,
            'category'              => $r->category,
            'domain_id'             => $r->domain_id,
            'covers'                => $r->covers,
            'key_numbers'           => $r->key_numbers_json ? json_decode($r->key_numbers_json, true) : [],
            'common_exam_questions' => $r->common_exam_questions_json ? json_decode($r->common_exam_questions_json, true) : [],
        ]);
        return response()->json(['success' => true, 'regulations' => $rows, 'total' => $rows->count()]);
    }

    // ─── Flagged quizzes (per user) ──────────────────────────
    public function flagged(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $rows = DB::table('flagged_quizzes as fq')
            ->join('quizzes as q', 'q.id', '=', 'fq.quiz_id')
            ->where('fq.user_id', $user->id)
            ->orderByDesc('fq.created_at')
            ->select(
                'q.id', 'q.quiz_key', 'q.domain_id', 'q.question',
                'q.option_a', 'q.option_b', 'q.option_c', 'q.option_d',
                'q.correct_index', 'q.explanation',
                'fq.note', 'fq.created_at as flagged_at'
            )
            ->get();
        return response()->json(['success' => true, 'quizzes' => $rows, 'total' => $rows->count()]);
    }

    public function flag(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $data = $request->validate([
            'quiz_id' => 'required|integer|exists:quizzes,id',
            'note'    => 'nullable|string|max:500',
        ]);
        DB::table('flagged_quizzes')->updateOrInsert(
            ['user_id' => $user->id, 'quiz_id' => $data['quiz_id']],
            ['note' => $data['note'] ?? null, 'created_at' => now()]
        );
        return response()->json(['success' => true]);
    }

    public function unflag(Request $request, int $quizId): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        DB::table('flagged_quizzes')
            ->where('user_id', $user->id)
            ->where('quiz_id', $quizId)
            ->delete();
        return response()->json(['success' => true]);
    }
}
