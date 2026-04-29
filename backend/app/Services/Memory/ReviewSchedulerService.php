<?php

namespace App\Services\Memory;

class ReviewSchedulerService
{
    /** Fixed SRS stages: same day, 1d, 3d, 7d, 14d, 30d, 60d */
    private array $stages = [0, 1, 3, 7, 14, 30, 60];

    /**
     * @return array{stage:int, interval_days:int}
     */
    public function nextSchedule(int $currentStage, string $quality): array
    {
        $quality = strtolower($quality);
        $stage = $currentStage;
        if ($quality === 'again') {
            $stage = max(0, $currentStage - 1);
        } elseif ($quality === 'hard') {
            $stage = max(1, $currentStage);
        } elseif ($quality === 'good') {
            $stage = min(count($this->stages) - 1, $currentStage + 1);
        } elseif ($quality === 'easy') {
            $stage = min(count($this->stages) - 1, $currentStage + 2);
        }

        return ['stage' => $stage, 'interval_days' => $this->stages[$stage] ?? 1];
    }
}
