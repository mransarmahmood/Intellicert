<?php

namespace Database\Seeders;

use App\Models\Mission;
use Illuminate\Database\Seeder;

class GamificationMissionsSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            ['code' => 'daily_steps_3', 'name' => 'Complete 3 lesson steps', 'type' => 'daily', 'event_type' => 'lesson_step_completion', 'target_count' => 3, 'xp_reward' => 30],
            ['code' => 'daily_reviews_10', 'name' => 'Review 10 flashcards', 'type' => 'daily', 'event_type' => 'flashcard_review', 'target_count' => 10, 'xp_reward' => 40],
            ['code' => 'daily_quiz_5', 'name' => 'Finish 5 quiz items', 'type' => 'daily', 'event_type' => 'quiz_completion', 'target_count' => 5, 'xp_reward' => 35],
            ['code' => 'weekly_exam_1', 'name' => 'Complete 1 mock exam', 'type' => 'weekly', 'event_type' => 'mock_exam_completion', 'target_count' => 1, 'xp_reward' => 120],
            ['code' => 'weekly_concepts_5', 'name' => 'Master 5 concepts', 'type' => 'weekly', 'event_type' => 'concept_completion', 'target_count' => 5, 'xp_reward' => 150],
        ];
        foreach ($rows as $r) {
            Mission::updateOrCreate(['code' => $r['code']], [
                'name' => $r['name'],
                'type' => $r['type'],
                'event_type' => $r['event_type'],
                'target_count' => $r['target_count'],
                'xp_reward' => $r['xp_reward'],
                'rules_json' => null,
                'is_active' => true,
            ]);
        }
    }
}
