<?php

namespace App\Http\Controllers;

use App\Models\TopicExtra;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TopicExtraController extends Controller
{
    // Track 5 — 'occlusion' added: image occlusion cards stored as
    // topic_extras with content_json = { image_url, alt, regions: [{x,y,w,h,answer,group?}] }
    private const TYPES = ['mnemonic', 'examtip', 'formula', 'regulation', 'chapter', 'diagram', 'occlusion'];

    private function requireAdmin(Request $request): ?JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        if (!$user || !in_array($user->role, ['admin', 'superadmin'])) {
            return response()->json(['success' => false, 'error' => 'Admin access required'], 403);
        }
        return null;
    }

    public function index(Request $request): JsonResponse
    {
        $topicId = $request->input('topic_id');
        $query = TopicExtra::orderBy('topic_id')->orderBy('extra_type')->orderBy('sort_order');
        if ($topicId) $query->where('topic_id', $topicId);

        $extras = $query->get();
        return response()->json(['success' => true, 'extras' => $extras, 'total' => $extras->count()]);
    }

    public function store(Request $request): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) return $err;

        $data = $request->validate([
            'topic_id'     => 'required|integer|exists:topics,id',
            'extra_type'   => 'required|in:' . implode(',', self::TYPES),
            'content_json' => 'required',
            'sort_order'   => 'nullable|integer',
        ]);

        // Accept either an object/array or pre-encoded JSON string from the client
        if (is_array($data['content_json'])) {
            $data['content_json'] = json_encode($data['content_json'], JSON_UNESCAPED_UNICODE);
        }

        $extra = TopicExtra::create($data);
        return response()->json(['success' => true, 'extra' => $extra], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) return $err;

        $extra = TopicExtra::find($id);
        if (!$extra) return response()->json(['success' => false, 'error' => 'Extra not found'], 404);

        $data = $request->validate([
            'topic_id'     => 'sometimes|integer|exists:topics,id',
            'extra_type'   => 'sometimes|in:' . implode(',', self::TYPES),
            'content_json' => 'sometimes',
            'sort_order'   => 'nullable|integer',
        ]);

        if (isset($data['content_json']) && is_array($data['content_json'])) {
            $data['content_json'] = json_encode($data['content_json'], JSON_UNESCAPED_UNICODE);
        }

        $extra->update($data);
        return response()->json(['success' => true, 'extra' => $extra->fresh()]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) return $err;

        $extra = TopicExtra::find($id);
        if (!$extra) return response()->json(['success' => false, 'error' => 'Extra not found'], 404);

        $extra->delete();
        return response()->json(['success' => true, 'message' => 'Extra deleted']);
    }
}
