<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UploadController extends Controller
{
    private const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    private const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

    /**
     * POST /api/uploads/image
     * multipart: file
     * Returns { url } where url is a public-relative path served by Apache.
     */
    public function image(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        if (!$user || !in_array($user->role, ['admin', 'superadmin'], true)) {
            return response()->json(['success' => false, 'error' => 'Admin access required'], 403);
        }

        $file = $request->file('file');
        if (!$file) {
            return response()->json(['success' => false, 'error' => 'No file uploaded'], 400);
        }
        if (!in_array($file->getMimeType(), self::ALLOWED_MIMES, true)) {
            return response()->json(['success' => false, 'error' => 'Only JPEG / PNG / GIF / WEBP allowed'], 415);
        }
        if ($file->getSize() > self::MAX_BYTES) {
            return response()->json(['success' => false, 'error' => 'Max file size is 5 MB'], 413);
        }

        // Save into backend/public/uploads/<yyyy>/<mm>/<random>.<ext>
        $ext  = strtolower($file->getClientOriginalExtension() ?: 'png');
        $name = bin2hex(random_bytes(12)) . '.' . $ext;
        $rel  = 'uploads/' . date('Y') . '/' . date('m');
        $abs  = public_path($rel);
        if (!is_dir($abs)) @mkdir($abs, 0775, true);
        $file->move($abs, $name);

        $url = '/' . $rel . '/' . $name;
        return response()->json(['success' => true, 'url' => $url, 'filename' => $name]);
    }
}
