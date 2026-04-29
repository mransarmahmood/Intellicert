<?php

namespace App\Http\Controllers;

use App\Models\Concept;
use App\Models\ConceptMemoryProfile;
use App\Models\Flashcard;
use App\Models\UserFlashcardReview;
use App\Services\Memory\DailyReviewQueueService;
use App\Services\Memory\ForgettingRiskService;
use App\Services\Memory\MemoryAnalyticsService;
use App\Services\Memory\MemoryProfileService;
use App\Services\Memory\RecallScoringService;
use App\Services\Memory\ReviewSchedulerService;
use App\Services\Gamification\XpAwardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MemoryController extends Controller
{
    public function __construct(
        private readonly MemoryAnalyticsService $analytics,
        private readonly DailyReviewQueueService $queueService,
        private readonly MemoryProfileService $profileService,
        private readonly ReviewSchedulerService $scheduler,
        private readonly RecallScoringService $recallScoring,
        private readonly ForgettingRiskService $riskService,
        private readonly XpAwardService $xpAwards,
    ) {}

    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        return response()->json(['success' => true, 'memory' => $this->analytics->summary((int) $user->id)]);
    }

    public function dueReviews(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $rows = ConceptMemoryProfile::with('concept:id,title')
            ->where('user_id', $user->id)
            ->whereNotNull('next_review_at')
            ->where('next_review_at', '<=', now())
            ->orderBy('next_review_at')
            ->get();
        return response()->json(['success' => true, 'profiles' => $rows, 'total' => $rows->count()]);
    }

    public function conceptProfile(Request $request, int $conceptId): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $p = ConceptMemoryProfile::with(['concept:id,title', 'topic:id,name'])
            ->where('user_id', $user->id)
            ->where('concept_id', $conceptId)
            ->first();
        if (!$p) return response()->json(['success' => false, 'error' => 'Memory profile not found'], 404);
        return response()->json(['success' => true, 'profile' => $p]);
    }

    public function submitFlashcardReview(Request $request, int $flashcardId): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $data = $request->validate([
            'quality' => 'required|in:again,hard,good,easy',
        ]);
        $card = Flashcard::find($flashcardId);
        if (!$card) return response()->json(['success' => false, 'error' => 'Flashcard not found'], 404);

        $latest = UserFlashcardReview::where('user_id', $user->id)->where('flashcard_id', $flashcardId)->latest('id')->first();
        $currentStage = (int) ($latest->stage ?? 0);
        $next = $this->scheduler->nextSchedule($currentStage, $data['quality']);
        $recall = $this->recallScoring->fromQuality($data['quality']);

        $review = UserFlashcardReview::create([
            'user_id' => $user->id,
            'flashcard_id' => $flashcardId,
            'quality' => match ($data['quality']) {
                'again' => 0, 'hard' => 1, 'good' => 2, default => 3,
            },
            'recall_score' => $recall['recall_score'],
            'correct' => $recall['correct'],
            'interval_days' => $next['interval_days'],
            'stage' => $next['stage'],
            'reviewed_at' => now(),
            'next_review_at' => now()->addDays($next['interval_days']),
        ]);

        if ($card->concept_id) {
            $concept = Concept::find($card->concept_id);
            if ($concept) {
                $profile = $this->profileService->initialize((int) $user->id, (int) $concept->topic_id, (int) $concept->id);
                $risk = $this->riskService->calculate($review->next_review_at, $recall['recall_score']);
                $this->profileService->updateAfterReview($profile, $recall['recall_score'], $next['stage'], $next['interval_days'], $risk);
            }
        }

        $this->xpAwards->award((int) $user->id, 'flashcard_review', [
            'concept_id' => $card->concept_id,
        ]);

        return response()->json(['success' => true, 'review' => $review]);
    }

    public function dailyQueue(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $rows = $this->queueService->buildForUser((int) $user->id, 30);
        return response()->json(['success' => true, 'queue' => $rows, 'total' => $rows->count()]);
    }

    public function retentionAnalytics(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $summary = $this->analytics->summary((int) $user->id);
        $riskCounts = ConceptMemoryProfile::where('user_id', $user->id)
            ->selectRaw('forgetting_risk, COUNT(*) as c')
            ->groupBy('forgetting_risk')
            ->pluck('c', 'forgetting_risk');
        return response()->json(['success' => true, 'summary' => $summary, 'risk_counts' => $riskCounts]);
    }

    public function weakConcepts(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $rows = ConceptMemoryProfile::with('concept:id,title', 'topic:id,name')
            ->where('user_id', $user->id)
            ->where(function ($q) {
                $q->where('mastery_percent', '<', 50)->orWhereIn('forgetting_risk', ['high', 'critical']);
            })
            ->orderBy('mastery_percent')
            ->limit(20)
            ->get();
        return response()->json(['success' => true, 'concepts' => $rows, 'total' => $rows->count()]);
    }

    /**
     * Track 5 — Image occlusion drill cards.
     *
     * Surfaces topic_extras with extra_type='occlusion' for the daily
     * review surface. Prioritizes occlusions tied to topics the learner
     * has already studied (touched concept_mastery) so unfamiliar
     * diagrams aren't pushed prematurely. Caps at 10 per session.
     */
    public function occlusionCards(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $limit = min(20, max(3, (int) $request->input('limit', 10)));

        // Topics the user has touched (any concept_mastery row).
        $studiedTopicIds = \DB::table('concept_mastery')
            ->where('user_id', $user->id)
            ->pluck('topic_id')->unique()->values();

        $extras = \DB::table('topic_extras as te')
            ->join('topics as t', 't.id', '=', 'te.topic_id')
            ->where('te.extra_type', 'occlusion')
            ->when($studiedTopicIds->isNotEmpty(), fn ($q) => $q->whereIn('te.topic_id', $studiedTopicIds))
            ->orderBy('te.sort_order')
            ->limit($limit)
            ->get(['te.id', 'te.topic_id', 'te.content_json', 'te.sort_order', 't.name as topic_name']);

        $cards = $extras->map(function ($row) {
            $content = is_string($row->content_json) ? json_decode($row->content_json, true) : $row->content_json;
            return [
                'id'         => (int) $row->id,
                'topic_id'   => (int) $row->topic_id,
                'topic_name' => (string) $row->topic_name,
                'image_url'  => $content['image_url'] ?? null,
                'alt'        => $content['alt'] ?? ($row->topic_name . ' diagram'),
                'regions'    => $content['regions'] ?? [],
            ];
        });

        return response()->json(['success' => true, 'cards' => $cards, 'total' => $cards->count()]);
    }
}
