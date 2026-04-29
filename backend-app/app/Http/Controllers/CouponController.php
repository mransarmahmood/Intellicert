<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    private function requireSuperadmin(Request $request): ?JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        if (!$user || $user->role !== 'superadmin') {
            return response()->json(['success' => false, 'error' => 'Superadmin access required'], 403);
        }
        return null;
    }

    public function index(Request $request): JsonResponse
    {
        if ($err = $this->requireSuperadmin($request)) return $err;
        $coupons = Coupon::orderByDesc('id')->get();
        return response()->json(['success' => true, 'coupons' => $coupons, 'total' => $coupons->count()]);
    }

    public function store(Request $request): JsonResponse
    {
        if ($err = $this->requireSuperadmin($request)) return $err;

        $data = $request->validate([
            'code'           => 'required|string|max:50|unique:coupons,code',
            'discount_type'  => 'required|in:percentage,fixed,free_trial',
            'discount_value' => 'required|numeric|min:0',
            'plan_type'      => 'nullable|in:monthly,sixmonth,annual,both',
            'max_uses'       => 'nullable|integer|min:1',
            'valid_until'    => 'nullable|date',
            'is_active'      => 'nullable|boolean',
        ]);

        $authUser = $request->attributes->get('auth_user');
        $data['plan_type']  = $data['plan_type'] ?? 'both';
        $data['max_uses']   = $data['max_uses'] ?? 1;
        $data['used_count'] = 0;
        $data['valid_from'] = now();
        $data['is_active']  = $data['is_active'] ?? true;
        $data['created_by'] = $authUser->id;

        $coupon = Coupon::create($data);
        return response()->json(['success' => true, 'coupon' => $coupon], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        if ($err = $this->requireSuperadmin($request)) return $err;

        $coupon = Coupon::find($id);
        if (!$coupon) return response()->json(['success' => false, 'error' => 'Coupon not found'], 404);

        $data = $request->validate([
            'code'           => 'sometimes|string|max:50|unique:coupons,code,' . $id,
            'discount_type'  => 'sometimes|in:percentage,fixed,free_trial',
            'discount_value' => 'sometimes|numeric|min:0',
            'plan_type'      => 'nullable|in:monthly,sixmonth,annual,both',
            'max_uses'       => 'nullable|integer|min:1',
            'valid_until'    => 'nullable|date',
            'is_active'      => 'nullable|boolean',
        ]);

        $coupon->update($data);
        return response()->json(['success' => true, 'coupon' => $coupon->fresh()]);
    }

    /**
     * POST /api/coupons/gift
     * Generate a one-time-use gift code (free_trial type) tied to a recipient
     * email + plan, with optional sender name and message. Returns the code
     * and a redeem URL the admin can share/email.
     */
    public function generateGift(Request $request): JsonResponse
    {
        if ($err = $this->requireSuperadmin($request)) return $err;

        $data = $request->validate([
            'recipient_email' => 'required|email|max:255',
            'recipient_name'  => 'nullable|string|max:120',
            'plan_type'       => 'required|in:monthly,sixmonth,annual',
            'sender_name'     => 'nullable|string|max:120',
            'gift_message'    => 'nullable|string|max:500',
            'expires_in_days' => 'nullable|integer|min:1|max:365',
        ]);
        $authUser = $request->attributes->get('auth_user');

        // Generate a unique GIFT-XXXX-XXXX code (8 random hex chars in two groups)
        do {
            $rand = strtoupper(bin2hex(random_bytes(4)));
            $code = 'GIFT-' . substr($rand, 0, 4) . '-' . substr($rand, 4, 4);
        } while (\App\Models\Coupon::where('code', $code)->exists());

        $expiresAt = now()->addDays($data['expires_in_days'] ?? 90);

        $coupon = \App\Models\Coupon::create([
            'code'            => $code,
            'discount_type'   => 'free_trial',
            'discount_value'  => 100, // 100% — full free access for one period
            'plan_type'       => $data['plan_type'],
            'max_uses'        => 1,
            'used_count'      => 0,
            'valid_from'      => now(),
            'valid_until'     => $expiresAt,
            'is_active'       => true,
            'is_gift'         => true,
            'recipient_email' => $data['recipient_email'],
            'recipient_name'  => $data['recipient_name'] ?? null,
            'sender_name'     => $data['sender_name'] ?? null,
            'gift_message'    => $data['gift_message'] ?? null,
            'created_by'      => $authUser->id,
        ]);

        $redeemUrl = url('/app/redeem?code=' . $code);

        return response()->json([
            'success'    => true,
            'coupon'     => $coupon,
            'redeem_url' => $redeemUrl,
            'mailto_url' => $this->buildMailto($data, $code, $redeemUrl),
        ], 201);
    }

    private function buildMailto(array $d, string $code, string $url): string
    {
        $sender = $d['sender_name'] ?? 'IntelliCert';
        $subject = rawurlencode("$sender sent you IntelliCert exam-prep access");
        $msg = $d['gift_message'] ?? '';
        $body = rawurlencode(
            "Hi" . (!empty($d['recipient_name']) ? ' ' . $d['recipient_name'] : '') . ",\n\n" .
            "$sender has gifted you full access to IntelliCert — the brain-based safety-certification prep platform.\n\n" .
            ($msg ? "Personal message:\n$msg\n\n" : '') .
            "To redeem, visit:\n$url\n\nor enter this code at checkout: $code\n\n" .
            "Plan: " . ucfirst($d['plan_type']) . "\n\nGood luck on your exam!"
        );
        return 'mailto:' . rawurlencode($d['recipient_email']) . "?subject=$subject&body=$body";
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        if ($err = $this->requireSuperadmin($request)) return $err;

        $coupon = Coupon::find($id);
        if (!$coupon) return response()->json(['success' => false, 'error' => 'Coupon not found'], 404);

        $coupon->delete();
        return response()->json(['success' => true, 'message' => 'Coupon deleted']);
    }
}
