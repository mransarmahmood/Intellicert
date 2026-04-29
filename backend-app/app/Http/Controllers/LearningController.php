<?php

namespace App\Http\Controllers;

use App\Models\LearningStep;
use App\Models\Topic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LearningController extends Controller
{
    private function buildGeneratedStepContent(Topic $topic, string $stepType): array
    {
        $conceptTitles = $topic->concepts
            ->pluck('title')
            ->filter(fn ($v) => is_string($v) && trim($v) !== '')
            ->map(fn ($v) => trim($v))
            ->values();

        $topicName = $topic->name;
        $first = $conceptTitles->get(0, $topicName);
        $second = $conceptTitles->get(1, $topicName . ' controls');
        $third = $conceptTitles->get(2, $topicName . ' verification');

        $base = ['_auto_generated' => true];

        return match ($stepType) {
            'hook' => $base + [
                'title' => "Why {$topicName} matters",
                'body' => "Start by linking {$topicName} to a real workplace risk. Focus on {$first} and {$second}.",
            ],
            'try' => $base + [
                'title' => 'Try first',
                'question' => "In one sentence, what is the purpose of {$topicName}?",
                'answer' => "{$topicName} prevents incidents by applying {$first} and {$second} before hazards escalate.",
            ],
            'core' => $base + [
                'title' => 'Core concept',
                'body' => "Explain {$topicName} using these concept anchors: {$first}, {$second}, {$third}.",
            ],
            'visual' => $base + [
                'title' => 'Visual map',
                'body' => "{$first} -> {$second} -> {$third} -> review and reinforce.",
            ],
            'example' => $base + [
                'title' => 'Real example',
                'body' => "Describe one real case where {$topicName} changed a decision and improved outcomes.",
            ],
            'memory' => $base + [
                'title' => 'Memory anchor',
                'body' => "Create a mnemonic from {$first}, {$second}, {$third}.",
            ],
            'recall' => $base + [
                'title' => 'Recall check',
                'question' => "Which option is a core concept in {$topicName}?",
                'options' => [$first, "{$topicName} archive checklist", "{$topicName} attendance log", "{$topicName} yearly poster"],
                'correct_index' => 0,
            ],
            'apply' => $base + [
                'title' => 'Apply in scenario',
                'question' => "A team is weak on {$first}. What is the best first step using {$topicName}?",
                'options' => [
                    "Wait and review next quarter",
                    "Apply {$topicName} controls to {$first} and verify implementation",
                    "Document only, no process changes",
                    "Skip analysis and retrain everyone immediately",
                ],
                'correct_index' => 1,
            ],
            'teach' => $base + [
                'title' => 'Teach-back',
                'body' => "Teach {$topicName} to a teammate using {$first}, {$second}, and one practical example.",
            ],
            'summary' => $base + [
                'title' => 'Summary',
                'body' => "Write 3 bullets: what {$topicName} is, how to apply {$first}/{$second}, and one mistake to avoid.",
            ],
            default => $base + ['title' => ucfirst($stepType), 'body' => "Review {$topicName}."],
        };
    }

    private function requireAdmin(Request $request): ?JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        if (!$user || !in_array($user->role, ['admin', 'superadmin'])) {
            return response()->json(['success' => false, 'error' => 'Admin access required'], 403);
        }
        return null;
    }

    /**
     * GET /api/topics/{topicId}/learning-steps
     * Returns the 10 step slots in canonical order, with content_json
     * (or empty placeholder if not yet authored).
     */
    public function index(int $topicId): JsonResponse
    {
        $topic = Topic::with('concepts:id,topic_id,title')->find($topicId);
        if (!$topic) {
            return response()->json(['success' => false, 'error' => 'Topic not found'], 404);
        }

        $existing = LearningStep::where('topic_id', $topicId)->get()->keyBy('step_type');

        $steps = [];
        $generatedCount = 0;
        $authoredCount = 0;
        foreach (LearningStep::STEP_TYPES as $i => $type) {
            $row = $existing->get($type);
            if (!$row) {
                $row = LearningStep::create([
                    'topic_id' => $topicId,
                    'step_type' => $type,
                    'content_json' => $this->buildGeneratedStepContent($topic, $type),
                ]);
            }
            $isGenerated = (bool) data_get($row->content_json, '_auto_generated', false);
            if ($isGenerated) {
                $generatedCount++;
            } else {
                $authoredCount++;
            }
            $steps[] = [
                'id'           => $row->id ?? null,
                'topic_id'     => $topicId,
                'step_type'    => $type,
                'order'        => $i + 1,
                'content_json' => $row->content_json ?? null,
                'authored'     => !$isGenerated,
            ];
        }

        return response()->json([
            'success'        => true,
            'topic'          => ['id' => $topic->id, 'name' => $topic->name],
            'steps'          => $steps,
            'authored_count' => $authoredCount,
            'generated_count' => $generatedCount,
            'total'          => count(LearningStep::STEP_TYPES),
        ]);
    }

    /**
     * PUT /api/topics/{topicId}/learning-steps/{stepType}
     * Upsert one step.
     * body: { content_json: { title, body, ?image_url, ?question, ?answer, ?options, ?correct_index } }
     */
    public function upsert(Request $request, int $topicId, string $stepType): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) return $err;

        if (!in_array($stepType, LearningStep::STEP_TYPES, true)) {
            return response()->json(['success' => false, 'error' => 'Invalid step_type'], 400);
        }
        if (!Topic::where('id', $topicId)->exists()) {
            return response()->json(['success' => false, 'error' => 'Topic not found'], 404);
        }

        $data = $request->validate([
            'content_json' => 'required',
        ]);

        $step = LearningStep::updateOrCreate(
            ['topic_id' => $topicId, 'step_type' => $stepType],
            ['content_json' => array_merge($data['content_json'], ['_auto_generated' => false])]
        );

        return response()->json(['success' => true, 'step' => $step]);
    }

    /**
     * DELETE /api/topics/{topicId}/learning-steps/{stepType}
     */
    public function destroy(Request $request, int $topicId, string $stepType): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) return $err;

        $deleted = LearningStep::where('topic_id', $topicId)
            ->where('step_type', $stepType)
            ->delete();

        return response()->json(['success' => true, 'deleted' => $deleted]);
    }
}
