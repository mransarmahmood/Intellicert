import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Search, Pencil, Trash2, Upload } from 'lucide-react';
import { api } from '../lib/api';
import Modal from '../components/Modal';
import ImportModal from '../components/ImportModal';

type Domain = { id: string; number: number; name: string };
type Card = {
  id: number;
  card_key: string;
  domain_id: string;
  front: string;
  back: string;
  image_url: string | null;
  domain?: Domain;
};

export default function FlashcardsPage() {
  const qc = useQueryClient();
  const [domainFilter, setDomainFilter] = useState('');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Card | null>(null);
  const [deleting, setDeleting] = useState<Card | null>(null);
  const [showImport, setShowImport] = useState(false);

  const domainsQ = useQuery({
    queryKey: ['domains'],
    queryFn: () => api<{ domains: Domain[] }>('/domains'),
  });

  const cardsQ = useQuery({
    queryKey: ['flashcards', domainFilter, debounced],
    queryFn: () =>
      api<{ flashcards: Card[]; total: number }>('/flashcards', {
        params: { domain_id: domainFilter || undefined, search: debounced || undefined },
      }),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['flashcards'] });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink">Flashcards</h1>
          <p className="mt-1 text-[14px] text-ink-dim">{cardsQ.data ? `${cardsQ.data.total} total` : 'Loading...'}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(true)} className="btn btn-ghost btn-md">
            <Upload size={16} /> Import CSV
          </button>
          <button onClick={() => setCreating(true)} className="btn btn-primary btn-md" disabled={!domainsQ.data?.domains.length}>
            <Plus size={16} /> New flashcard
          </button>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <select value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)} className="input max-w-xs">
          <option value="">All domains</option>
          {domainsQ.data?.domains.map((d) => (
            <option key={d.id} value={d.id}>
              {d.number}. {d.name}
            </option>
          ))}
        </select>
        <form onSubmit={(e) => { e.preventDefault(); setDebounced(search); }} className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search front, back or key..."
              className="input pl-9"
            />
          </div>
          <button type="submit" className="btn btn-ghost btn-md">Search</button>
        </form>
      </div>

      <div className="card overflow-hidden">
        {cardsQ.isLoading ? (
          <div className="grid place-items-center py-16 text-ink-dim"><Loader2 className="animate-spin" /></div>
        ) : cardsQ.data?.flashcards.length ? (
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {cardsQ.data.flashcards.map((c) => (
              <div key={c.id} className="group rounded-xl border border-ink-line bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-cardHover">
                <div className="flex items-center justify-between">
                  <code className="rounded bg-surface px-1.5 py-0.5 text-[11px] text-ink-dim">{c.card_key}</code>
                  {c.domain && <span className="badge badge-brand">{c.domain.number}</span>}
                </div>
                <div className="mt-3 text-[13px] font-semibold text-ink line-clamp-3">{c.front}</div>
                <div className="mt-2 border-t border-ink-line pt-2 text-[12px] text-ink-body line-clamp-3">{c.back}</div>
                <div className="mt-3 flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button onClick={() => setEditing(c)} className="btn btn-ghost btn-sm"><Pencil size={12} /></button>
                  <button onClick={() => setDeleting(c)} className="btn btn-ghost btn-sm hover:!border-red-300 hover:!bg-red-50 hover:!text-red-700"><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-[13px] text-ink-dim">No flashcards found</div>
        )}
      </div>

      {showImport && (
        <ImportModal
          config={{
            title: 'Import flashcards from CSV',
            importPath: '/bulk-import/flashcards',
            requiredColumns: ['card_key', 'domain_id', 'front', 'back', 'image_url (optional)'],
            hint: 'Required columns:',
            templateRows: 'card_key,domain_id,front,back,image_url\nd3-001,d3,What is PtD?,Prevention through Design,',
          }}
          onClose={() => setShowImport(false)}
          onSuccess={() => qc.invalidateQueries({ queryKey: ['flashcards'] })}
        />
      )}
      {(creating || editing) && domainsQ.data && (
        <FlashcardForm
          mode={creating ? 'create' : 'edit'}
          card={editing ?? undefined}
          domains={domainsQ.data.domains}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSuccess={() => { setCreating(false); setEditing(null); refresh(); }}
        />
      )}
      {deleting && (
        <DeleteCardModal card={deleting} onClose={() => setDeleting(null)} onSuccess={() => { setDeleting(null); refresh(); }} />
      )}
    </div>
  );
}

function FlashcardForm({
  mode, card, domains, onClose, onSuccess,
}: {
  mode: 'create' | 'edit';
  card?: Card;
  domains: Domain[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    card_key: card?.card_key ?? '',
    domain_id: card?.domain_id ?? domains[0]?.id ?? '',
    front: card?.front ?? '',
    back: card?.back ?? '',
    image_url: card?.image_url ?? '',
  });
  const [err, setErr] = useState('');

  const m = useMutation({
    mutationFn: () =>
      mode === 'create'
        ? api('/flashcards', { method: 'POST', body: JSON.stringify(form) })
        : api(`/flashcards/${card!.id}`, { method: 'PATCH', body: JSON.stringify(form) }),
    onSuccess,
    onError: (e: Error) => setErr(e.message),
  });

  return (
    <Modal title={mode === 'create' ? 'New flashcard' : 'Edit flashcard'} onClose={onClose} size="lg">
      <form onSubmit={(e) => { e.preventDefault(); setErr(''); m.mutate(); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Card key *</label>
            <input className="input" value={form.card_key} onChange={(e) => setForm({ ...form, card_key: e.target.value })} required />
          </div>
          <div>
            <label className="label">Domain *</label>
            <select className="input" value={form.domain_id} onChange={(e) => setForm({ ...form, domain_id: e.target.value })} required>
              {domains.map((d) => <option key={d.id} value={d.id}>{d.number}. {d.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Front *</label>
          <textarea className="input min-h-[80px] resize-y" value={form.front} onChange={(e) => setForm({ ...form, front: e.target.value })} required />
        </div>
        <div>
          <label className="label">Back *</label>
          <textarea className="input min-h-[80px] resize-y" value={form.back} onChange={(e) => setForm({ ...form, back: e.target.value })} required />
        </div>
        <div>
          <label className="label">Image URL</label>
          <input className="input" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
        </div>
        {err && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">{err}</div>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn btn-ghost btn-md">Cancel</button>
          <button type="submit" className="btn btn-primary btn-md" disabled={m.isPending}>
            {m.isPending && <Loader2 size={14} className="animate-spin" />}
            {mode === 'create' ? 'Create' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteCardModal({ card, onClose, onSuccess }: { card: Card; onClose: () => void; onSuccess: () => void }) {
  const [err, setErr] = useState('');
  const m = useMutation({
    mutationFn: () => api(`/flashcards/${card.id}`, { method: 'DELETE' }),
    onSuccess,
    onError: (e: Error) => setErr(e.message),
  });
  return (
    <Modal title="Delete flashcard?" onClose={onClose}>
      <p className="text-[14px] text-ink-body">Permanently delete <strong className="text-ink">{card.card_key}</strong>?</p>
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
