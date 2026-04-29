<?php

namespace App\Services\Gamification;

use App\Models\Mission;
use App\Models\UserMission;

class MissionService
{
    public function assignForUser(int $userId): void
    {
        $today = now()->toDateString();
        $weekStart = now()->startOfWeek()->toDateString();
        $weekEnd = now()->endOfWeek()->toDateString();

        $missions = Mission::where('is_active', true)->get();
        foreach ($missions as $m) {
            $windowStart = $m->type === 'weekly' ? $weekStart : $today;
            $windowEnd = $m->type === 'weekly' ? $weekEnd : $today;
            $exists = UserMission::where('user_id', $userId)
                ->where('mission_id', $m->id)
                ->whereDate('window_start', $windowStart)
                ->exists();
            if ($exists) continue;
            UserMission::create([
                'user_id' => $userId,
                'mission_id' => $m->id,
                'window_start' => $windowStart,
                'window_end' => $windowEnd,
                'target_count' => $m->target_count,
                'progress_count' => 0,
                'status' => 'active',
            ]);
        }
    }

    /** @return int mission completion bonus xp */
    public function trackEvent(int $userId, string $eventType): int
    {
        $this->assignForUser($userId);
        $bonus = 0;
        $today = now()->toDateString();
        $items = UserMission::query()
            ->join('missions as m', 'm.id', '=', 'user_missions.mission_id')
            ->where('user_missions.user_id', $userId)
            ->where('user_missions.status', 'active')
            ->where('m.event_type', $eventType)
            ->whereDate('user_missions.window_start', '<=', $today)
            ->whereDate('user_missions.window_end', '>=', $today)
            ->select('user_missions.*', 'm.xp_reward')
            ->get();

        foreach ($items as $um) {
            $progress = min((int) $um->target_count, (int) $um->progress_count + 1);
            $status = $progress >= (int) $um->target_count ? 'completed' : 'active';
            UserMission::where('id', $um->id)->update([
                'progress_count' => $progress,
                'status' => $status,
                'completed_at' => $status === 'completed' ? now() : null,
                'updated_at' => now(),
            ]);
            if ($status === 'completed') $bonus += (int) $um->xp_reward;
        }

        return $bonus;
    }

    public function claim(int $userId, int $userMissionId): ?int
    {
        $um = UserMission::where('user_id', $userId)->where('id', $userMissionId)->first();
        if (!$um || $um->status !== 'completed') return null;
        $m = Mission::find($um->mission_id);
        $xp = (int) ($m?->xp_reward ?? 0);
        $um->status = 'claimed';
        $um->claimed_at = now();
        $um->save();
        return $xp;
    }
}
