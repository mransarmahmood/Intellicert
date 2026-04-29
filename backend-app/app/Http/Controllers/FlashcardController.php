<?php

namespace App\Http\Controllers;

use App\Models\Flashcard;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FlashcardController extends Controller
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

        $query = Flashcard::with('domain:id,name,number')->orderByDesc('id');

        if ($domainId) $query->where('domain_id', $domainId);
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('front', 'like', "%{$search}%")
                  ->orWhere('back', 'like', "%{$search}%")
                  ->orWhere('card_key', 'like', "%{$search}%");
            });
        }

        $cards = $query->get();
        return response()->json(['success' => true, 'flashcards' => $cards, 'total' => $cards->count()]);
    }

    public function store(Request $request): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) return $err;

        $data = $request->validate([
            'card_key'  => 'required|string|max:30|unique:flashcards,card_key',
            'domain_id' => 'required|string|exists:domains,id',
            'front'     => 'required|string',
            'back'      => 'required|string',
            'image_url' => 'nullable|string|max:500',
        ]);

        $card = Flashcard::create($data);
        return response()->json(['success' => true, 'flashcard' => $card], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) return $err;

        $card = Flashcard::find($id);
        if (!$card) return response()->json(['success' => false, 'error' => 'Flashcard not found'], 404);

        $data = $request->validate([
            'card_key'  => 'sometimes|string|max:30|unique:flashcards,card_key,' . $id,
            'domain_id' => 'sometimes|string|exists:domains,id',
            'front'     => 'sometimes|string',
            'back'      => 'sometimes|string',
            'image_url' => 'nullable|string|max:500',
        ]);

        $card->update($data);
        return response()->json(['success' => true, 'flashcard' => $card->fresh()]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) return $err;

        $card = Flashcard::find($id);
        if (!$card) return response()->json(['success' => false, 'error' => 'Flashcard not found'], 404);

        $card->delete();
        return response()->json(['success' => true, 'message' => 'Flashcard deleted']);
    }
}
