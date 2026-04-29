<?php

namespace App\Services\Memory;

class RecallScoringService
{
    /**
     * @return array{recall_score:int, correct:bool}
     */
    public function fromQuality(string $quality): array
    {
        return match (strtolower($quality)) {
            'again' => ['recall_score' => 25, 'correct' => false],
            'hard'  => ['recall_score' => 50, 'correct' => false],
            'good'  => ['recall_score' => 75, 'correct' => true],
            'easy'  => ['recall_score' => 90, 'correct' => true],
            default => ['recall_score' => 60, 'correct' => false],
        };
    }
}
