<?php

namespace App\Http\Controllers;

use App\Models\MasteryCategory;
use App\Models\MasteryItem;
use App\Models\MasteryTopic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Mastery Library — public reads (gated to premium tiers via the
 * mastery.access middleware).
 *
 * Routes:
 *   GET  /api/mastery/categories          → 9 categories with topic counts
 *   GET  /api/mastery/topics              → All live mastery topics (lightweight)
 *   GET  /api/mastery/topics/{id}         → Full 18-element payload for one topic
 *   GET  /api/mastery/topics/{id}/items   → Mastery items (rationales gated UI-side)
 *
 *   POST /api/mastery/topics/{id}/progress  → Update learner progress on a topic
 */
class MasteryController extends Controller
{
    public function categories(): JsonResponse
    {
        $cats = MasteryCategory::with(['topics' => function ($q) {
            $q->select('id', 'mastery_id', 'mastery_category_code', 'slug', 'name',
                       'primary_blueprint_code', 'is_calculation_topic', 'status',
                       'mastery_threshold', 'sort_order')
              ->orderBy('sort_order');
        }])->orderBy('sort_order')->get();

        return response()->json(['success' => true, 'categories' => $cats]);
    }

    public function topicsIndex(Request $request): JsonResponse
    {
        $category = $request->input('category');
        $status   = $request->input('status', 'mastery_gold');

        $query = MasteryTopic::query()
            ->select('id', 'mastery_id', 'mastery_category_code', 'slug', 'name',
                     'subtitle', 'primary_blueprint_code', 'secondary_blueprint_code',
                     'is_calculation_topic', 'mastery_threshold', 'status', 'sort_order')
            ->orderBy('sort_order');

        if ($category) $query->where('mastery_category_code', $category);
        // Admins can pass status=any to see drafts; learners only see gold.
        $user = $request->attributes->get('auth_user');
        $isAdmin = $user && in_array($user->role, ['admin', 'superadmin']);
        if ($status !== 'any') {
            $query->where('status', $status);
        } elseif (!$isAdmin) {
            $query->where('status', 'mastery_gold');
        }

        $topics = $query->get();
        return response()->json(['success' => true, 'topics' => $topics, 'total' => $topics->count()]);
    }

    public function topicShow(Request $request, string $masteryId): JsonResponse
    {
        $topic = MasteryTopic::with(['category:id,code,name'])
            ->where('mastery_id', $masteryId)
            ->first();

        if (!$topic) {
            return response()->json(['success' => false, 'error' => 'Mastery topic not found'], 404);
        }

        // Hide draft content from non-admins.
        $user = $request->attributes->get('auth_user');
        $isAdmin = $user && in_array($user->role, ['admin', 'superadmin']);
        if ($topic->status !== 'mastery_gold' && !$isAdmin) {
            return response()->json([
                'success' => false,
                'error'   => 'Mastery topic not yet released.',
            ], 404);
        }

        return response()->json(['success' => true, 'topic' => $topic]);
    }

    public function items(Request $request, string $masteryId): JsonResponse
    {
        $topic = MasteryTopic::where('mastery_id', $masteryId)->first();
        if (!$topic) {
            return response()->json(['success' => false, 'error' => 'Mastery topic not found'], 404);
        }
        $items = MasteryItem::where('mastery_topic_id', $topic->id)
            ->where('status', 'mastery_gold')
            ->orderBy('sort_order')
            ->get();
        return response()->json(['success' => true, 'items' => $items, 'total' => $items->count()]);
    }

    public function recordProgress(Request $request, string $masteryId): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $topic = MasteryTopic::where('mastery_id', $masteryId)->first();
        if (!$topic) {
            return response()->json(['success' => false, 'error' => 'Mastery topic not found'], 404);
        }

        $data = $request->validate([
            'mastery_percent'                 => 'sometimes|numeric|between:0,100',
            'method_card_downloaded'          => 'sometimes|boolean',
            'decision_tree_completed'         => 'sometimes|boolean',
            'calculation_sandbox_completed'   => 'sometimes|boolean',
            'application_workshop_completed'  => 'sometimes|boolean',
            'item_correct'                    => 'sometimes|boolean',
        ]);

        $now = now();
        $updates = $data;
        $updates['last_attempt_at'] = $now;

        $existing = \DB::table('mastery_progress')
            ->where('user_id', $user->id)
            ->where('mastery_topic_id', $topic->id)
            ->first();

        if (!$existing) {
            \DB::table('mastery_progress')->insert(array_merge([
                'user_id'           => $user->id,
                'mastery_topic_id'  => $topic->id,
                'first_attempt_at'  => $now,
                'created_at'        => $now,
                'updated_at'        => $now,
                'items_attempted'   => isset($data['item_correct']) ? 1 : 0,
                'items_correct'     => !empty($data['item_correct']) ? 1 : 0,
            ], $updates));
        } else {
            $itemsAttempted = (int) $existing->items_attempted + (isset($data['item_correct']) ? 1 : 0);
            $itemsCorrect   = (int) $existing->items_correct   + (!empty($data['item_correct']) ? 1 : 0);
            $masteredAt = ($existing->mastered_at) ? $existing->mastered_at
                : (($updates['mastery_percent'] ?? 0) >= ($topic->mastery_threshold * 100) ? $now : null);

            \DB::table('mastery_progress')
                ->where('id', $existing->id)
                ->update(array_merge($updates, [
                    'items_attempted' => $itemsAttempted,
                    'items_correct'   => $itemsCorrect,
                    'mastered_at'     => $masteredAt,
                    'updated_at'      => $now,
                ]));
        }

        return response()->json(['success' => true]);
    }
}
