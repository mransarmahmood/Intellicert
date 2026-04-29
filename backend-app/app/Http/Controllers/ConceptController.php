<?php

namespace App\Http\Controllers;

use App\Models\Concept;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConceptController extends Controller
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
        $topicId = $request->input('topic_id');
        $query = Concept::orderBy('topic_id')->orderBy('sort_order');
        if ($topicId) $query->where('topic_id', $topicId);

        $concepts = $query->get();
        return response()->json(['success' => true, 'concepts' => $concepts, 'total' => $concepts->count()]);
    }

    public function store(Request $request): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) return $err;

        $data = $request->validate([
            'topic_id'    => 'required|integer|exists:topics,id',
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'image_url'   => 'nullable|string|max:500',
            'sort_order'  => 'nullable|integer',
        ]);

        $concept = Concept::create($data);
        return response()->json(['success' => true, 'concept' => $concept], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) return $err;

        $concept = Concept::find($id);
        if (!$concept) return response()->json(['success' => false, 'error' => 'Concept not found'], 404);

        $data = $request->validate([
            'topic_id'    => 'sometimes|integer|exists:topics,id',
            'title'       => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'image_url'   => 'nullable|string|max:500',
            'sort_order'  => 'nullable|integer',
        ]);

        $concept->update($data);
        return response()->json(['success' => true, 'concept' => $concept->fresh()]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) return $err;

        $concept = Concept::find($id);
        if (!$concept) return response()->json(['success' => false, 'error' => 'Concept not found'], 404);

        $concept->delete();
        return response()->json(['success' => true, 'message' => 'Concept deleted']);
    }
}
