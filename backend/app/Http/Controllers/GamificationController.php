<?php

namespace App\Http\Controllers;

use App\Models\AchievementEvent;
use App\Models\Badge;
use App\Models\GamificationProfile;
use App\Models\UserBadge;
use App\Models\UserMission;
use App\Models\XpEvent;
use App\Services\Gamification\GamificationProfileService;
use App\Services\Gamification\MissionService;
use App\Services\Gamification\XpAwardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GamificationController extends Controller
{
    public function __construct(
        private readonly GamificationProfileService $profiles,
        private readonly XpAwardService $xpAwards,
        private readonly MissionService $missions,
    ) {}

    public function profile(Request $request): JsonResponse
    {
        $u = $request->attributes->get('auth_user');
        $p = $this->profiles->getOrCreate((int) $u->id);
        return response()->json(['success' => true, 'profile' => $p]);
    }

    public function xpHistory(Request $request): JsonResponse
    {
        $u = $request->attributes->get('auth_user');
        $rows = XpEvent::where('user_id', $u->id)->orderByDesc('occurred_at')->limit(100)->get();
        return response()->json(['success' => true, 'events' => $rows, 'total' => $rows->count()]);
    }

    public function streak(Request $request): JsonResponse
    {
        $u = $request->attributes->get('auth_user');
        $p = $this->profiles->getOrCreate((int) $u->id);
        return response()->json(['success' => true, 'streak' => [
            'current' => (int) $p->current_streak_days,
            'longest' => (int) $p->longest_streak_days,
            'last_activity_date' => $p->last_activity_date,
        ]]);
    }

    public function badges(Request $request): JsonResponse
    {
        $u = $request->attributes->get('auth_user');
        $all = Badge::where('is_active', true)->orderBy('category')->get();
        $owned = UserBadge::where('user_id', $u->id)->pluck('badge_id')->toArray();
        return response()->json(['success' => true, 'badges' => $all, 'owned_badge_ids' => $owned]);
    }

    public function missions(Request $request): JsonResponse
    {
        $u = $request->attributes->get('auth_user');
        $this->missions->assignForUser((int) $u->id);
        $rows = UserMission::query()
            ->join('missions as m', 'm.id', '=', 'user_missions.mission_id')
            ->where('user_missions.user_id', $u->id)
            ->whereIn('user_missions.status', ['active', 'completed'])
            ->orderBy('m.type')
            ->orderBy('user_missions.status')
            ->select('user_missions.*', 'm.name', 'm.type', 'm.xp_reward')
            ->get();
        return response()->json(['success' => true, 'missions' => $rows, 'total' => $rows->count()]);
    }

    public function claimMission(Request $request, int $userMissionId): JsonResponse
    {
        $u = $request->attributes->get('auth_user');
        $xp = $this->missions->claim((int) $u->id, $userMissionId);
        if ($xp === null) return response()->json(['success' => false, 'error' => 'Mission not claimable'], 400);
        $state = $this->xpAwards->award((int) $u->id, 'mission_completion', ['user_mission_id' => $userMissionId, 'mission_xp' => $xp]);
        return response()->json(['success' => true, ...$state]);
    }

    public function achievements(Request $request): JsonResponse
    {
        $u = $request->attributes->get('auth_user');
        $rows = AchievementEvent::where('user_id', $u->id)->orderByDesc('occurred_at')->limit(100)->get();
        return response()->json(['success' => true, 'events' => $rows, 'total' => $rows->count()]);
    }

    public function leaderboard(): JsonResponse
    {
        $rows = GamificationProfile::query()
            ->join('users as u', 'u.id', '=', 'gamification_profiles.user_id')
            ->orderByDesc('gamification_profiles.total_xp')
            ->limit(20)
            ->get([
                'gamification_profiles.user_id',
                'gamification_profiles.total_xp',
                'gamification_profiles.current_level',
                'gamification_profiles.level_title',
                'u.name',
            ]);
        return response()->json(['success' => true, 'leaderboard' => $rows]);
    }

    public function activity(Request $request): JsonResponse
    {
        $u = $request->attributes->get('auth_user');
        $data = $request->validate([
            'event_type' => 'required|string|max:80',
            'topic_id' => 'nullable|integer|exists:topics,id',
            'concept_id' => 'nullable|integer|exists:concepts,id',
            'meta_json' => 'nullable|array',
        ]);
        $state = $this->xpAwards->award((int) $u->id, (string) $data['event_type'], [
            'topic_id' => $data['topic_id'] ?? null,
            'concept_id' => $data['concept_id'] ?? null,
            ...($data['meta_json'] ?? []),
        ]);
        return response()->json(['success' => true, ...$state]);
    }
}
