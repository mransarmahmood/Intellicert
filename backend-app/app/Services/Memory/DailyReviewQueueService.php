<?php

namespace App\Services\Memory;

use App\Models\DailyReviewQueue;
use App\Models\Flashcard;
use Illuminate\Support\Collection;

class DailyReviewQueueService
{
    public function buildForUser(int $userId, int $limit = 25): Collection
    {
        $date = now()->toDateString();
        $dueCards = Flashcard::query()
            ->leftJoin('user_flashcard_reviews as ufr', function ($j) use ($userId) {
                $j->on('ufr.flashcard_id', '=', 'flashcards.id')->where('ufr.user_id', '=', $userId);
            })
            ->where(function ($q) {
                $q->whereNull('ufr.next_review_at')->orWhere('ufr.next_review_at', '<=', now());
            })
            ->orderByRaw('COALESCE(ufr.next_review_at, flashcards.created_at) asc')
            ->limit($limit)
            ->get(['flashcards.id as flashcard_id', 'flashcards.concept_id']);

        foreach ($dueCards as $row) {
            DailyReviewQueue::firstOrCreate([
                'user_id' => $userId,
                'queue_date' => $date,
                'concept_id' => $row->concept_id,
                'flashcard_id' => $row->flashcard_id,
            ], [
                'status' => 'pending',
                'priority' => 2,
            ]);
        }

        return DailyReviewQueue::with(['concept:id,title', 'flashcard:id,front,back'])
            ->where('user_id', $userId)
            ->whereDate('queue_date', $date)
            ->orderBy('status')
            ->orderBy('priority')
            ->get();
    }
}
