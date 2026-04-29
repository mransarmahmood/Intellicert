import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, Check } from 'lucide-react';
import { api } from '../lib/api';

type Settings = Record<string, string | boolean>;

const sections = [
  {
    title: 'Branding',
    fields: [
      { key: 'app_name', label: 'App name', type: 'text' },
    ],
  },
  {
    title: 'Pricing',
    fields: [
      { key: 'price_monthly', label: 'Monthly price', type: 'number', prefix: '$' },
      { key: 'price_sixmonth', label: '6-month price', type: 'number', prefix: '$' },
      { key: 'currency', label: 'Currency', type: 'text' },
      { key: 'trial_days', label: 'Trial days', type: 'number' },
    ],
  },
  {
    title: 'Access',
    fields: [
      { key: 'allow_registration', label: 'Allow new registrations', type: 'toggle' },
      { key: 'maintenance_mode', label: 'Maintenance mode', type: 'toggle' },
    ],
  },
  {
    title: 'Stripe',
    fields: [
      { key: 'stripe_publishable_key', label: 'Publishable key', type: 'text' },
      { key: 'stripe_secret_key', label: 'Secret key', type: 'password' },
      { key: 'stripe_webhook_secret', label: 'Webhook secret', type: 'password' },
    ],
  },
  {
    title: 'PayPal',
    fields: [
      { key: 'paypal_client_id', label: 'Client ID', type: 'text' },
      { key: 'paypal_secret', label: 'Secret', type: 'password' },
      { key: 'paypal_mode', label: 'Mode', type: 'select', options: ['sandbox', 'live'] },
    ],
  },
  {
    title: 'Email (SMTP)',
    fields: [
      { key: 'email_enabled',   label: 'Email sending enabled', type: 'toggle' },
      { key: 'smtp_host',       label: 'SMTP host',     type: 'text' },
      { key: 'smtp_port',       label: 'SMTP port',     type: 'number' },
      { key: 'smtp_username',   label: 'SMTP username', type: 'text' },
      { key: 'smtp_password',   label: 'SMTP password', type: 'password' },
      { key: 'smtp_encryption', label: 'Encryption',    type: 'select', options: ['tls', 'ssl', 'none'] },
      { key: 'smtp_from_email', label: 'From email',    type: 'text' },
      { key: 'smtp_from_name',  label: 'From name',     type: 'text' },
    ],
  },
] as const;

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api<{ settings: Settings }>('/settings'),
  });

  const [form, setForm] = useState<Settings>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data?.settings) setForm(data.settings);
  }, [data]);

  const m = useMutation({
    mutationFn: () => api('/settings', { method: 'PATCH', body: JSON.stringify({ settings: form }) }),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  const set = (k: string, v: string | boolean) => setForm((s) => ({ ...s, [k]: v }));

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink">Settings</h1>
          <p className="mt-1 text-[14px] text-ink-dim">Platform configuration and integrations.</p>
        </div>
        <button
          onClick={() => m.mutate()}
          disabled={m.isPending || isLoading}
          className="btn btn-primary btn-md"
        >
          {m.isPending ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
          {saved ? 'Saved' : 'Save changes'}
        </button>
      </div>

      {isLoading && <div className="grid place-items-center py-20 text-ink-dim"><Loader2 className="animate-spin" /></div>}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-[13px] text-red-700">{(error as Error).message}</div>}

      {data && (
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.title} className="card p-6">
              <h3 className="font-display text-[15px] font-bold text-ink">{section.title}</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {section.fields.map((f: any) => {
                  const value = form[f.key];
                  if (f.type === 'toggle') {
                    return (
                      <label key={f.key} className="flex cursor-pointer items-center justify-between rounded-lg border border-ink-line bg-surface px-4 py-3">
                        <span className="text-[13.5px] font-semibold text-ink">{f.label}</span>
                        <input
                          type="checkbox"
                          checked={value === '1' || value === true}
                          onChange={(e) => set(f.key, e.target.checked ? '1' : '0')}
                          className="h-4 w-4 cursor-pointer accent-brand-600"
                        />
                      </label>
                    );
                  }
                  if (f.type === 'select') {
                    return (
                      <div key={f.key}>
                        <label className="label">{f.label}</label>
                        <select className="input" value={String(value ?? '')} onChange={(e) => set(f.key, e.target.value)}>
                          {f.options.map((o: string) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    );
                  }
                  return (
                    <div key={f.key}>
                      <label className="label">{f.label}</label>
                      <div className="relative">
                        {f.prefix && (
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-ink-muted">
                            {f.prefix}
                          </span>
                        )}
                        <input
                          type={f.type}
                          className={`input ${f.prefix ? 'pl-7' : ''}`}
                          value={String(value ?? '')}
                          onChange={(e) => set(f.key, e.target.value)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
