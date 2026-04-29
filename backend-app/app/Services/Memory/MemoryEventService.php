<?php

namespace App\Services\Memory;

use App\Models\MemoryEvent;

class MemoryEventService
{
    public function log(int $userId, string $eventType, array $payload = []): void
    {
        MemoryEvent::create([
            'user_id' => $userId,
            'topic_id' => $payload['topic_id'] ?? null,
            'concept_id' => $payload['concept_id'] ?? null,
            'flashcard_id' => $payload['flashcard_id'] ?? null,
            'event_type' => $eventType,
            'payload_json' => $payload,
            'occurred_at' => now(),
        ]);
    }
}
