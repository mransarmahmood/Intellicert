<?php

namespace App\Services\Gamification;

use App\Models\XpEvent;

class XpAwardService
{
    public function __construct(
        private readonly GamificationProfileService $profiles,
        private readonly StreakService $streaks,
        private readonly MissionService $missions,
        private readonly BadgeService $badges,
        private readonly AchievementFeedService $feed,
    ) {}

    public function pointsFor(string $eventType, array $ctx = []): int
    {
        return match ($eventType) {
            'lesson_step_completion' => 8,
            'concept_completion' => 40,
            'topic_completion' => 70,
            'flashcard_review' => 6,
            'review_session_completion' => 20,
            'quiz_completion' => 10,
            'mock_exam_completion' => 120,
            'weak_concept_recovery' => 30,
            'mission_completion' => (int) ($ctx['mission_xp'] ?? 0),
            'mastery_milestone' => 50,
            default => 0,
        };
    }

    /**
     * @return array{xp_awarded:int,total_xp:int,level:int,level_title:string,level_progress_percent:int,new_badges:array}
     */
    public function award(int $userId, string $eventType, array $ctx = []): array
    {
        $base = $this->pointsFor($eventType, $ctx);
        $streakBonus = $this->streaks->updateMeaningfulActivity($this->profiles->getOrCreate($userId));
        $missionBonus = $this->missions->trackEvent($userId, $eventType);
        $xp = $base + $streakBonus + $missionBonus;

        XpEvent::create([
            'user_id' => $userId,
            'event_type' => $eventType,
            'xp_awarded' => $xp,
            'topic_id' => $ctx['topic_id'] ?? null,
            'concept_id' => $ctx['concept_id'] ?? null,
            'meta_json' => $ctx,
            'occurred_at' => now(),
        ]);
        $profile = $this->profiles->addXp($userId, $xp);
        $this->feed->push($userId, 'xp', strtoupper(str_replace('_', ' ', $eventType)), "XP awarded for {$eventType}", $xp, null, null, $ctx);

        $newBadges = $this->badges->evaluate($userId);
        foreach ($newBadges as $b) {
            if ($b['xp_reward'] > 0) {
                $profile = $this->profiles->addXp($userId, (int) $b['xp_reward']);
            }
            $this->feed->push($userId, 'badge', 'Badge unlocked', $b['name'], (int) $b['xp_reward'], (int) $b['id']);
        }

        return [
            'xp_awarded' => $xp,
            'total_xp' => (int) $profile->total_xp,
            'level' => (int) $profile->current_level,
            'level_title' => (string) $profile->level_title,
            'level_progress_percent' => (int) $profile->level_progress_percent,
            'new_badges' => $newBadges,
        ];
    }
}
