<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Universal user notes — polymorphic per (ref_type, ref_id).
 * Authenticated student endpoints. Each user owns their own notes.
 */
class NotesController extends Controller
{
    private const ALLOWED_REF_TYPES = ['topic', 'concept', 'flashcard', 'quiz', 'formula', 'regulation'];

    /**
     * GET /api/notes?ref_type=topic&ref_id=ptd
     * GET /api/notes  (returns all of current user's notes)
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $q = DB::table('user_notes')->where('user_id', $user->id);

        if ($refType = $request->query('ref_type')) {
            if (!in_array($refType, self::ALLOWED_REF_TYPES, true)) {
                return response()->json(['success' => false, 'error' => 'Invalid ref_type'], 400);
            }
            $q->where('ref_type', $refType);
        }
        if ($refId = $request->query('ref_id')) {
            $q->where('ref_id', $refId);
        }

        $notes = $q->orderByDesc('updated_at')->limit(500)->get()->map(function ($n) {
            return [
                'id'         => (int) $n->id,
                'ref_type'   => $n->ref_type,
                'ref_id'     => $n->ref_id,
                'body'       => $n->body,
                'meta'       => $n->meta ? json_decode($n->meta, true) : null,
                'created_at' => $n->created_at,
                'updated_at' => $n->updated_at,
            ];
        });

        return response()->json(['success' => true, 'notes' => $notes]);
    }

    /**
     * PUT /api/notes
     * Body: { ref_type, ref_id, body, meta? }
     * Upserts the note for (user, ref_type, ref_id) — one note per ref per user.
     * If body is empty/blank, the note is deleted.
     */
    public function upsert(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $data = $request->validate([
            'ref_type' => 'required|string|max:30',
            'ref_id'   => 'required|string|max:80',
            'body'     => 'nullable|string|max:50000',
            'meta'     => 'nullable|array',
        ]);
        if (!in_array($data['ref_type'], self::ALLOWED_REF_TYPES, true)) {
            return response()->json(['success' => false, 'error' => 'Invalid ref_type'], 400);
        }

        $body = trim((string) ($data['body'] ?? ''));
        $existing = DB::table('user_notes')
            ->where('user_id', $user->id)
            ->where('ref_type', $data['ref_type'])
            ->where('ref_id', $data['ref_id'])
            ->first();

        // Empty body → delete the note (keeps things clean)
        if ($body === '') {
            if ($existing) {
                DB::table('user_notes')->where('id', $existing->id)->delete();
            }
            return response()->json(['success' => true, 'deleted' => true]);
        }

        $payload = [
            'user_id'    => $user->id,
            'ref_type'   => $data['ref_type'],
            'ref_id'     => $data['ref_id'],
            'body'       => $body,
            'meta'       => isset($data['meta']) ? json_encode($data['meta']) : null,
            'updated_at' => now(),
        ];

        if ($existing) {
            DB::table('user_notes')->where('id', $existing->id)->update($payload);
            $id = $existing->id;
        } else {
            $payload['created_at'] = now();
            $id = DB::table('user_notes')->insertGetId($payload);
        }

        return response()->json([
            'success' => true,
            'note'    => array_merge(['id' => $id], $payload, [
                'meta' => isset($data['meta']) ? $data['meta'] : null,
            ]),
        ]);
    }

    /**
     * DELETE /api/notes/{id}
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $deleted = DB::table('user_notes')
            ->where('id', $id)
            ->where('user_id', $user->id)
            ->delete();
        if (!$deleted) {
            return response()->json(['success' => false, 'error' => 'Not found'], 404);
        }
        return response()->json(['success' => true]);
    }
}
