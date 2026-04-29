<?php

namespace App\Services\Memory;

use Carbon\Carbon;

class ForgettingRiskService
{
    public function calculate(?Carbon $nextReviewAt, int $retentionScore): string
    {
        if (!$nextReviewAt) return 'moderate';
        $hours = now()->diffInHours($nextReviewAt, false);
        if ($hours <= -24 || $retentionScore < 35) return 'critical';
        if ($hours <= 0 || $retentionScore < 50) return 'high';
        if ($hours <= 24 || $retentionScore < 70) return 'moderate';
        return 'low';
    }
}
