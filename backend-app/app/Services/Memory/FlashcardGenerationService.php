<?php

namespace App\Services\Memory;

use App\Models\Concept;
use App\Models\Flashcard;

class FlashcardGenerationService
{
    /**
     * @return int number of new cards
     */
    public function generateStarterCards(Concept $concept, ?string $domainId = null): int
    {
        $base = 'mem-c-' . $concept->id . '-';
        $created = 0;
        $cards = [
            [
                'key' => $base . '1',
                'front' => "Define: {$concept->title}",
                'back' => trim((string) $concept->description) !== '' ? (string) $concept->description : "Explain {$concept->title} in simple and practical terms.",
                'type' => 'definition',
            ],
            [
                'key' => $base . '2',
                'front' => "Apply {$concept->title} in a real CSP scenario.",
                'back' => "Describe one workplace case where {$concept->title} changes the risk-control decision and outcome.",
                'type' => 'application',
            ],
            [
                'key' => $base . '3',
                'front' => "What is a common mistake with {$concept->title}?",
                'back' => "Name one error and how to prevent it during implementation.",
                'type' => 'mistake',
            ],
        ];

        foreach ($cards as $c) {
            if (Flashcard::where('card_key', $c['key'])->exists()) continue;
            Flashcard::create([
                'card_key' => $c['key'],
                'domain_id' => $domainId,
                'concept_id' => $concept->id,
                'source' => 'memory_engine',
                'card_type' => $c['type'],
                'front' => $c['front'],
                'back' => $c['back'],
                'image_url' => null,
            ]);
            $created++;
        }

        return $created;
    }
}
