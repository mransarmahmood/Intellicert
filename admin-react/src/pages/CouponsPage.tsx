import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Pencil, Trash2, Gift, Mail, Copy, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';
import Modal from '../components/Modal';

type Coupon = {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed' | 'free_trial';
  discount_value: string;
  plan_type: 'monthly' | 'sixmonth' | 'annual' | 'both';
  max_uses: number;
  used_count: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  is_gift?: boolean;
  recipient_email?: string | null;
  recipient_name?: string | null;
  sender_name?: string | null;
  gift_message?: string | null;
};

export default function CouponsPage() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [deleting, setDeleting] = useState<Coupon | null>(null);
  const [gifting, setGifting] = useState(false);

  const couponsQ = useQuery({
    queryKey: ['coupons'],
    queryFn: () => api<{ coupons: Coupon[]; total: number }>('/coupons'),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['coupons'] });

  const fmtDiscount = (c: Coupon) => {
    if (c.discount_type === 'percentage') return `${parseFloat(c.discount_value)}% off`;
    if (c.discount_type === 'fixed')      return `$${parseFloat(c.discount_value)} off`;
    return `${parseFloat(c.discount_value)}-day trial`;
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink">Coupons</h1>
          <p className="mt-1 text-[14px] text-ink-dim">{couponsQ.data ? `${couponsQ.data.total} total` : 'Loading...'}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setGifting(true)} className="btn btn-ghost btn-md">
            <Gift size={16} /> Generate gift code
          </button>
          <button onClick={() => setCreating(true)} className="btn btn-primary btn-md">
            <Plus size={16} /> New coupon
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        {couponsQ.isLoading ? (
          <div className="grid place-items-center py-16 text-ink-dim"><Loader2 className="animate-spin" /></div>
        ) : couponsQ.data?.coupons.length ? (
          <table className="w-full text-left text-[13.5px]">
            <thead className="border-b border-ink-line bg-surface text-[11px] font-bold uppercase tracking-wider text-ink-dim">
              <tr>
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Discount</th>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3">Uses</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-line">
              {couponsQ.data.coupons.map((c) => (
                <tr key={c.id} className="hover:bg-surface">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-surface px-2 py-1 text-[12.5px] font-bold text-ink">{c.code}</code>
                      {c.is_gift && (
                        <span title={`Gift to ${c.recipient_email}`} className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                          <Gift size={9} /> Gift
                        </span>
                      )}
                    </div>
                    {c.is_gift && c.recipient_email && (
                      <div className="mt-0.5 text-[11px] text-ink-dim truncate max-w-[180px]">→ {c.recipient_email}</div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-ink">{fmtDiscount(c)}</td>
                  <td className="px-5 py-3.5"><span className="badge badge-slate">{c.plan_type}</span></td>
                  <td className="px-5 py-3.5 text-ink-body">{c.used_count} / {c.max_uses}</td>
                  <td className="px-5 py-3.5">
                    <span className={`badge ${c.is_active ? 'badge-green' : 'badge-slate'}`}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setEditing(c)} className="btn btn-ghost btn-sm"><Pencil size={13} /></button>
                      <button onClick={() => setDeleting(c)} className="btn btn-ghost btn-sm hover:!border-red-300 hover:!bg-red-50 hover:!text-red-700"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-16 text-center text-[13px] text-ink-dim">No coupons yet</div>
        )}
      </div>

      {(creating || editing) && (
        <CouponForm
          mode={creating ? 'create' : 'edit'}
          coupon={editing ?? undefined}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSuccess={() => { setCreating(false); setEditing(null); refresh(); }}
        />
      )}
      {deleting && (
        <DeleteCouponModal coupon={deleting} onClose={() => setDeleting(null)} onSuccess={() => { setDeleting(null); refresh(); }} />
      )}
      {gifting && (
        <GiftCodeModal onClose={() => setGifting(false)} onSuccess={() => { setGifting(false); refresh(); }} />
      )}
    </div>
  );
}

function GiftCodeModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [planType, setPlanType] = useState<'monthly' | 'sixmonth' | 'annual'>('sixmonth');
  const [senderName, setSenderName] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('90');
  const [err, setErr] = useState('');
  const [result, setResult] = useState<{ code: string; redeem_url: string; mailto_url: string } | null>(null);
  const [copied, setCopied] = useState<'code' | 'url' | null>(null);

  const m = useMutation({
    mutationFn: () => api<{ coupon: Coupon; redeem_url: string; mailto_url: string }>('/coupons/gift', {
      method: 'POST',
      body: JSON.stringify({
        recipient_email: recipientEmail,
        recipient_name: recipientName || null,
        plan_type: planType,
        sender_name: senderName || null,
        gift_message: giftMessage || null,
        expires_in_days: parseInt(expiresInDays, 10) || 90,
      }),
    }),
    onSuccess: (res) => setResult({ code: res.coupon.code, redeem_url: res.redeem_url, mailto_url: res.mailto_url }),
    onError: (e: Error) => setErr(e.message),
  });

  const copy = (text: string, kind: 'code' | 'url') => {
    navigator.clipboard.writeText(text);
    setCopied(kind);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <Modal title={result ? 'Gift code generated' : 'Generate a gift code'} onClose={onClose}>
      {result ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-1">Gift code</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg bg-white border border-emerald-300 px-3 py-2 font-mono text-[15px] font-bold text-ink select-all">{result.code}</code>
              <button onClick={() => copy(result.code, 'code')} className="btn btn-ghost btn-sm">
                {copied === 'code' ? <CheckCircle2 size={13} className="text-emerald-600" /> : <Copy size={13} />}
              </button>
            </div>
          </div>
          <div className="rounded-xl border border-ink-line bg-white p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-ink-dim mb-1">Redeem URL</div>
            <div className="flex items-center gap-2">
              <input readOnly value={result.redeem_url} className="input flex-1 font-mono text-[12px]" />
              <button onClick={() => copy(result.redeem_url, 'url')} className="btn btn-ghost btn-sm">
                {copied === 'url' ? <CheckCircle2 size={13} className="text-emerald-600" /> : <Copy size={13} />}
              </button>
            </div>
          </div>
          <a href={result.mailto_url} className="btn btn-primary btn-md w-full">
            <Mail size={14} /> Open email to {recipientEmail}
          </a>
          <p className="text-[11.5px] text-ink-dim text-center">
            The mailto opens your email client with the message pre-filled. Adjust before sending.
          </p>
          <div className="flex justify-end pt-2">
            <button onClick={onSuccess} className="btn btn-ghost btn-md">Done</button>
          </div>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); setErr(''); m.mutate(); }} className="space-y-4">
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[12px] text-amber-900">
            Generates a single-use code (100% off) tied to the recipient's email. After they redeem, the code becomes inactive.
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Recipient email *</label>
              <input
                type="email"
                className="input"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="alex@example.com"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">Recipient name</label>
              <input className="input" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Alex" />
            </div>
          </div>

          <div>
            <label className="label">Plan</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['monthly', 'sixmonth', 'annual'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlanType(p)}
                  className={`text-[12px] font-bold py-2 px-2 rounded-lg border transition uppercase ${
                    planType === p ? 'bg-brand-500 text-white border-brand-500' : 'bg-white border-ink-line hover:border-slate-300'
                  }`}
                >
                  {p === 'sixmonth' ? '6-month' : p}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Sender (your) name</label>
              <input className="input" value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="From: …" />
            </div>
            <div>
              <label className="label">Code expires in (days)</label>
              <input type="number" className="input" value={expiresInDays} onChange={(e) => setExpiresInDays(e.target.value)} min="1" max="365" />
            </div>
          </div>

          <div>
            <label className="label">Personal message (optional)</label>
            <textarea
              className="input min-h-[64px]"
              value={giftMessage}
              onChange={(e) => setGiftMessage(e.target.value)}
              placeholder="Good luck on your CSP exam!"
              maxLength={500}
            />
          </div>

          {err && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">{err}</div>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn btn-ghost btn-md">Cancel</button>
            <button type="submit" className="btn btn-primary btn-md" disabled={m.isPending}>
              {m.isPending && <Loader2 size={14} className="animate-spin" />}
              <Gift size={14} /> Generate gift code
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function CouponForm({
  mode, coupon, onClose, onSuccess,
}: {
  mode: 'create' | 'edit';
  coupon?: Coupon;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    code: coupon?.code ?? '',
    discount_type: (coupon?.discount_type ?? 'percentage') as Coupon['discount_type'],
    discount_value: coupon?.discount_value ? parseFloat(coupon.discount_value) : 10,
    plan_type: (coupon?.plan_type ?? 'both') as Coupon['plan_type'],
    max_uses: coupon?.max_uses ?? 100,
    valid_until: coupon?.valid_until ? coupon.valid_until.slice(0, 10) : '',
    is_active: coupon?.is_active ?? true,
  });
  const [err, setErr] = useState('');

  const m = useMutation({
    mutationFn: () => {
      const payload = { ...form, valid_until: form.valid_until || null };
      return mode === 'create'
        ? api('/coupons', { method: 'POST', body: JSON.stringify(payload) })
        : api(`/coupons/${coupon!.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
    },
    onSuccess,
    onError: (e: Error) => setErr(e.message),
  });

  return (
    <Modal title={mode === 'create' ? 'New coupon' : `Edit: ${coupon?.code}`} onClose={onClose} size="lg">
      <form onSubmit={(e) => { e.preventDefault(); setErr(''); m.mutate(); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Code *</label>
            <input
              className="input uppercase"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="LAUNCH50"
              required
            />
          </div>
          <div>
            <label className="label">Plan</label>
            <select className="input" value={form.plan_type} onChange={(e) => setForm({ ...form, plan_type: e.target.value as any })}>
              <option value="both">Both</option>
              <option value="monthly">Monthly</option>
              <option value="sixmonth">6-month</option>
              <option value="annual">Annual</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Discount type *</label>
            <select className="input" value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value as any })}>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed amount ($)</option>
              <option value="free_trial">Free trial (days)</option>
            </select>
          </div>
          <div>
            <label className="label">Value *</label>
            <input
              type="number"
              className="input"
              value={form.discount_value}
              onChange={(e) => setForm({ ...form, discount_value: parseFloat(e.target.value) || 0 })}
              required
              step="0.01"
              min="0"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Max uses</label>
            <input
              type="number"
              className="input"
              value={form.max_uses}
              onChange={(e) => setForm({ ...form, max_uses: parseInt(e.target.value) || 1 })}
              min="1"
            />
          </div>
          <div>
            <label className="label">Valid until</label>
            <input
              type="date"
              className="input"
              value={form.valid_until}
              onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-[14px] text-ink-body">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            className="cursor-pointer accent-brand-600"
          />
          Active
        </label>
        {err && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">{err}</div>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn btn-ghost btn-md">Cancel</button>
          <button type="submit" className="btn btn-primary btn-md" disabled={m.isPending}>
            {m.isPending && <Loader2 size={14} className="animate-spin" />}
            {mode === 'create' ? 'Create coupon' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteCouponModal({ coupon, onClose, onSuccess }: { coupon: Coupon; onClose: () => void; onSuccess: () => void }) {
  const [err, setErr] = useState('');
  const m = useMutation({
    mutationFn: () => api(`/coupons/${coupon.id}`, { method: 'DELETE' }),
    onSuccess,
    onError: (e: Error) => setErr(e.message),
  });
  return (
    <Modal title="Delete coupon?" onClose={onClose}>
      <p className="text-[14px] text-ink-body">Permanently delete <strong className="text-ink">{coupon.code}</strong>?</p>
      {err && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">{err}</div>}
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="btn btn-ghost btn-md">Cancel</button>
        <button onClick={() => m.mutate()} className="btn btn-danger btn-md" disabled={m.isPending}>
          {m.isPending && <Loader2 size={14} className="animate-spin" />} Delete
        </button>
      </div>
    </Modal>
  );
}
