<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Models\UserSession;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LegacyTokenAuth
{
    /**
     * Validate token from Authorization: Bearer header against the
     * legacy user_sessions table (shared with the original PHP API).
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $this->extractToken($request);

        if (!$token) {
            return response()->json(['success' => false, 'error' => 'Authentication required'], 401);
        }

        $session = UserSession::where('session_token', $token)
            ->where('is_active', 1)
            ->where('expires_at', '>', now())
            ->first();

        if (!$session) {
            return response()->json(['success' => false, 'error' => 'Invalid or expired session'], 401);
        }

        $user = User::find($session->user_id);
        if (!$user) {
            return response()->json(['success' => false, 'error' => 'User not found'], 401);
        }

        $request->attributes->set('auth_user', $user);
        $request->attributes->set('auth_session', $session);

        return $next($request);
    }

    private function extractToken(Request $request): ?string
    {
        $header = $request->header('Authorization', '');
        if (preg_match('/^Bearer\s+(.+)$/i', $header, $m)) {
            return $m[1];
        }
        return $request->input('token');
    }
}
