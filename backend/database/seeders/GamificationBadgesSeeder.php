<?php

namespace Database\Seeders;

use App\Models\Badge;
use Illuminate\Database\Seeder;

class GamificationBadgesSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            ['code' => 'first_step', 'name' => 'First Step', 'category' => 'learning', 'xp_reward' => 20, 'criteria_json' => ['min_xp' => 8]],
            ['code' => 'streak_7', 'name' => '7-Day Consistency', 'category' => 'consistency', 'xp_reward' => 50, 'criteria_json' => ['min_streak' => 7]],
            ['code' => 'streak_30', 'name' => '30-Day Consistency', 'category' => 'consistency', 'xp_reward' => 200, 'criteria_json' => ['min_streak' => 30]],
            ['code' => 'xp_1000', 'name' => 'Momentum Builder', 'category' => 'learning', 'xp_reward' => 75, 'criteria_json' => ['min_xp' => 1000]],
            ['code' => 'quiz_accuracy_80', 'name' => 'Assessment Sharp', 'category' => 'assessment', 'xp_reward' => 120, 'criteria_json' => ['quiz_accuracy_30d' => 80]],
        ];

        foreach ($rows as $r) {
            Badge::updateOrCreate(['code' => $r['code']], [
                'name' => $r['name'],
                'category' => $r['category'],
                'description' => $r['name'],
                'icon' => 'award',
                'xp_reward' => $r['xp_reward'],
                'criteria_json' => $r['criteria_json'],
                'is_active' => true,
            ]);
        }
    }
}
