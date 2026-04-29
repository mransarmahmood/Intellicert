<?php

namespace App\Data;

use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/**
 * A topic with its hierarchy (domain) and content (concepts + extras).
 * Returned by /api/topics/{id} and listings.
 *
 * The 9-layer anatomy fields (hook_text, learning_objectives_json,
 * worked_example_json, field_application_json) are nullable until
 * content authoring backfills them. The 30 pilot topics get full
 * content; remaining topics keep their existing flow.
 */
#[TypeScript]
class TopicData
{
    /**
     * @param ConceptData[]|null $concepts
     * @param TopicExtraData[]|null $extras
     * @param array<int, array{verb: string, statement: string, bloom_level: int, sub_domain_code: ?string}>|null $learning_objectives
     */
    public function __construct(
        public int $id,
        public string $name,
        public ?string $subtitle,
        public ?string $overview,
        public ?string $image_url,
        public string $topic_key,
        public string $domain_id,
        public int $sort_order,
        public ?DomainData $domain = null,
        public ?array $concepts = null,
        public ?array $extras = null,
        public ?string $hook_text = null,
        public ?string $hook_image_url = null,
        public ?array $learning_objectives = null,
        public mixed $worked_example = null,
        public mixed $field_application = null,
        public float $mastery_threshold = 0.85,
    ) {
    }
}
