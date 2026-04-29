<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SubscriptionController extends Controller
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

        $status = $request->input('status'); // active|expired|canceled
        $plan   = $request->input('plan');
        $limit  = min(200, max(10, (int) $request->input('limit', 100)));

        $q = DB::table('subscriptions as s')
            ->join('users as u', 'u.id', '=', 's.user_id')
            ->select(
                's.id', 's.plan', 's.status', 's.started_at', 's.expires_at',
                's.amount_paid', 's.coupon_code', 's.user_id',
                'u.email', 'u.name'
            )
            ->orderByDesc('s.id')
            ->limit($limit);

        if ($status) $q->where('s.status', $status);
        if ($plan)   $q->where('s.plan', $plan);

        $subs = $q->get();

        return response()->json([
            'success'       => true,
            'subscriptions' => $subs,
            'total'         => $subs->count(),
        ]);
    }

    public function payments(Request $request): JsonResponse
    {
        if ($err = $this->requireSuperadmin($request)) return $err;

        $limit = min(200, max(10, (int) $request->input('limit', 100)));
        $payments = DB::table('payments as p')
            ->leftJoin('users as u', 'u.id', '=', 'p.user_id')
            ->select(
                'p.id', 'p.user_id', 'p.amount', 'p.currency',
                'p.payment_method', 'p.transaction_id', 'p.status',
                'p.coupon_code', 'p.created_at', 'u.email', 'u.name'
            )
            ->orderByDesc('p.id')
            ->limit($limit)
            ->get();

        return response()->json([
            'success'  => true,
            'payments' => $payments,
            'total'    => $payments->count(),
        ]);
    }

    /**
     * POST /api/payments/{id}/refund
     * Mark a payment as refunded; cancel the linked subscription.
     * Body: { reason?: string, cancel_subscription?: bool=true }
     * Note: this only marks internal state — actual gateway refunds (Stripe/PayPal)
     * must be processed manually in the provider dashboard.
     */
    public function refund(Request $request, int $id): JsonResponse
    {
        if ($err = $this->requireSuperadmin($request)) return $err;

        $data = $request->validate([
            'reason'              => 'nullable|string|max:500',
            'cancel_subscription' => 'nullable|boolean',
        ]);

        $payment = DB::table('payments')->where('id', $id)->first();
        if (!$payment) return response()->json(['success' => false, 'error' => 'Payment not found'], 404);
        if ($payment->status === 'refunded') {
            return response()->json(['success' => false, 'error' => 'Payment is already refunded'], 422);
        }
        if ($payment->status !== 'completed') {
            return response()->json(['success' => false, 'error' => "Cannot refund a {$payment->status} payment"], 422);
        }

        DB::table('payments')->where('id', $id)->update([
            'status' => 'refunded',
        ]);

        $cancelSub = $data['cancel_subscription'] ?? true;
        $cancelledSubId = null;
        if ($cancelSub && $payment->subscription_id) {
            DB::table('subscriptions')
                ->where('id', $payment->subscription_id)
                ->where('status', 'active')
                ->update(['status' => 'cancelled']);
            $cancelledSubId = $payment->subscription_id;
        }

        $admin = $request->attributes->get('auth_user');
        try {
            DB::table('activity_log')->insert([
                'action'      => 'payment_refund',
                'entity_type' => 'payment',
                'entity_id'   => $id,
                'details'     => json_encode([
                    'admin_id'    => $admin->id,
                    'admin_email' => $admin->email,
                    'amount'      => (float) $payment->amount,
                    'reason'      => $data['reason'] ?? null,
                    'cancelled_subscription_id' => $cancelledSubId,
                    'ip_address'  => $request->ip(),
                ]),
                'created_at'  => now(),
            ]);
        } catch (\Throwable $e) { /* ignore if schema mismatch */ }

        return response()->json([
            'success' => true,
            'payment_id'              => $id,
            'amount'                  => (float) $payment->amount,
            'cancelled_subscription'  => $cancelledSubId,
        ]);
    }
}
