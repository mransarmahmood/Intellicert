<?php

namespace App\Http\Controllers;

use App\Models\Topic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TopicController extends Controller
{
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
        $domainId = $request->input('domain_id');
        $search   = trim((string) $request->input('search', ''));

        $query = Topic::with('domain:id,name,number')->orderBy('domain_id')->orderBy('sort_order');

        if ($domainId) {
            $query->where('domain_id', $domainId);
        }
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('topic_key', 'like', "%{$search}%")
                  ->orWhere('subtitle', 'like', "%{$search}%");
            });
        }

        $topics = $query->get();
        return response()->json([
            'success' => true,
            'topics'  => $topics,
            'total'   => $topics->count(),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $topic = Topic::with(['domain:id,name,number', 'concepts', 'extras'])->find($id);
        if (!$topic) {
            return response()->json(['success' => false, 'error' => 'Topic not found'], 404);
        }
        return response()->json(['success' => true, 'topic' => $topic]);
    }

    public function store(Request $request): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) return $err;

        $data = $request->validate([
            'domain_id'  => 'required|string|exists:domains,id',
            'topic_key'  => 'required|string|max:50',
            'name'       => 'required|string|max:255',
            'subtitle'   => 'nullable|string',
            'icon'       => 'nullable|string|max:50',
            'overview'   => 'nullable|string',
            'image_url'  => 'nullable|string|max:500',
            'sort_order' => 'nullable|integer',
        ]);

        $exists = Topic::where('domain_id', $data['domain_id'])
            ->where('topic_key', $data['topic_key'])
            ->exists();
        if ($exists) {
            return response()->json([
                'success' => false,
                'error'   => 'A topic with that key already exists in this domain',
            ], 409);
        }

        $topic = Topic::create($data);
        return response()->json(['success' => true, 'topic' => $topic], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) return $err;

        $topic = Topic::find($id);
        if (!$topic) {
            return response()->json(['success' => false, 'error' => 'Topic not found'], 404);
        }

        $data = $request->validate([
            'domain_id'  => 'sometimes|string|exists:domains,id',
            'topic_key'  => 'sometimes|string|max:50',
            'name'       => 'sometimes|string|max:255',
            'subtitle'   => 'nullable|string',
            'icon'       => 'nullable|string|max:50',
            'overview'   => 'nullable|string',
            'image_url'  => 'nullable|string|max:500',
            'sort_order' => 'nullable|integer',
        ]);

        $topic->update($data);
        return response()->json(['success' => true, 'topic' => $topic->fresh()]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) return $err;

        $topic = Topic::find($id);
        if (!$topic) {
            return response()->json(['success' => false, 'error' => 'Topic not found'], 404);
        }
        $topic->delete();
        return response()->json(['success' => true, 'message' => 'Topic deleted']);
    }
}
