<?php

namespace App\Http\Controllers;

use App\Models\Concept;
use App\Services\Memory\DailyReviewQueueService;
use App\Services\Memory\FlashcardGenerationService;
use App\Services\Memory\MemoryEventService;
use App\Services\Memory\MemoryProfileService;
use App\Services\Gamification\XpAwardService;
use App\Services\Readiness\PassProbabilityCalculator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class StudyController extends Controller
{
    public function __construct(
        private readonly MemoryProfileService $memoryProfiles,
        private readonly FlashcardGenerationService $flashcardGeneration,
        private readonly DailyReviewQueueService $dailyQueueService,
        private readonly MemoryEventService $memoryEvents,
        private readonly XpAwardService $xpAwards,
        private readonly PassProbabilityCalculator $passProbability,
    ) {}

    private function ensureConceptFlashcards(int $topicId, int $conceptId): void
    {
        $concept = DB::table('concepts')
            ->where('id', $conceptId)
            ->where('topic_id', $topicId)
            ->first();
        if (!$concept) {
            return;
        }

        $topic = DB::table('topics')->where('id', $topicId)->first();
        if (!$topic || !$topic->domain_id) {
            return;
        }

        $baseKey = 'auto-c-' . $conceptId . '-';
        $existing = DB::table('flashcards')
            ->where('card_key', 'like', $baseKey . '%')
            ->count();
        if ($existing >= 2) {
            return;
        }

        $conceptTitle = trim((string) $concept->title);
        $conceptDesc = trim((string) ($concept->description ?? ''));
        $topicName = trim((string) $topic->name);

        $cards = [
            [
                'front' => "What is {$conceptTitle} in {$topicName}?",
                'back' => $conceptDesc !== '' ? $conceptDesc : "{$conceptTitle} is a core concept in {$topicName}. Explain its purpose, trigger, and safety outcome.",
            ],
            [
                'front' => "How do you apply {$conceptTitle} in a real CSP scenario?",
                'back' => "Use {$conceptTitle} inside {$topicName} by identifying risk signals, choosing control actions, and verifying results.",
            ],
        ];

        foreach ($cards as $idx => $card) {
            $key = $baseKey . ($idx + 1);
            $exists = DB::table('flashcards')->where('card_key', $key)->exists();
            if ($exists) {
                continue;
            }

            DB::table('flashcards')->insert([
                'card_key' => $key,
                'domain_id' => $topic->domain_id,
                'front' => $card['front'],
                'back' => $card['back'],
                'image_url' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function xpForEvent(string $eventType, ?bool $isCorrect): int
    {
        return match ($eventType) {
            'step_completed' => 8,
            'flow_completed' => 40,
            'try_reveal_answer' => 3,
            'recall_answered', 'apply_answered' => $isCorrect ? 12 : 5,
            'interleave_checkpoint_completed' => 10,
            default => 0,
        };
    }

    private function updateGamificationState(int $userId, int $xpDelta): void
    {
        $state = DB::table('user_gamification_state')->where('user_id', $userId)->first();
        $today = Carbon::today();
        $lastActivity = $state?->last_activity_date ? Carbon::parse($state->last_activity_date) : null;

        $streak = (int) ($state->current_streak_days ?? 0);
        if (!$lastActivity) {
            $streak = 1;
        } elseif ($lastActivity->isSameDay($today)) {
            // same day, keep streak
        } elseif ($lastActivity->copy()->addDay()->isSameDay($today)) {
            $streak += 1;
        } else {
            $streak = 1;
        }

        $best = max((int) ($state->best_streak_days ?? 0), $streak);
        $totalXp = max(0, (int) ($state->total_xp ?? 0) + $xpDelta);

        DB::table('user_gamification_state')->updateOrInsert(
            ['user_id' => $userId],
            [
                'total_xp' => $totalXp,
                'current_streak_days' => $streak,
                'best_streak_days' => $best,
                'last_activity_date' => $today->toDateString(),
                'updated_at' => now(),
                'created_at' => $state->created_at ?? now(),
            ]
        );
    }

    private function awardXp(int $userId, array $data): int
    {
        $eventType = (string) ($data['event_type'] ?? '');
        $isCorrect = array_key_exists('is_correct', $data) ? (bool) $data['is_correct'] : null;
        $xp = $this->xpForEvent($eventType, $isCorrect);
        if ($xp <= 0) {
            return 0;
        }

        DB::table('user_xp_ledger')->insert([
            'user_id' => $userId,
            'xp_delta' => $xp,
            'source' => $eventType,
            'topic_id' => $data['topic_id'] ?? null,
            'concept_id' => $data['concept_id'] ?? null,
            'meta_json' => isset($data['meta_json']) ? json_encode($data['meta_json']) : null,
            'awarded_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->updateGamificationState($userId, $xp);
        return $xp;
    }

    private function mapEventToQuality(array $data): int
    {
        $type = (string) ($data['event_type'] ?? '');
        $isCorrect = array_key_exists('is_correct', $data) ? (bool) $data['is_correct'] : null;

        if (in_array($type, ['recall_answered', 'apply_answered'], true)) {
            return $isCorrect ? 4 : 2;
        }
        if ($type === 'flow_completed') {
            return 4;
        }
        if ($type === 'step_completed') {
            return 3;
        }
        return 3;
    }

    private function updateConceptMastery(int $userId, array $data): void
    {
        $conceptId = $data['concept_id'] ?? null;
        $topicId = $data['topic_id'] ?? null;
        if (!$conceptId || !$topicId) {
            return;
        }

        $row = DB::table('concept_mastery')
            ->where('user_id', $userId)
            ->where('concept_id', $conceptId)
            ->first();

        $attempts = (int) ($row->attempts ?? 0) + 1;
        $correctAttempts = (int) ($row->correct_attempts ?? 0);
        if (array_key_exists('is_correct', $data) && $data['is_correct']) {
            $correctAttempts += 1;
        }

        $quality = $this->mapEventToQuality($data);
        $ef = (float) ($row->ease_factor ?? 2.5);
        $reps = (int) ($row->repetitions ?? 0);
        $interval = (int) ($row->interval_days ?? 0);
        $sm2 = $this->sm2($quality, $ef, $reps, $interval);
        $next = now()->addDays($sm2['interval_days']);

        $accuracy = $attempts > 0 ? ($correctAttempts / $attempts) : 0;
        $baseScore = ($accuracy * 70) + (min(5, $sm2['repetitions']) / 5) * 30;
        $masteryScore = (int) max(0, min(100, round($baseScore)));

        DB::table('concept_mastery')->updateOrInsert(
            ['user_id' => $userId, 'concept_id' => $conceptId],
            [
                'topic_id' => $topicId,
                'attempts' => $attempts,
                'correct_attempts' => $correctAttempts,
                'mastery_score' => $masteryScore,
                'ease_factor' => $sm2['ease_factor'],
                'interval_days' => $sm2['interval_days'],
                'repetitions' => $sm2['repetitions'],
                'last_quality' => $quality,
                'last_practiced_at' => now(),
                'next_review_at' => $next,
                'updated_at' => now(),
                'created_at' => $row->created_at ?? now(),
            ]
        );
    }

    /**
     * POST /api/study/learning-event
     * body: {
     *   topic_id?, concept_id?, event_type, step_type?, step_order?,
     *   is_correct?, confidence?, time_spent_ms?, meta_json?
     * }
     */
    public function learningEvent(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $data = $request->validate([
            'topic_id' => 'nullable|integer|exists:topics,id',
            'concept_id' => 'nullable|integer|exists:concepts,id',
            'event_type' => 'required|string|max:80',
            'step_type' => 'nullable|string|max:40',
            'step_order' => 'nullable|integer|min:1|max:20',
            'is_correct' => 'nullable|boolean',
            'confidence' => 'nullable|integer|min:1|max:5',
            'time_spent_ms' => 'nullable|integer|min:0|max:36000000',
            'meta_json' => 'nullable|array',
        ]);

        DB::table('learning_events')->insert([
            'user_id' => $user->id,
            'topic_id' => $data['topic_id'] ?? null,
            'concept_id' => $data['concept_id'] ?? null,
            'event_type' => $data['event_type'],
            'step_type' => $data['step_type'] ?? null,
            'step_order' => $data['step_order'] ?? null,
            'is_correct' => array_key_exists('is_correct', $data) ? ((bool) $data['is_correct'] ? 1 : 0) : null,
            'confidence' => $data['confidence'] ?? null,
            'time_spent_ms' => $data['time_spent_ms'] ?? null,
            'meta_json' => isset($data['meta_json']) ? json_encode($data['meta_json']) : null,
            'occurred_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->updateConceptMastery((int) $user->id, $data);
        $xpAwarded = $this->awardXp((int) $user->id, $data);
        $eventType = match (($data['event_type'] ?? '')) {
            'step_completed' => 'lesson_step_completion',
            'flow_completed' => 'concept_completion',
            default => null,
        };
        $newGamification = $eventType
            ? $this->xpAwards->award((int) $user->id, $eventType, [
                'topic_id' => $data['topic_id'] ?? null,
                'concept_id' => $data['concept_id'] ?? null,
              ])
            : null;
        if (($data['event_type'] ?? '') === 'flow_completed' && !empty($data['topic_id']) && !empty($data['concept_id'])) {
            $this->ensureConceptFlashcards((int) $data['topic_id'], (int) $data['concept_id']);
            $concept = Concept::find((int) $data['concept_id']);
            if ($concept) {
                $profile = $this->memoryProfiles->initialize((int) $user->id, (int) $concept->topic_id, (int) $concept->id);
                $topic = DB::table('topics')->where('id', $concept->topic_id)->first();
                $created = $this->flashcardGeneration->generateStarterCards($concept, $topic?->domain_id);
                $this->dailyQueueService->buildForUser((int) $user->id, 30);
                $this->memoryEvents->log((int) $user->id, 'concept_completed_memory_initialized', [
                    'topic_id' => $concept->topic_id,
                    'concept_id' => $concept->id,
                    'profile_id' => $profile->id,
                    'flashcards_created' => $created,
                ]);
            }
        }

        return response()->json(['success' => true, 'xp_awarded' => $xpAwarded, 'gamification' => $newGamification]);
    }

    /**
     * GET /api/study/gamification
     */
    public function gamification(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $state = DB::table('user_gamification_state')
            ->where('user_id', $user->id)
            ->first();

        $totalXp = (int) ($state->total_xp ?? 0);
        $currentStreak = (int) ($state->current_streak_days ?? 0);
        $bestStreak = (int) ($state->best_streak_days ?? 0);
        $level = intdiv($totalXp, 200) + 1;
        $levelProgress = $totalXp % 200;

        $avgMastery = (int) round((float) DB::table('concept_mastery')
            ->where('user_id', $user->id)
            ->avg('mastery_score'));
        $dueCount = (int) DB::table('concept_mastery')
            ->where('user_id', $user->id)
            ->where(function ($q) {
                $q->whereNull('next_review_at')->orWhere('next_review_at', '<=', now());
            })
            ->count();

        // Track 3 — calibrated readiness score replaces the old mastery×0.7 + queue blend.
        // Old formula kept here as a fallback when the user has no data at all.
        $passData = $this->passProbability->compute((int) $user->id);
        $readiness = $passData['composite_score'];
        if ($readiness === 0 && $avgMastery > 0) {
            // Bootstrap path: brand-new user with mastery but no domain data yet.
            $readiness = max(0, min(100, (int) round(($avgMastery * 0.7) + (max(0, 30 - min(30, $dueCount)) * 1.0))));
        }

        return response()->json([
            'success' => true,
            'gamification' => [
                'total_xp' => $totalXp,
                'level' => $level,
                'level_progress' => $levelProgress,
                'current_streak_days' => $currentStreak,
                'best_streak_days' => $bestStreak,
                'readiness_score' => $readiness,
                'pass_probability' => $passData['pass_probability'],
                'readiness_breakdown' => $passData['breakdown'],
            ],
        ]);
    }

    /**
     * GET /api/study/readiness
     *
     * Track 3 — full readiness payload including per-domain mastery for
     * the dashboard radar chart and the "what to study next" CTA.
     */
    public function readiness(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $data = $this->passProbability->compute((int) $user->id);
        return response()->json(['success' => true, 'readiness' => $data]);
    }

    /**
     * GET /api/study/revision-queue?limit=20
     */
    public function revisionQueue(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $limit = min(100, max(5, (int) $request->input('limit', 20)));

        $rows = DB::table('concept_mastery as cm')
            ->join('concepts as c', 'c.id', '=', 'cm.concept_id')
            ->join('topics as t', 't.id', '=', 'cm.topic_id')
            ->where('cm.user_id', $user->id)
            ->where(function ($q) {
                $q->whereNull('cm.next_review_at')->orWhere('cm.next_review_at', '<=', now());
            })
            ->orderByRaw('COALESCE(cm.next_review_at, cm.updated_at) asc')
            ->limit($limit)
            ->get([
                'cm.topic_id',
                'cm.concept_id',
                'cm.mastery_score',
                'cm.repetitions',
                'cm.next_review_at',
                'c.title as concept_title',
                't.name as topic_name',
            ]);

        return response()->json([
            'success' => true,
            'queue' => $rows,
            'total' => $rows->count(),
        ]);
    }

    /**
     * GET /api/study/recommendation
     * Personalized next-best action and pace suggestion.
     */
    public function recommendation(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $now = now();

        $dueConcepts = (int) DB::table('concept_mastery')
            ->where('user_id', $user->id)
            ->whereNotNull('next_review_at')
            ->where('next_review_at', '<=', $now)
            ->count();

        $recentAttempts = (int) DB::table('quiz_attempts')
            ->where('user_id', $user->id)
            ->where('taken_at', '>=', now()->subDays(14))
            ->count();
        $recentCorrect = (int) DB::table('quiz_attempts')
            ->where('user_id', $user->id)
            ->where('taken_at', '>=', now()->subDays(14))
            ->where('correct', 1)
            ->count();
        $recentAccuracy = $recentAttempts > 0 ? ($recentCorrect / $recentAttempts) : null;

        $weakDomain = DB::table('quiz_attempts as qa')
            ->join('quizzes as q', 'q.id', '=', 'qa.quiz_id')
            ->select(
                'q.domain_id',
                DB::raw('COUNT(*) as attempts'),
                DB::raw('SUM(CASE WHEN qa.correct = 1 THEN 1 ELSE 0 END) as correct')
            )
            ->where('qa.user_id', $user->id)
            ->where('qa.taken_at', '>=', now()->subDays(30))
            ->groupBy('q.domain_id')
            ->orderByRaw('(SUM(CASE WHEN qa.correct = 1 THEN 1 ELSE 0 END) / NULLIF(COUNT(*),0)) asc')
            ->first();

        $weakDomainId = $weakDomain?->domain_id;
        $nextTopic = null;
        if ($weakDomainId) {
            $nextTopic = DB::table('topics')
                ->where('domain_id', $weakDomainId)
                ->orderBy('sort_order')
                ->select('id', 'name', 'domain_id')
                ->first();
        }
        if (!$nextTopic) {
            $nextTopic = DB::table('topics')->orderBy('sort_order')->select('id', 'name', 'domain_id')->first();
        }

        $pace = 'normal';
        if ($dueConcepts >= 6 || ($recentAccuracy !== null && $recentAccuracy < 0.6)) {
            $pace = 'support';
        } elseif ($recentAccuracy !== null && $recentAccuracy >= 0.85 && $dueConcepts <= 2) {
            $pace = 'fast';
        }

        $reason = $dueConcepts > 0
            ? "You have {$dueConcepts} due concept reviews; clear retention debt first."
            : ($weakDomainId
                ? "Your weakest recent quiz area is domain {$weakDomainId}; focus there for fastest score gains."
                : "Start with the next topic in sequence to build momentum.");

        return response()->json([
            'success' => true,
            'recommendation' => [
                'pace_mode' => $pace,
                'due_concepts' => $dueConcepts,
                'recent_accuracy_14d' => $recentAccuracy !== null ? (int) round($recentAccuracy * 100) : null,
                'weak_domain_id' => $weakDomainId,
                'next_topic' => $nextTopic,
                'reason' => $reason,
            ],
        ]);
    }

    /**
     * SM-2 (SuperMemo 2) algorithm.
     * quality: 0-5 where 0 = total blackout, 5 = perfect recall.
     * Returns the new state.
     */
    private function sm2(int $quality, float $ef, int $reps, int $interval): array
    {
        $quality = max(0, min(5, $quality));

        if ($quality < 3) {
            // Failed — restart the schedule
            $reps = 0;
            $interval = 1;
        } else {
            $reps += 1;
            if      ($reps == 1) $interval = 1;
            elseif  ($reps == 2) $interval = 6;
            else                 $interval = (int) round($interval * $ef);
        }

        // Update ease factor
        $ef = $ef + (0.1 - (5 - $quality) * (0.08 + (5 - $quality) * 0.02));
        if ($ef < 1.3) $ef = 1.3;

        return [
            'ease_factor'   => round($ef, 2),
            'repetitions'   => $reps,
            'interval_days' => $interval,
        ];
    }

    /**
     * POST /api/study/review
     * body: { card_id, quality (0-5) }
     */
    public function review(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $data = $request->validate([
            'card_id' => 'required|integer|exists:flashcards,id',
            'quality' => 'required|integer|between:0,5',
        ]);

        $row = DB::table('card_reviews')
            ->where('user_id', $user->id)
            ->where('card_id', $data['card_id'])
            ->first();

        $ef       = $row->ease_factor   ?? 2.5;
        $reps     = $row->repetitions   ?? 0;
        $interval = $row->interval_days ?? 0;

        $new = $this->sm2($data['quality'], (float) $ef, (int) $reps, (int) $interval);
        $next = Carbon::now()->addDays($new['interval_days']);

        DB::table('card_reviews')->updateOrInsert(
            ['user_id' => $user->id, 'card_id' => $data['card_id']],
            [
                'ease_factor'      => $new['ease_factor'],
                'repetitions'      => $new['repetitions'],
                'interval_days'    => $new['interval_days'],
                'last_quality'     => $data['quality'],
                'last_reviewed_at' => now(),
                'next_review_at'   => $next,
                'updated_at'       => now(),
                'created_at'       => $row->created_at ?? now(),
            ]
        );

        return response()->json([
            'success'    => true,
            'next_review' => $next->toIso8601String(),
            ...$new,
        ]);
    }

    /**
     * GET /api/study/due?domain_id=...&limit=20
     */
    public function due(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $domainId = $request->input('domain_id');
        $limit = min(100, max(5, (int) $request->input('limit', 20)));

        $now = now();

        // 1) Cards already in review queue and due
        $dueQ = DB::table('card_reviews as cr')
            ->join('flashcards as f', 'f.id', '=', 'cr.card_id')
            ->where('cr.user_id', $user->id)
            ->where('cr.next_review_at', '<=', $now)
            ->select('f.*', 'cr.next_review_at as due_at', 'cr.repetitions')
            ->orderBy('cr.next_review_at');
        if ($domainId) $dueQ->where('f.domain_id', $domainId);
        $due = $dueQ->limit($limit)->get();

        // 2) Brand new cards (never reviewed)
        $newCount = $limit - $due->count();
        $new = collect();
        if ($newCount > 0) {
            $newQ = DB::table('flashcards as f')
                ->leftJoin('card_reviews as cr', function ($j) use ($user) {
                    $j->on('cr.card_id', '=', 'f.id')->where('cr.user_id', '=', $user->id);
                })
                ->whereNull('cr.id')
                ->select('f.*', DB::raw('NULL as due_at'), DB::raw('0 as repetitions'));
            if ($domainId) $newQ->where('f.domain_id', $domainId);
            $new = $newQ->orderBy('f.id')->limit($newCount)->get();
        }

        $combined = $due->concat($new)->values();

        return response()->json([
            'success'    => true,
            'flashcards' => $combined,
            'due_count'  => $due->count(),
            'new_count'  => $new->count(),
            'total'      => $combined->count(),
        ]);
    }

    /**
     * GET /api/study/stats
     */
    public function stats(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $now = now();

        $totalReviewed = (int) DB::table('card_reviews')->where('user_id', $user->id)->count();
        $dueNow = (int) DB::table('card_reviews')
            ->where('user_id', $user->id)
            ->where('next_review_at', '<=', $now)
            ->count();
        $mastered = (int) DB::table('card_reviews')
            ->where('user_id', $user->id)
            ->where('repetitions', '>=', 3)
            ->where('last_quality', '>=', 4)
            ->count();

        $totalCards = (int) DB::table('flashcards')->count();

        // Reviews per day for the last 14 days (zero-filled)
        $rows = DB::table('card_reviews')
            ->selectRaw('DATE(last_reviewed_at) as d, COUNT(*) as c')
            ->where('user_id', $user->id)
            ->where('last_reviewed_at', '>=', now()->subDays(13)->startOfDay())
            ->groupBy('d')
            ->pluck('c', 'd')
            ->toArray();
        $series = [];
        for ($i = 13; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $series[] = ['date' => $date, 'count' => (int) ($rows[$date] ?? 0)];
        }

        // Streak — consecutive days ending today (or yesterday) with at least 1 review
        $streak = 0;
        $cursor = Carbon::today();
        while (true) {
            $hit = DB::table('card_reviews')
                ->where('user_id', $user->id)
                ->whereDate('last_reviewed_at', $cursor->toDateString())
                ->exists();
            if ($hit) {
                $streak++;
                $cursor->subDay();
            } else {
                if ($streak === 0 && $cursor->isToday()) {
                    $cursor->subDay(); // allow yesterday
                    continue;
                }
                break;
            }
        }

        // Mastery per domain
        $perDomain = DB::table('card_reviews as cr')
            ->join('flashcards as f', 'f.id', '=', 'cr.card_id')
            ->select(
                'f.domain_id',
                DB::raw('COUNT(*) as reviewed'),
                DB::raw('SUM(CASE WHEN cr.repetitions >= 3 AND cr.last_quality >= 4 THEN 1 ELSE 0 END) as mastered')
            )
            ->where('cr.user_id', $user->id)
            ->groupBy('f.domain_id')
            ->get();

        $totalsByDomain = DB::table('flashcards')
            ->select('domain_id', DB::raw('COUNT(*) as total'))
            ->groupBy('domain_id')
            ->pluck('total', 'domain_id')
            ->toArray();

        $domainStats = [];
        foreach ($totalsByDomain as $dom => $total) {
            $row = $perDomain->firstWhere('domain_id', $dom);
            $reviewed = (int) ($row->reviewed ?? 0);
            $masteredD = (int) ($row->mastered ?? 0);
            $pct = $total > 0 ? (int) round(($masteredD / $total) * 100) : 0;
            $domainStats[] = [
                'domain_id' => $dom,
                'total'     => (int) $total,
                'reviewed'  => $reviewed,
                'mastered'  => $masteredD,
                'mastery_pct' => $pct,
            ];
        }

        // Quiz attempts (last 30 days)
        $quizAttempts = (int) DB::table('quiz_attempts')
            ->where('user_id', $user->id)
            ->where('taken_at', '>=', now()->subDays(30))
            ->count();
        $quizCorrect = (int) DB::table('quiz_attempts')
            ->where('user_id', $user->id)
            ->where('taken_at', '>=', now()->subDays(30))
            ->where('correct', 1)
            ->count();
        $quizAccuracy = $quizAttempts > 0 ? (int) round(($quizCorrect / $quizAttempts) * 100) : 0;

        $dueConceptsNow = (int) DB::table('concept_mastery')
            ->where('user_id', $user->id)
            ->whereNotNull('next_review_at')
            ->where('next_review_at', '<=', $now)
            ->count();
        $atRisk24h = (int) DB::table('concept_mastery')
            ->where('user_id', $user->id)
            ->whereNotNull('next_review_at')
            ->where('next_review_at', '>', $now)
            ->where('next_review_at', '<=', now()->addDay())
            ->count();

        return response()->json([
            'success' => true,
            'stats' => [
                'total_reviewed' => $totalReviewed,
                'total_cards'    => $totalCards,
                'due_now'        => $dueNow,
                'mastered'       => $mastered,
                'streak_days'    => $streak,
                'quiz_attempts_30d' => $quizAttempts,
                'quiz_accuracy_30d' => $quizAccuracy,
                'due_concepts_now' => $dueConceptsNow,
                'at_risk_24h' => $atRisk24h,
            ],
            'review_series' => $series,
            'domains'       => $domainStats,
        ]);
    }

    /**
     * POST /api/study/quiz-attempt
     * body: { quiz_id, picked_index, correct }
     */
    public function quizAttempt(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $data = $request->validate([
            'quiz_id'      => 'required|integer|exists:quizzes,id',
            'picked_index' => 'required|integer|between:0,3',
            'correct'      => 'required|boolean',
        ]);

        DB::table('quiz_attempts')->insert([
            'user_id'      => $user->id,
            'quiz_id'      => $data['quiz_id'],
            'picked_index' => $data['picked_index'],
            'correct'      => $data['correct'] ? 1 : 0,
            'taken_at'     => now(),
        ]);

        $this->xpAwards->award((int) $user->id, 'quiz_completion');

        return response()->json(['success' => true]);
    }
}
