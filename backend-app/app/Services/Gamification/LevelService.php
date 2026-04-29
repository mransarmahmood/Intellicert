<?php

namespace App\Services\Gamification;

class LevelService
{
    /**
     * Level formula: level n starts at 100*n*(n-1)/2 XP
     * @return array{level:int,title:string,progress_percent:int,xp_to_next:int}
     */
    public function fromXp(int $xp): array
    {
        $level = 1;
        while ($this->xpForLevelStart($level + 1) <= $xp) $level++;
        $start = $this->xpForLevelStart($level);
        $nextStart = $this->xpForLevelStart($level + 1);
        $inLevel = $xp - $start;
        $span = max(1, $nextStart - $start);
        $pct = (int) round(($inLevel / $span) * 100);
        return [
            'level' => $level,
            'title' => $this->titleForLevel($level),
            'progress_percent' => max(0, min(100, $pct)),
            'xp_to_next' => max(0, $nextStart - $xp),
        ];
    }

    private function xpForLevelStart(int $level): int
    {
        return (int) (100 * $level * ($level - 1) / 2);
    }

    private function titleForLevel(int $level): string
    {
        return match (true) {
            $level >= 40 => 'Certification Vanguard',
            $level >= 30 => 'Safety Systems Expert',
            $level >= 20 => 'Assessment Specialist',
            $level >= 10 => 'Applied Practitioner',
            default => 'Foundation Learner',
        };
    }
}
