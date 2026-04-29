<?php

namespace App\Http\Middleware;

use App\Models\Subscription;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Premium-gating for the Mastery Library.
 *
 * Allows requests through if:
 *   - Caller is admin/superadmin (always)
 *   - Caller has subscription.mastery_access = 1 OR subscription.plan ∈ premium tiers
 *
 * Sequence: must run AFTER LegacyTokenAuth so $request->attributes('auth_user')
 * is populated. Apply via the `mastery.access` middleware alias.
 */
class RequireMasteryAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->attributes->get('auth_user');
        if (!$user) {
            return response()->json(['success' => false, 'error' => 'Authentication required'], 401);
        }
        if (in_array($user->role ?? '', ['admin', 'superadmin'], true)) {
            return $next($request);
        }

        $sub = Subscription::where('user_id', $user->id)
            ->where('status', 'active')
            ->orderByDesc('id')
            ->first();

        $hasAccess = $sub && (
            (bool) ($sub->mastery_access ?? false)
            || in_array($sub->plan ?? '', ['sixmonth', 'yearly'], true)
        );

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'error'   => 'Mastery Library requires a premium subscription.',
                'upgrade_required' => true,
            ], 402);
        }
        return $next($request);
    }
}
