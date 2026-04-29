<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    private function requireSuperadmin(Request $request): ?JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        if (!$user || $user->role !== 'superadmin') {
            return response()->json(['success' => false, 'error' => 'Superadmin access required'], 403);
        }
        return null;
    }

    /**
     * GET /api/admin/topics/completeness
     * Per-topic content audit: presence/count of overview, concepts, flashcards,
     * quizzes, mnemonics, formulas, regulations, learning steps, image, discussion.
     */
    public function topicCompleteness(Request $request): JsonResponse
    {
        if ($err = $this->requireSuperadmin($request)) return $err;

        $topics = DB::table('topics')->orderBy('domain_id')->orderBy('sort_order')->get();

        // Pre-aggregate flashcards per domain (flashcards have no topic_id, only domain_id)
        $flashByDomain = DB::table('flashcards')
            ->selectRaw('domain_id, COUNT(*) as c')
            ->groupBy('domain_id')
            ->pluck('c', 'domain_id');

        $rows = $topics->map(function ($t) use ($flashByDomain) {
            $hasOverview   = !empty(trim((string) $t->overview));
            $conceptCount  = (int) DB::table('concepts')->where('topic_id', $t->id)->count();
            // Flashcards are domain-scoped — show per-domain count as a proxy
            $flashCount    = (int) ($flashByDomain[$t->domain_id] ?? 0);
            // Quizzes link via topic_key (string) when set
            $quizCount     = (int) DB::table('quizzes')->where('topic_key', $t->topic_key)->count();
            $mnemonics     = (int) DB::table('topic_extras')->where('topic_id', $t->id)->where('extra_type', 'mnemonic')->count();
            $formulas      = (int) DB::table('topic_extras')->where('topic_id', $t->id)->where('extra_type', 'formula')->count();
            $regulations   = (int) DB::table('topic_extras')->where('topic_id', $t->id)->where('extra_type', 'regulation')->count();
            $examtips      = (int) DB::table('topic_extras')->where('topic_id', $t->id)->where('extra_type', 'examtip')->count();
            $learningSteps = (int) DB::table('learning_steps')->where('topic_id', $t->id)->count();
            $hasImage      = !empty($t->image_url);

            // Optional: discussion / image cache (best-effort, table may not exist)
            $hasDiscussion = false;
            $hasImageGen   = false;
            try {
                $hasDiscussion = DB::table('topic_discussions')
                    ->where('topic_key', $t->topic_key)
                    ->orWhere('topic_key', (string) $t->id)
                    ->exists();
            } catch (\Throwable $e) { /* table missing — ignore */ }
            try {
                $hasImageGen = DB::table('topic_images')
                    ->where('topic_key', $t->topic_key)
                    ->orWhere('topic_key', (string) $t->id)
                    ->exists();
            } catch (\Throwable $e) { /* table missing — ignore */ }

            // Score: 8 categories, each pass = 1 pt, ranges 0..8 → percentage
            $score = (int) $hasOverview
                   + ($conceptCount >= 3 ? 1 : 0)
                   + ($flashCount   >= 5 ? 1 : 0)
                   + ($quizCount    >= 3 ? 1 : 0)
                   + ($mnemonics    >= 1 ? 1 : 0)
                   + ($formulas + $regulations + $examtips >= 1 ? 1 : 0)
                   + ($learningSteps >= 3 ? 1 : 0)
                   + ($hasImage || $hasImageGen ? 1 : 0);
            $pct = (int) round(($score / 8) * 100);

            return [
                'id'             => $t->id,
                'topic_key'      => $t->topic_key,
                'domain_id'      => $t->domain_id,
                'name'           => $t->name,
                'has_overview'   => $hasOverview,
                'concepts'       => $conceptCount,
                'flashcards'     => $flashCount,
                'quizzes'        => $quizCount,
                'mnemonics'      => $mnemonics,
                'formulas'       => $formulas,
                'regulations'    => $regulations,
                'examtips'       => $examtips,
                'learning_steps' => $learningSteps,
                'has_image'      => $hasImage || $hasImageGen,
                'has_discussion' => $hasDiscussion,
                'score'          => $score,
                'max_score'      => 8,
                'percent'        => $pct,
            ];
        });

        return response()->json([
            'success' => true,
            'topics'  => $rows,
            'total'   => $rows->count(),
            'avg_percent' => (int) round($rows->avg('percent') ?? 0),
        ]);
    }

    public function overview(Request $request): JsonResponse
    {
        if ($err = $this->requireSuperadmin($request)) return $err;

        // Headline numbers
        $totalUsers = (int) DB::table('users')->count();
        $newUsers7d = (int) DB::table('users')->where('created_at', '>=', now()->subDays(7))->count();
        $newUsers30d = (int) DB::table('users')->where('created_at', '>=', now()->subDays(30))->count();

        $activeSubs = (int) DB::table('subscriptions')
            ->where('status', 'active')
            ->where('plan', '!=', 'demo')
            ->where(function ($q) { $q->whereNull('expires_at')->orWhere('expires_at', '>', now()); })
            ->distinct('user_id')
            ->count('user_id');

        $totalRevenue = (float) DB::table('payments')->where('status', 'completed')->sum('amount');
        $monthRevenue = (float) DB::table('payments')
            ->where('status', 'completed')
            ->whereRaw('MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())')
            ->sum('amount');

        // Signups for last 14 days (zero-filled)
        $rows = DB::table('users')
            ->selectRaw('DATE(created_at) as d, COUNT(*) as c')
            ->where('created_at', '>=', now()->subDays(13)->startOfDay())
            ->groupBy('d')
            ->pluck('c', 'd')
            ->toArray();

        $signupSeries = [];
        for ($i = 13; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $signupSeries[] = ['date' => $date, 'count' => (int) ($rows[$date] ?? 0)];
        }

        // Revenue last 14 days
        $rev = DB::table('payments')
            ->selectRaw('DATE(created_at) as d, SUM(amount) as a')
            ->where('status', 'completed')
            ->where('created_at', '>=', now()->subDays(13)->startOfDay())
            ->groupBy('d')
            ->pluck('a', 'd')
            ->toArray();

        $revenueSeries = [];
        for ($i = 13; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $revenueSeries[] = ['date' => $date, 'amount' => (float) ($rev[$date] ?? 0)];
        }

        // Plan distribution
        $planDist = DB::table('subscriptions')
            ->selectRaw('plan, COUNT(*) as count')
            ->where('status', 'active')
            ->where(function ($q) { $q->whereNull('expires_at')->orWhere('expires_at', '>', now()); })
            ->groupBy('plan')
            ->get()
            ->map(fn ($r) => ['plan' => $r->plan, 'count' => (int) $r->count]);

        // Content totals
        $contentTotals = [
            'topics'     => (int) DB::table('topics')->count(),
            'flashcards' => (int) DB::table('flashcards')->count(),
            'quizzes'    => (int) DB::table('quizzes')->count(),
            'concepts'   => (int) DB::table('concepts')->count(),
        ];

        return response()->json([
            'success' => true,
            'headline' => [
                'total_users'       => $totalUsers,
                'new_users_7d'      => $newUsers7d,
                'new_users_30d'     => $newUsers30d,
                'active_subscribers' => $activeSubs,
                'total_revenue'     => $totalRevenue,
                'month_revenue'     => $monthRevenue,
            ],
            'signup_series'  => $signupSeries,
            'revenue_series' => $revenueSeries,
            'plan_dist'      => $planDist,
            'content_totals' => $contentTotals,
        ]);
    }
}
