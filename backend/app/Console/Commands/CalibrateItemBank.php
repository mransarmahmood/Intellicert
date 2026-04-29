<?php

namespace App\Console\Commands;

use App\Models\QuizCalibration;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Computes per-item psychometrics from the existing quiz_attempts table
 * and caches them in quiz_calibrations.
 *
 * Run nightly. No schema change to quiz_attempts required.
 *
 *   php artisan calibrate:item-bank          (all items)
 *   php artisan calibrate:item-bank --quiz=123  (one item)
 */
class CalibrateItemBank extends Command
{
    protected $signature = 'calibrate:item-bank {--quiz= : Calibrate only this quiz id} {--min-attempts=10 : Skip items with fewer attempts}';

    protected $description = 'Compute p-value, discrimination index, and distractor performance from quiz_attempts.';

    public function handle(): int
    {
        $minAttempts = (int) $this->option('min-attempts');
        $quizId = $this->option('quiz');

        $query = DB::table('quizzes')->select('id');
        if ($quizId) $query->where('id', (int) $quizId);
        $quizIds = $query->pluck('id');

        $this->info("Calibrating " . count($quizIds) . " items (min attempts: $minAttempts)…");

        $skipped = 0;
        $bar = $this->output->createProgressBar(count($quizIds));
        $bar->start();

        foreach ($quizIds as $id) {
            $stats = $this->computeStats((int) $id, $minAttempts);
            if ($stats === null) { $skipped++; $bar->advance(); continue; }

            QuizCalibration::updateOrCreate(
                ['quiz_id' => (int) $id],
                array_merge($stats, ['computed_at' => now()])
            );
            $bar->advance();
        }
        $bar->finish();
        $this->newLine();
        $this->info("Done. " . (count($quizIds) - $skipped) . " calibrated, $skipped skipped (insufficient attempts).");
        return self::SUCCESS;
    }

    /**
     * @return array{attempts:int, p_value:float, discrimination:float, distractor_choice_pct:array, avg_seconds:?float}|null
     */
    private function computeStats(int $quizId, int $minAttempts): ?array
    {
        // Pull all attempts for this item along with the user's overall accuracy
        // (used for the discrimination index — top vs bottom 27%).
        $attempts = DB::table('quiz_attempts as a')
            ->where('a.quiz_id', $quizId)
            ->select('a.user_id', 'a.picked_index', 'a.correct', 'a.taken_at')
            ->get();

        if ($attempts->count() < $minAttempts) return null;

        // p-value
        $correctCount = $attempts->where('correct', 1)->count();
        $pValue = $correctCount / $attempts->count();

        // Distractor performance — proportion picking each option
        $picks = [0, 0, 0, 0];
        foreach ($attempts as $a) {
            $idx = (int) $a->picked_index;
            if ($idx >= 0 && $idx <= 3) $picks[$idx]++;
        }
        $total = max(1, $attempts->count());
        $distractor = [
            'a' => round($picks[0] / $total, 4),
            'b' => round($picks[1] / $total, 4),
            'c' => round($picks[2] / $total, 4),
            'd' => round($picks[3] / $total, 4),
        ];

        // Discrimination — top 27% vs bottom 27% by overall accuracy.
        $userIds = $attempts->pluck('user_id')->unique();
        $accuracyByUser = DB::table('quiz_attempts')
            ->whereIn('user_id', $userIds)
            ->select('user_id', DB::raw('AVG(correct) as acc'))
            ->groupBy('user_id')
            ->pluck('acc', 'user_id');

        $sorted = $accuracyByUser->sort()->values();
        $n = $sorted->count();
        if ($n < 4) {
            $discrimination = 0.0;
        } else {
            $cutoff = (int) max(1, floor($n * 0.27));
            $bottomThreshold = $sorted->slice(0, $cutoff)->last();
            $topThreshold    = $sorted->slice(-$cutoff)->first();

            $topUsers    = $accuracyByUser->filter(fn($a) => $a >= $topThreshold)->keys();
            $bottomUsers = $accuracyByUser->filter(fn($a) => $a <= $bottomThreshold)->keys();

            $topCorrect    = $attempts->whereIn('user_id', $topUsers)->where('correct', 1)->count();
            $bottomCorrect = $attempts->whereIn('user_id', $bottomUsers)->where('correct', 1)->count();
            $topAttempts    = max(1, $attempts->whereIn('user_id', $topUsers)->count());
            $bottomAttempts = max(1, $attempts->whereIn('user_id', $bottomUsers)->count());

            $discrimination = ($topCorrect / $topAttempts) - ($bottomCorrect / $bottomAttempts);
        }

        // Avg seconds (only available if learning_events tracked time_spent_ms)
        $avgSeconds = DB::table('learning_events')
            ->where('event_type', 'quiz_attempt')
            ->where('meta_json', 'like', '%"quiz_id":' . $quizId . '%')
            ->avg(DB::raw('time_spent_ms / 1000'));

        return [
            'attempts'              => $attempts->count(),
            'p_value'               => round($pValue, 4),
            'discrimination'        => round($discrimination, 4),
            'distractor_choice_pct' => $distractor,
            'avg_seconds'           => $avgSeconds ? round((float) $avgSeconds, 2) : null,
        ];
    }
}
