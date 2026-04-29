<?php

namespace App\Services\Readiness;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

/**
 * Track 3 — calibrated pass-probability for a learner.
 *
 * Replaces the previous 0.7×mastery + queue-factor formula with an estimate
 * built from four signals:
 *
 *   weighted_mastery   = Σ domain_mastery × domain.weight / Σ weight
 *   exam_simulation    = best of last 3 timed exam scores (or domain-quiz
 *                        score × 0.7 if no full sims yet)
 *   recency            = sigmoid((quiz_attempts_last_14d - 50) / 20)
 *   srs_strength       = avg(repetitions / max_reps) clamped 0..1
 *
 *   composite          = 0.45·weighted_mastery
 *                      + 0.30·exam_simulation
 *                      + 0.15·recency × 100
 *                      + 0.10·srs_strength × 100
 *
 *   pass_probability   = sigmoid((composite - 70) / 8)
 *
 * Calibration constants (70 / 8) are placeholders. Once historical pass-rate
 * data exists, swap to a logistic regression fit on actual exam outcomes.
 *
 * Returned breakdown is suitable for direct use on the dashboard:
 *   - composite score (0-100, the public "readiness")
 *   - pass probability (0-1)
 *   - per-domain mastery (for the radar chart)
 *   - top weak domain (for the "what to study next" CTA)
 */
class PassProbabilityCalculator
{
    public function compute(int $userId): array
    {
        $perDomain     = $this->perDomainMastery($userId);
        $weightedMast  = $this->weightedMastery($perDomain);
        $examSim       = $this->examSimulation($userId);
        $recency       = $this->recency($userId);
        $srsStrength   = $this->srsStrength($userId);

        $composite = round(
            0.45 * $weightedMast
          + 0.30 * $examSim
          + 0.15 * $recency * 100
          + 0.10 * $srsStrength * 100,
            1
        );
        $composite = max(0.0, min(100.0, (float) $composite));

        $passProbability = $this->sigmoid(($composite - 70.0) / 8.0);

        $weakest = $this->weakestDomain($perDomain);

        return [
            'composite_score'  => (int) round($composite),
            'pass_probability' => round($passProbability, 3),
            'breakdown' => [
                'weighted_mastery' => (int) round($weightedMast),
                'exam_simulation'  => (int) round($examSim),
                'recency'          => round($recency, 3),
                'srs_strength'     => round($srsStrength, 3),
            ],
            'per_domain'       => $perDomain,
            'weakest_domain'   => $weakest,
            'computed_at'      => now()->toIso8601String(),
        ];
    }

    /**
     * @return array<int, array{domain_id:string, name:string, weight:float, mastery:float}>
     */
    private function perDomainMastery(int $userId): array
    {
        $rows = DB::table('concept_mastery as cm')
            ->join('concepts as c', 'c.id', '=', 'cm.concept_id')
            ->join('topics as t', 't.id', '=', 'c.topic_id')
            ->join('domains as d', 'd.id', '=', 't.domain_id')
            ->where('cm.user_id', $userId)
            ->select('d.id as domain_id', 'd.name', 'd.weight', DB::raw('AVG(cm.mastery_score) as mastery'))
            ->groupBy('d.id', 'd.name', 'd.weight')
            ->orderBy('d.number')
            ->get();

        return $rows->map(fn ($r) => [
            'domain_id' => (string) $r->domain_id,
            'name'      => (string) $r->name,
            'weight'    => (float) $r->weight,
            'mastery'   => round((float) $r->mastery, 1),
        ])->all();
    }

    private function weightedMastery(array $perDomain): float
    {
        $weightTotal = 0.0;
        $masteryTotal = 0.0;
        foreach ($perDomain as $row) {
            $weightTotal  += $row['weight'];
            $masteryTotal += $row['weight'] * $row['mastery'];
        }
        if ($weightTotal <= 0) return 0.0;
        return $masteryTotal / $weightTotal;
    }

    /**
     * Best of the last 3 timed simulation results, or fallback to recent
     * quiz accuracy × 0.7 if no full sims have been taken.
     */
    private function examSimulation(int $userId): float
    {
        // Full simulations are recorded in learning_events with event_type='exam_simulation_completed'.
        // Pull score from meta_json if present; otherwise fall back to per-quiz accuracy.
        $sims = DB::table('learning_events')
            ->where('user_id', $userId)
            ->where('event_type', 'exam_simulation_completed')
            ->orderByDesc('created_at')
            ->limit(3)
            ->pluck('meta_json');

        $scores = [];
        foreach ($sims as $json) {
            $data = is_string($json) ? json_decode($json, true) : $json;
            if (isset($data['score_pct'])) $scores[] = (float) $data['score_pct'];
        }

        if (!empty($scores)) {
            return max($scores);
        }

        // Fallback: recent quiz attempts scaled.
        $row = DB::table('quiz_attempts')
            ->where('user_id', $userId)
            ->where('taken_at', '>=', now()->subDays(30))
            ->selectRaw('AVG(correct) * 100 as accuracy, COUNT(*) as n')
            ->first();
        if (!$row || (int) $row->n < 5) return 0.0;
        return ((float) $row->accuracy) * 0.7;
    }

    /**
     * Sigmoid curve over recent activity volume. 50 attempts/14d ≈ 0.5.
     */
    private function recency(int $userId): float
    {
        $count = (int) DB::table('quiz_attempts')
            ->where('user_id', $userId)
            ->where('taken_at', '>=', now()->subDays(14))
            ->count();
        return $this->sigmoid(($count - 50.0) / 20.0);
    }

    /**
     * Average concept retention strength based on SRS repetitions and last-review recency.
     */
    private function srsStrength(int $userId): float
    {
        $rows = DB::table('concept_mastery')
            ->where('user_id', $userId)
            ->select(['repetitions', 'mastery_score', 'next_review_at'])
            ->get();
        if ($rows->isEmpty()) return 0.0;

        $score = 0.0;
        foreach ($rows as $r) {
            $reps = max(0, min(8, (int) $r->repetitions)) / 8.0;
            $mast = max(0, min(100, (int) $r->mastery_score)) / 100.0;
            $score += 0.5 * $reps + 0.5 * $mast;
        }
        return $score / $rows->count();
    }

    /**
     * @param array<int, array{domain_id:string, name:string, weight:float, mastery:float}> $perDomain
     * @return array{domain_id:string, name:string, mastery:float}|null
     */
    private function weakestDomain(array $perDomain): ?array
    {
        if (empty($perDomain)) return null;
        $weakest = $perDomain[0];
        foreach ($perDomain as $row) {
            if ($row['mastery'] < $weakest['mastery']) $weakest = $row;
        }
        return [
            'domain_id' => $weakest['domain_id'],
            'name'      => $weakest['name'],
            'mastery'   => $weakest['mastery'],
        ];
    }

    private function sigmoid(float $x): float
    {
        return 1.0 / (1.0 + exp(-$x));
    }
}
