<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class PlanController extends Controller
{
    /**
     * GET /api/study-plan
     * Returns the user's saved plan, or null if none.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $row = DB::table('study_plans')->where('user_id', $user->id)->first();
        if (!$row) {
            return response()->json(['success' => true, 'plan' => null]);
        }
        return response()->json([
            'success' => true,
            'plan' => [
                'exam_date'      => $row->exam_date,
                'weeks'          => (int) $row->weeks,
                'hours_per_week' => (int) $row->hours_per_week,
                'plan'           => json_decode($row->plan_json, true),
                'updated_at'     => $row->updated_at,
            ],
        ]);
    }

    /**
     * POST /api/study-plan
     * body: { exam_date, hours_per_week }
     * Auto-generates a week-by-week plan based on the seeded domains.
     */
    public function generate(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $data = $request->validate([
            'exam_date'       => 'nullable|date|after:today',
            'hours_per_week'  => 'required|integer|min:1|max:60',
        ]);

        $examDate = $data['exam_date'] ? Carbon::parse($data['exam_date']) : Carbon::today()->addWeeks(8);
        $weeks = max(1, min(26, Carbon::today()->diffInWeeks($examDate)));
        if ($weeks < 1) $weeks = 1;
        $hoursPerWeek = (int) $data['hours_per_week'];

        // Pull domains in order with their weights
        $domains = DB::table('domains')->orderBy('number')->get();
        $totalWeight = max(1, $domains->sum('weight'));

        // Distribute weeks across domains proportional to weight, plus a final review week
        $reviewWeeks = $weeks >= 6 ? 2 : 1;
        $studyWeeks  = max(1, $weeks - $reviewWeeks);

        // Compute weeks per domain (at least 1 each if room allows)
        $allocs = [];
        $remaining = $studyWeeks;
        foreach ($domains as $d) {
            $share = (int) round(($d->weight / $totalWeight) * $studyWeeks);
            $allocs[$d->id] = max(1, $share);
        }
        // Trim/expand to match studyWeeks total
        $sumAlloc = array_sum($allocs);
        while ($sumAlloc > $studyWeeks) {
            // shrink the largest
            $largest = array_keys($allocs, max($allocs))[0];
            if ($allocs[$largest] > 1) { $allocs[$largest]--; $sumAlloc--; }
            else break;
        }
        while ($sumAlloc < $studyWeeks) {
            $largest = array_keys($allocs, max($allocs))[0];
            $allocs[$largest]++;
            $sumAlloc++;
        }

        // Build the week-by-week plan
        $plan = [];
        $weekNum = 1;
        $cursor = Carbon::today();

        foreach ($domains as $d) {
            $domTopics = DB::table('topics')->where('domain_id', $d->id)->orderBy('sort_order')->pluck('name', 'id')->toArray();
            $weeksForDomain = $allocs[$d->id] ?? 1;
            $topicChunks = array_chunk($domTopics, max(1, (int) ceil(count($domTopics) / $weeksForDomain)), true);

            for ($w = 0; $w < $weeksForDomain; $w++) {
                $weekStart = $cursor->copy();
                $weekEnd   = $cursor->copy()->addDays(6);
                $cursor->addDays(7);

                $topicsThisWeek = $topicChunks[$w] ?? [];
                $tasks = [];
                foreach ($topicsThisWeek as $tid => $tname) {
                    $tasks[] = ['type' => 'topic',     'topic_id' => $tid, 'label' => "Read &amp; learn: {$tname}"];
                    $tasks[] = ['type' => 'flashcards','topic_id' => $tid, 'label' => "Flashcards for {$tname}"];
                    $tasks[] = ['type' => 'quiz',      'topic_id' => $tid, 'label' => "Practice quiz on {$tname}"];
                }
                if (empty($tasks)) {
                    $tasks[] = ['type' => 'review', 'label' => "Catch-up &amp; review for Domain {$d->number}"];
                }

                $plan[] = [
                    'week'         => $weekNum++,
                    'date_start'   => $weekStart->toDateString(),
                    'date_end'     => $weekEnd->toDateString(),
                    'focus_domain' => ['id' => $d->id, 'number' => $d->number, 'name' => $d->name, 'color' => $d->color_hex],
                    'hours_target' => $hoursPerWeek,
                    'tasks'        => $tasks,
                    'kind'         => 'domain',
                ];
            }
        }

        // Final review weeks
        for ($r = 0; $r < $reviewWeeks; $r++) {
            $plan[] = [
                'week'         => $weekNum++,
                'date_start'   => $cursor->copy()->toDateString(),
                'date_end'     => $cursor->copy()->addDays(6)->toDateString(),
                'focus_domain' => null,
                'hours_target' => $hoursPerWeek,
                'tasks' => [
                    ['type' => 'review', 'label' => 'Full mock exam (Exam Simulator)'],
                    ['type' => 'review', 'label' => 'Review all flagged questions'],
                    ['type' => 'review', 'label' => 'Drill flashcards marked "still learning"'],
                    ['type' => 'review', 'label' => 'Re-read every topic overview'],
                ],
                'kind' => 'review',
            ];
            $cursor->addDays(7);
        }

        DB::table('study_plans')->updateOrInsert(
            ['user_id' => $user->id],
            [
                'exam_date'      => $examDate->toDateString(),
                'weeks'          => count($plan),
                'hours_per_week' => $hoursPerWeek,
                'plan_json'      => json_encode($plan, JSON_UNESCAPED_UNICODE),
                'updated_at'     => now(),
                'created_at'     => now(),
            ]
        );

        return response()->json([
            'success' => true,
            'plan' => [
                'exam_date'      => $examDate->toDateString(),
                'weeks'          => count($plan),
                'hours_per_week' => $hoursPerWeek,
                'plan'           => $plan,
            ],
        ]);
    }

    /**
     * DELETE /api/study-plan
     */
    public function destroy(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        DB::table('study_plans')->where('user_id', $user->id)->delete();
        return response()->json(['success' => true]);
    }

    /**
     * GET /api/confusion-map
     * Aggregates the user's wrong-answer rate per domain (and per quiz).
     */
    public function confusion(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');

        // Per-domain rollup
        $perDomain = DB::table('quiz_attempts as qa')
            ->join('quizzes as q', 'q.id', '=', 'qa.quiz_id')
            ->select('q.domain_id',
                DB::raw('COUNT(*) as attempts'),
                DB::raw('SUM(CASE WHEN qa.correct = 1 THEN 1 ELSE 0 END) as correct'))
            ->where('qa.user_id', $user->id)
            ->groupBy('q.domain_id')
            ->get();

        $domainsAll = DB::table('domains')->orderBy('number')->get();
        $byDomain = $domainsAll->map(function ($d) use ($perDomain) {
            $row = $perDomain->firstWhere('domain_id', $d->id);
            $attempts = (int) ($row->attempts ?? 0);
            $correct  = (int) ($row->correct  ?? 0);
            $wrong    = $attempts - $correct;
            $pct      = $attempts > 0 ? (int) round(($wrong / $attempts) * 100) : 0;
            return [
                'domain_id'   => $d->id,
                'number'      => $d->number,
                'name'        => $d->name,
                'color'       => $d->color_hex,
                'attempts'    => $attempts,
                'wrong'       => $wrong,
                'wrong_pct'   => $pct,
                'mastery_pct' => $attempts > 0 ? (int) round(($correct / $attempts) * 100) : 0,
            ];
        });

        // Top 10 most-missed quizzes
        $worstQuizzes = DB::table('quiz_attempts as qa')
            ->join('quizzes as q', 'q.id', '=', 'qa.quiz_id')
            ->select(
                'q.id', 'q.domain_id', 'q.question',
                'q.option_a', 'q.option_b', 'q.option_c', 'q.option_d',
                'q.correct_index', 'q.explanation',
                DB::raw('COUNT(*) as attempts'),
                DB::raw('SUM(CASE WHEN qa.correct = 0 THEN 1 ELSE 0 END) as wrong')
            )
            ->where('qa.user_id', $user->id)
            ->groupBy('q.id', 'q.domain_id', 'q.question', 'q.option_a', 'q.option_b', 'q.option_c', 'q.option_d', 'q.correct_index', 'q.explanation')
            ->havingRaw('SUM(CASE WHEN qa.correct = 0 THEN 1 ELSE 0 END) > 0')
            ->orderByDesc('wrong')
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'domains' => $byDomain,
            'worst_quizzes' => $worstQuizzes,
            'total_attempts' => (int) DB::table('quiz_attempts')->where('user_id', $user->id)->count(),
        ]);
    }
}
