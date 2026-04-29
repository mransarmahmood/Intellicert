import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Loader2, CreditCard, Receipt, Undo2, X } from 'lucide-react';
import { api } from '../lib/api';

type Sub = {
  id: number;
  user_id: number;
  email: string;
  name: string | null;
  plan: string;
  status: string;
  started_at: string | null;
  expires_at: string | null;
  amount_paid: string | null;
  coupon_code: string | null;
};
type Pay = {
  id: number;
  email: string;
  name: string | null;
  amount: string;
  currency: string;
  payment_method: string | null;
  transaction_id: string | null;
  status: string;
  coupon_code: string | null;
  created_at: string;
};

export default function SubscriptionsPage() {
  const [tab, setTab] = useState<'subs' | 'payments'>('subs');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [refundTarget, setRefundTarget] = useState<Pay | null>(null);
  const qc = useQueryClient();

  const subsQ = useQuery({
    queryKey: ['subscriptions', statusFilter, planFilter],
    queryFn: () =>
      api<{ subscriptions: Sub[]; total: number }>('/subscriptions', {
        params: { status: statusFilter || undefined, plan: planFilter || undefined },
      }),
    enabled: tab === 'subs',
  });

  const paymentsQ = useQuery({
    queryKey: ['payments'],
    queryFn: () => api<{ payments: Pay[]; total: number }>('/payments'),
    enabled: tab === 'payments',
  });

  const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString() : '—');

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-extrabold text-ink">Subscriptions & payments</h1>
        <p className="mt-1 text-[14px] text-ink-dim">Revenue activity from the platform.</p>
      </div>

      {/* Tabs */}
      <div className="mb-5 inline-flex rounded-xl border border-ink-line bg-white p-1 shadow-sm">
        <button
          onClick={() => setTab('subs')}
          className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-[13px] font-semibold transition ${
            tab === 'subs' ? 'bg-brand-50 text-brand-700' : 'text-ink-body hover:bg-slate-50'
          }`}
        >
          <CreditCard size={14} /> Subscriptions
        </button>
        <button
          onClick={() => setTab('payments')}
          className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-[13px] font-semibold transition ${
            tab === 'payments' ? 'bg-brand-50 text-brand-700' : 'text-ink-body hover:bg-slate-50'
          }`}
        >
          <Receipt size={14} /> Payments
        </button>
      </div>

      {tab === 'subs' && (
        <>
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input max-w-xs">
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="canceled">Canceled</option>
            </select>
            <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="input max-w-xs">
              <option value="">All plans</option>
              <option value="demo">Demo</option>
              <option value="monthly">Monthly</option>
              <option value="sixmonth">6-month</option>
              <option value="annual">Annual</option>
            </select>
          </div>

          <div className="card overflow-hidden">
            {subsQ.isLoading ? (
              <div className="grid place-items-center py-16 text-ink-dim"><Loader2 className="animate-spin" /></div>
            ) : subsQ.data?.subscriptions.length ? (
              <table className="w-full text-left text-[13.5px]">
                <thead className="border-b border-ink-line bg-surface text-[11px] font-bold uppercase tracking-wider text-ink-dim">
                  <tr>
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Plan</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Started</th>
                    <th className="px-5 py-3">Expires</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-line">
                  {subsQ.data.subscriptions.map((s) => (
                    <tr key={s.id} className="hover:bg-surface">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-ink">{s.name || '—'}</div>
                        <div className="text-[12px] text-ink-dim">{s.email}</div>
                      </td>
                      <td className="px-5 py-3.5"><span className="badge badge-slate">{s.plan}</span></td>
                      <td className="px-5 py-3.5">
                        <span className={`badge ${s.status === 'active' ? 'badge-green' : 'badge-slate'}`}>{s.status}</span>
                      </td>
                      <td className="px-5 py-3.5 text-ink-body">{fmt(s.started_at)}</td>
                      <td className="px-5 py-3.5 text-ink-body">{fmt(s.expires_at)}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-ink">
                        {s.amount_paid ? `$${Number(s.amount_paid).toFixed(2)}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-16 text-center text-[13px] text-ink-dim">No subscriptions found</div>
            )}
          </div>
        </>
      )}

      {tab === 'payments' && (
        <div className="card overflow-hidden">
          {paymentsQ.isLoading ? (
            <div className="grid place-items-center py-16 text-ink-dim"><Loader2 className="animate-spin" /></div>
          ) : paymentsQ.data?.payments.length ? (
            <table className="w-full text-left text-[13.5px]">
              <thead className="border-b border-ink-line bg-surface text-[11px] font-bold uppercase tracking-wider text-ink-dim">
                <tr>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Coupon</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-line">
                {paymentsQ.data.payments.map((p) => (
                  <tr key={p.id} className="hover:bg-surface">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-ink">{p.name || '—'}</div>
                      <div className="text-[12px] text-ink-dim">{p.email}</div>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-ink">
                      ${Number(p.amount).toFixed(2)} <span className="text-[11px] text-ink-dim">{p.currency}</span>
                    </td>
                    <td className="px-5 py-3.5 text-ink-body">{p.payment_method || '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`badge ${
                        p.status === 'completed' ? 'badge-green' :
                        p.status === 'refunded' ? 'badge-slate' : 'badge-slate'
                      }`}>{p.status}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      {p.coupon_code ? <code className="rounded bg-surface px-1.5 py-0.5 text-[11px]">{p.coupon_code}</code> : <span className="text-ink-muted">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-ink-body">{fmt(p.created_at)}</td>
                    <td className="px-5 py-3.5 text-right">
                      {p.status === 'completed' ? (
                        <button
                          onClick={() => setRefundTarget(p)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1 text-[12px] font-semibold text-red-600 hover:bg-red-50"
                          title="Mark this payment as refunded and cancel the linked subscription"
                        >
                          <Undo2 size={12} /> Refund
                        </button>
                      ) : (
                        <span className="text-[11px] text-ink-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-16 text-center text-[13px] text-ink-dim">No payments yet</div>
          )}
        </div>
      )}

      {refundTarget && (
        <RefundModal
          payment={refundTarget}
          onClose={() => setRefundTarget(null)}
          onDone={() => {
            setRefundTarget(null);
            qc.invalidateQueries({ queryKey: ['payments'] });
            qc.invalidateQueries({ queryKey: ['subscriptions'] });
          }}
        />
      )}
    </div>
  );
}

function RefundModal({
  payment,
  onClose,
  onDone,
}: {
  payment: Pay;
  onClose: () => void;
  onDone: () => void;
}) {
  const [reason, setReason] = useState('');
  const [cancelSub, setCancelSub] = useState(true);
  const [err, setErr] = useState('');

  const m = useMutation({
    mutationFn: () => api(`/payments/${payment.id}/refund`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason || null, cancel_subscription: cancelSub }),
    }),
    onSuccess: onDone,
    onError: (e: Error) => setErr(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="font-display text-[17px] font-bold text-ink">Refund payment</h3>
            <p className="mt-0.5 text-[12.5px] text-ink-dim">{payment.email}</p>
          </div>
          <button onClick={onClose} className="text-ink-muted hover:text-ink"><X size={18} /></button>
        </div>

        <div className="mb-4 rounded-xl bg-surface px-3 py-2.5 text-[13px]">
          <div className="flex justify-between">
            <span className="text-ink-dim">Amount</span>
            <span className="font-bold text-ink">${Number(payment.amount).toFixed(2)} {payment.currency}</span>
          </div>
          {payment.transaction_id && (
            <div className="flex justify-between mt-1">
              <span className="text-ink-dim">Tx ID</span>
              <code className="text-[11.5px] text-ink truncate max-w-[180px]">{payment.transaction_id}</code>
            </div>
          )}
        </div>

        <label className="block mb-3">
          <div className="label">Reason (optional, internal)</div>
          <textarea
            className="input min-h-[64px]"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Customer requested within 7 days"
          />
        </label>

        <label className="flex items-center gap-2 cursor-pointer text-[12.5px] text-ink-body mb-4">
          <input type="checkbox" checked={cancelSub} onChange={(e) => setCancelSub(e.target.checked)} className="accent-brand-600" />
          Also cancel the linked subscription
        </label>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11.5px] text-amber-900 mb-4">
          <strong>Heads up:</strong> this only updates IntelliCert state. Process the actual refund in
          Stripe/PayPal manually.
        </div>

        {err && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700 mb-3">{err}</div>}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn btn-ghost btn-md">Cancel</button>
          <button
            onClick={() => { setErr(''); m.mutate(); }}
            disabled={m.isPending}
            className="btn btn-md border border-red-300 bg-white text-red-600 hover:bg-red-50"
          >
            {m.isPending && <Loader2 size={14} className="animate-spin" />}
            Refund ${Number(payment.amount).toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}
