import { useMemo, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Library, UploadCloud, Search, FileText, FileImage, FileAudio, FileVideo,
  File as FileIcon, Trash2, ExternalLink, Loader2, CheckCircle2, X,
  RefreshCw, Pencil, Info, Tags, CheckSquare, Square,
} from 'lucide-react';
import { api, getToken } from '../lib/api';

type ContentSource = {
  id: number;
  type: 'pdf' | 'docx' | 'txt' | 'image' | 'audio' | 'video' | 'formula' | 'other';
  title: string;
  description: string | null;
  original_filename: string;
  file_size: number;
  mime_type: string | null;
  file_url: string | null;
  thumbnail_url: string | null;
  domain_ids: string[];
  cert_keys: string[];
  tags: string[];
  chunk_count: number;
  page_count: number | null;
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  author: string | null;
  publisher: string | null;
  publish_year: number | null;
  created_at: string;
};

const DOMAIN_OPTIONS = [
  { id: 'domain1', label: 'D1 · Safety Principles' },
  { id: 'domain2', label: 'D2 · Program Management' },
  { id: 'domain3', label: 'D3 · Risk Management' },
  { id: 'domain4', label: 'D4 · Emergency Management' },
  { id: 'domain5', label: 'D5 · Environmental' },
  { id: 'domain6', label: 'D6 · Occupational Health' },
  { id: 'domain7', label: 'D7 · Training' },
];

const TYPE_META: Record<ContentSource['type'], { label: string; Icon: typeof FileIcon; color: string }> = {
  pdf:   { label: 'PDF',    Icon: FileText,  color: '#dc2626' },
  docx:  { label: 'Word',   Icon: FileText,  color: '#2563eb' },
  txt:   { label: 'Text',   Icon: FileText,  color: '#64748b' },
  image: { label: 'Image',  Icon: FileImage, color: '#16a34a' },
  audio: { label: 'Audio',  Icon: FileAudio, color: '#ea580c' },
  video: { label: 'Video',  Icon: FileVideo, color: '#7c3aed' },
  formula:{ label: 'Formula', Icon: FileText, color: '#0891b2' },
  other: { label: 'File',   Icon: FileIcon,  color: '#94a3b8' },
};

function fmtSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  return (bytes / 1073741824).toFixed(1) + ' GB';
}

export default function ContentLibraryPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showUpload, setShowUpload] = useState(false);
  const [editItem, setEditItem] = useState<ContentSource | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkMode, setBulkMode] = useState<null | 'assign_domains' | 'add_tags' | 'delete'>(null);

  const itemsQ = useQuery({
    queryKey: ['content-library', search, typeFilter],
    queryFn: () => api<{ items: ContentSource[] }>('/admin/content' +
      (search ? `?search=${encodeURIComponent(search)}` : '') +
      (typeFilter ? (search ? '&' : '?') + 'type=' + typeFilter : '')),
  });

  const delMut = useMutation({
    mutationFn: (id: number) => api(`/admin/content/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content-library'] }),
  });

  const reprocessMut = useMutation({
    mutationFn: (id: number) => api(`/admin/content/${id}/reprocess`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content-library'] }),
  });

  const items = itemsQ.data?.items || [];
  const allSelected = items.length > 0 && selected.size === items.length;
  const someSelected = selected.size > 0;
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(items.map((i) => i.id)));
  };
  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const selectUncategorized = () => {
    setSelected(new Set(items.filter((i) => i.domain_ids.length === 0).map((i) => i.id)));
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    items.forEach((i) => { c[i.type] = (c[i.type] || 0) + 1; });
    return c;
  }, [items]);

  return (
    <div className="wrap py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <div className="eyebrow mb-1"><Library size={11} /> Content Center</div>
          <h1 className="font-display text-3xl font-extrabold text-ink">Reference Library</h1>
          <p className="text-ink-body mt-1">
            Upload reference books, blueprints, formulas, audios, videos, and images.
            The system extracts text and indexes everything for instant retrieval in topic authoring.
          </p>
        </div>
        <button onClick={() => setShowUpload(true)} className="btn btn-primary btn-md">
          <UploadCloud size={15} /> Upload Content
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-5">
        {(['pdf','docx','txt','image','audio','video','formula'] as const).map((t) => {
          const meta = TYPE_META[t];
          const n = counts[t] || 0;
          const active = typeFilter === t;
          return (
            <button
              key={t}
              onClick={() => setTypeFilter(active ? '' : t)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                active ? 'bg-ink text-white border-ink' : 'bg-white text-ink-body border-ink-line hover:border-slate-300'
              }`}
            >
              <meta.Icon size={14} style={{ color: active ? '#fff' : meta.color }} />
              <span className="text-xs font-semibold flex-1 text-left">{meta.label}</span>
              <span className="text-[11px] font-bold tabular-nums">{n}</span>
            </button>
          );
        })}
      </div>

      <div className="card p-3 mb-5 flex items-center gap-2">
        <Search size={16} className="text-ink-dim ml-1" />
        <input
          className="flex-1 bg-transparent outline-none text-[14px] py-1.5"
          placeholder="Search title, filename, description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {(search || typeFilter) && (
          <button onClick={() => { setSearch(''); setTypeFilter(''); }}
            className="text-[11px] font-semibold uppercase px-2 py-1 text-ink-dim hover:text-ink">
            Clear
          </button>
        )}
      </div>

      {/* Bulk action toolbar (visible when items present) */}
      {items.length > 0 && (
        <div className={`mb-4 flex flex-wrap items-center gap-3 rounded-xl border px-4 py-2.5 transition-colors ${
          someSelected ? 'bg-brand-50 border-brand-200' : 'bg-white border-ink-line'
        }`}>
          <button onClick={toggleAll} className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-ink hover:text-brand-700">
            {allSelected ? <CheckSquare size={15} className="text-brand-600" /> : <Square size={15} className="text-ink-dim" />}
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
          <button onClick={selectUncategorized} className="text-[12px] font-semibold text-ink-dim hover:text-ink">
            Select uncategorized
          </button>
          <span className="text-[12px] text-ink-dim ml-auto">
            {someSelected ? `${selected.size} selected` : `${items.length} item${items.length === 1 ? '' : 's'}`}
          </span>
          {someSelected && (
            <>
              <button onClick={() => setBulkMode('assign_domains')} className="btn btn-ghost btn-sm">
                <Tags size={13} /> Assign domains
              </button>
              <button onClick={() => setBulkMode('add_tags')} className="btn btn-ghost btn-sm">
                <Pencil size={13} /> Add tags
              </button>
              <button
                onClick={() => setBulkMode('delete')}
                className="btn btn-sm border border-red-300 bg-white text-red-600 hover:bg-red-50"
              >
                <Trash2 size={13} /> Delete
              </button>
              <button onClick={() => setSelected(new Set())} className="text-[11px] font-bold uppercase tracking-wide text-ink-dim hover:text-ink">
                Clear
              </button>
            </>
          )}
        </div>
      )}

      {itemsQ.isLoading ? (
        <div className="grid place-items-center py-20 text-ink-dim">
          <Loader2 className="animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="card p-14 text-center text-ink-dim">
          <Library size={48} className="mx-auto mb-3 opacity-40" />
          <p className="font-semibold text-ink">Library is empty</p>
          <p className="text-[13px] mt-1">Upload your first reference book or image to start building the content center.</p>
          <button onClick={() => setShowUpload(true)} className="btn btn-primary btn-md mt-5">
            <UploadCloud size={15} /> Upload Content
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ContentCard
              key={item.id}
              item={item}
              selected={selected.has(item.id)}
              onToggleSelect={() => toggleOne(item.id)}
              onDelete={() => delMut.mutate(item.id)}
              onReprocess={() => reprocessMut.mutate(item.id)}
              onEdit={() => setEditItem(item)}
              reprocessing={reprocessMut.isPending && reprocessMut.variables === item.id}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showUpload && (
          <UploadModal onClose={() => setShowUpload(false)} onUploaded={() => {
            qc.invalidateQueries({ queryKey: ['content-library'] });
          }} />
        )}
        {editItem && (
          <EditContentModal
            item={editItem}
            onClose={() => setEditItem(null)}
            onSaved={() => {
              setEditItem(null);
              qc.invalidateQueries({ queryKey: ['content-library'] });
            }}
          />
        )}
        {bulkMode && (
          <BulkActionModal
            mode={bulkMode}
            ids={Array.from(selected)}
            onClose={() => setBulkMode(null)}
            onDone={(affected) => {
              setBulkMode(null);
              setSelected(new Set());
              alert(`${affected} item${affected === 1 ? '' : 's'} updated`);
              qc.invalidateQueries({ queryKey: ['content-library'] });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────── Card ─────────── */
function ContentCard({
  item,
  selected,
  onToggleSelect,
  onDelete,
  onReprocess,
  onEdit,
  reprocessing,
}: {
  item: ContentSource;
  selected: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
  onReprocess: () => void;
  onEdit: () => void;
  reprocessing: boolean;
}) {
  const meta = TYPE_META[item.type];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      whileHover={{ y: -3 }}
      className={`card card-hover p-4 relative ${selected ? 'ring-2 ring-brand-500 bg-brand-50/30' : ''}`}
    >
      {/* Multi-select checkbox */}
      <button
        onClick={onToggleSelect}
        className="absolute top-3 right-3 grid h-6 w-6 place-items-center rounded border bg-white hover:border-brand-500 transition-colors"
        title={selected ? 'Deselect' : 'Select for bulk action'}
      >
        {selected
          ? <CheckSquare size={14} className="text-brand-600" />
          : <Square size={14} className="text-ink-muted" />}
      </button>

      <div className="flex items-start gap-3 mb-3 pr-8">
        <div className="grid h-11 w-11 place-items-center rounded-xl shrink-0"
          style={{ background: meta.color + '18', color: meta.color }}>
          <meta.Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[14px] text-ink truncate">{item.title}</div>
          <div className="text-[11px] text-ink-dim truncate">{item.original_filename}</div>
        </div>
        <StatusBadge status={item.status} />
      </div>

      {item.description && (
        <p className="text-[12px] text-ink-body leading-relaxed mb-3 line-clamp-2">{item.description}</p>
      )}

      <div className="flex items-center gap-1 flex-wrap mb-3">
        {item.domain_ids.length === 0 ? (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 uppercase inline-flex items-center gap-1">
            <Tags size={10} /> Uncategorized
          </span>
        ) : (
          item.domain_ids.map((d) => (
            <span key={d} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 uppercase">{d.replace('domain','D')}</span>
          ))
        )}
        {item.tags.slice(0, 3).map((t) => (
          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">#{t}</span>
        ))}
      </div>

      <div className="flex items-center justify-between text-[11px] text-ink-dim">
        <span>{fmtSize(item.file_size)}{item.page_count ? ` · ${item.page_count} pages` : ''}{item.chunk_count ? ` · ${item.chunk_count} chunks` : ''}</span>
        <div className="flex gap-1">
          {item.status === 'failed' && (
            <button
              onClick={onReprocess}
              disabled={reprocessing}
              title="Re-extract text"
              className="grid place-items-center h-7 w-7 rounded hover:bg-blue-50 text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
              {reprocessing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            </button>
          )}
          <button
            onClick={onEdit}
            title="Edit metadata / assign domains"
            className="grid place-items-center h-7 w-7 rounded hover:bg-slate-100 text-ink-dim hover:text-ink"
          >
            <Pencil size={13} />
          </button>
          {item.file_url && (
            <a href={item.file_url} target="_blank" rel="noopener"
              className="grid place-items-center h-7 w-7 rounded hover:bg-slate-100 text-ink-dim hover:text-ink">
              <ExternalLink size={13} />
            </a>
          )}
          <button onClick={() => confirm('Delete this content?') && onDelete()}
            className="grid place-items-center h-7 w-7 rounded hover:bg-red-50 text-ink-dim hover:text-red-600">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: ContentSource['status'] }) {
  if (status === 'ready')      return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 inline-flex items-center gap-0.5"><CheckCircle2 size={10} /> READY</span>;
  if (status === 'processing') return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 inline-flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> PROC</span>;
  if (status === 'failed')     return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-700">FAILED</span>;
  return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{status.toUpperCase()}</span>;
}

/* ─────────── Upload modal ─────────── */
function UploadModal({ onClose, onUploaded }: { onClose: () => void; onUploaded: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [meta, setMeta] = useState({
    title: '',
    description: '',
    domain_ids: '' as string,
    tags: '',
    author: '',
    publisher: '',
    publish_year: '',
  });
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState<{ ok: number; fail: number } | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files || []);
    if (dropped.length) setFiles((f) => [...f, ...dropped]);
  }, []);

  const upload = async () => {
    if (!files.length) return;
    setUploading(true);
    setError(null);
    let ok = 0, fail = 0;
    for (const file of files) {
      try {
        const fd = new FormData();
        fd.append('file', file);
        if (meta.title || files.length === 1) fd.append('title', meta.title || file.name.replace(/\.[^/.]+$/, ''));
        if (meta.description) fd.append('description', meta.description);
        if (meta.domain_ids) fd.append('domain_ids', meta.domain_ids);
        if (meta.tags) fd.append('tags', meta.tags);
        if (meta.author) fd.append('author', meta.author);
        if (meta.publisher) fd.append('publisher', meta.publisher);
        if (meta.publish_year) fd.append('publish_year', meta.publish_year);

        const token = getToken();
        const base = (import.meta.env.VITE_API_BASE as string | undefined) ?? 'http://127.0.0.1:8000/api';
        const res = await fetch(base + '/admin/content/upload', {
          method: 'POST',
          headers: token ? { Authorization: 'Bearer ' + token } : {},
          body: fd,
        });
        if (!res.ok) throw new Error('Upload failed: ' + res.status);
        setProgress((p) => ({ ...p, [file.name]: 100 }));
        ok++;
      } catch (e: any) {
        setProgress((p) => ({ ...p, [file.name]: -1 }));
        fail++;
      }
    }
    setDone({ ok, fail });
    setUploading(false);
    if (ok > 0) onUploaded();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="card w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl font-extrabold text-ink">Upload Content</h2>
          <button onClick={onClose} className="grid place-items-center h-8 w-8 rounded hover:bg-slate-100"><X size={16} /></button>
        </div>

        <div
          ref={dropRef}
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          className="rounded-2xl border-2 border-dashed border-ink-line hover:border-brand-500 bg-surface-sunken/50 p-8 text-center mb-5 transition-colors"
        >
          <UploadCloud size={40} className="mx-auto mb-3 text-ink-dim" />
          <div className="font-bold text-ink">Drop files here</div>
          <div className="text-[13px] text-ink-dim mt-1">or</div>
          <label className="inline-block mt-2 btn btn-primary btn-md cursor-pointer">
            Choose files
            <input type="file" multiple className="hidden"
              onChange={(e) => e.target.files && setFiles((f) => [...f, ...Array.from(e.target.files!)])} />
          </label>
          <div className="text-[11px] text-ink-muted mt-3">
            PDF, Word, Text · Images · Audio · Video · up to 100 MB each
          </div>
        </div>

        {files.length > 0 && (
          <div className="mb-5">
            <div className="text-[11px] font-bold uppercase tracking-wide text-ink-dim mb-2">{files.length} file(s) queued</div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-[13px] bg-surface-sunken rounded-lg px-3 py-2">
                  <FileIcon size={14} className="text-ink-dim shrink-0" />
                  <span className="flex-1 truncate">{f.name}</span>
                  <span className="text-ink-muted text-[11px]">{fmtSize(f.size)}</span>
                  {progress[f.name] === 100 && <CheckCircle2 size={14} className="text-emerald-600" />}
                  {progress[f.name] === -1 && <span className="text-red-600 text-[11px] font-bold">FAIL</span>}
                  {!progress[f.name] && !uploading && (
                    <button onClick={() => setFiles((fs) => fs.filter((_, j) => j !== i))}
                      className="text-ink-dim hover:text-red-600"><X size={14} /></button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-3 mb-5 md:grid-cols-2">
          <Field label="Title (auto from filename if blank)">
            <input className="input" value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} />
          </Field>
          <Field label="Tags (comma-separated)">
            <input className="input" placeholder="e.g. blueprint, hazop, formula"
              value={meta.tags} onChange={(e) => setMeta({ ...meta, tags: e.target.value })} />
          </Field>
          <Field label="Author">
            <input className="input" value={meta.author} onChange={(e) => setMeta({ ...meta, author: e.target.value })} />
          </Field>
          <Field label="Publisher">
            <input className="input" value={meta.publisher} onChange={(e) => setMeta({ ...meta, publisher: e.target.value })} />
          </Field>
          <Field label="Publish year">
            <input type="number" className="input" value={meta.publish_year} onChange={(e) => setMeta({ ...meta, publish_year: e.target.value })} />
          </Field>
        </div>

        {/* Multi-domain picker (optional, can be assigned later) */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="label m-0">Assign to domain(s)</div>
            <span className="inline-flex items-center gap-1 text-[11px] text-ink-dim">
              <Info size={11} /> Optional — pick any, none, or assign later
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
            {DOMAIN_OPTIONS.map((d) => {
              const selected = meta.domain_ids.split(',').map(s => s.trim()).filter(Boolean).includes(d.id);
              return (
                <label
                  key={d.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-[12.5px] ${
                    selected
                      ? 'bg-brand-50 border-brand-300 text-brand-800'
                      : 'bg-white border-ink-line hover:border-slate-300 text-ink-body'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => {
                      const cur = meta.domain_ids.split(',').map(s => s.trim()).filter(Boolean);
                      const next = selected ? cur.filter(x => x !== d.id) : [...cur, d.id];
                      setMeta({ ...meta, domain_ids: next.join(',') });
                    }}
                    className="accent-brand-600"
                  />
                  <span className="font-semibold">{d.label}</span>
                </label>
              );
            })}
            <label
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-[12.5px] ${
                !meta.domain_ids
                  ? 'bg-slate-100 border-slate-300 text-ink'
                  : 'bg-white border-ink-line hover:border-slate-300 text-ink-dim'
              }`}
              onClick={() => setMeta({ ...meta, domain_ids: '' })}
            >
              <input type="radio" checked={!meta.domain_ids} readOnly className="accent-ink" />
              <span className="font-semibold">Uncategorized · assign later</span>
            </label>
          </div>
        </div>

        <Field label="Description">
          <textarea className="input min-h-[72px]" value={meta.description}
            onChange={(e) => setMeta({ ...meta, description: e.target.value })} />
        </Field>

        {error && <div className="text-red-600 text-[13px] mt-3">{error}</div>}
        {done && (
          <div className={`mt-4 rounded-xl px-4 py-3 text-sm ${done.fail ? 'bg-orange-50 text-orange-800 border border-orange-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
            <strong>Uploaded.</strong> {done.ok} succeeded{done.fail ? `, ${done.fail} failed` : ''}.
          </div>
        )}

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="btn btn-ghost btn-md">Cancel</button>
          <button onClick={upload} disabled={uploading || !files.length} className="btn btn-primary btn-md">
            {uploading ? <><Loader2 className="animate-spin" size={15} /> Uploading {files.length}…</> : <><UploadCloud size={15} /> Upload {files.length || ''}</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────── Bulk action modal ─────────── */
function BulkActionModal({
  mode,
  ids,
  onClose,
  onDone,
}: {
  mode: 'assign_domains' | 'add_tags' | 'delete';
  ids: number[];
  onClose: () => void;
  onDone: (affected: number) => void;
}) {
  const [domainIds, setDomainIds] = useState('');
  const [tags, setTags] = useState('');
  const [merge, setMerge] = useState(true);
  const [err, setErr] = useState('');

  const m = useMutation({
    mutationFn: () => api<{ affected: number }>('/admin/content/bulk', {
      method: 'POST',
      body: JSON.stringify({
        ids,
        action: mode,
        domain_ids: mode === 'assign_domains' ? domainIds : undefined,
        tags: mode === 'add_tags' ? tags : undefined,
        mode: merge ? 'merge' : 'replace',
      }),
    }),
    onSuccess: (res) => onDone(res.affected),
    onError: (e: Error) => setErr(e.message),
  });

  const selectedDomains = domainIds.split(',').map((s) => s.trim()).filter(Boolean);

  const titles: Record<typeof mode, string> = {
    assign_domains: `Assign domains to ${ids.length} item${ids.length === 1 ? '' : 's'}`,
    add_tags:       `Add tags to ${ids.length} item${ids.length === 1 ? '' : 's'}`,
    delete:         `Delete ${ids.length} item${ids.length === 1 ? '' : 's'}?`,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="card w-full max-w-lg p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-extrabold text-ink">{titles[mode]}</h2>
          <button onClick={onClose} className="grid place-items-center h-8 w-8 rounded hover:bg-slate-100"><X size={16} /></button>
        </div>

        {mode === 'delete' && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-[13px] text-red-800 mb-4">
            <strong>This is irreversible.</strong> The selected files, extracted text, and chunks will be permanently removed.
          </div>
        )}

        {mode === 'assign_domains' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-3">
              {DOMAIN_OPTIONS.map((d) => {
                const selected = selectedDomains.includes(d.id);
                return (
                  <label key={d.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-[12.5px] ${
                      selected ? 'bg-brand-50 border-brand-300 text-brand-800' : 'bg-white border-ink-line hover:border-slate-300 text-ink-body'
                    }`}>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => {
                        const next = selected
                          ? selectedDomains.filter((x) => x !== d.id)
                          : [...selectedDomains, d.id];
                        setDomainIds(next.join(','));
                      }}
                      className="accent-brand-600"
                    />
                    <span className="font-semibold">{d.label}</span>
                  </label>
                );
              })}
            </div>
            <label className="flex items-center gap-2 text-[12px] text-ink-body mb-3 cursor-pointer">
              <input type="checkbox" checked={merge} onChange={(e) => setMerge(e.target.checked)} className="accent-brand-600" />
              {merge ? 'Merge with existing domains (add only)' : 'Replace existing domains'}
            </label>
          </>
        )}

        {mode === 'add_tags' && (
          <>
            <Field label="Tags (comma-separated)">
              <input className="input" placeholder="e.g. blueprint, hazop"
                value={tags} onChange={(e) => setTags(e.target.value)} autoFocus />
            </Field>
            <label className="flex items-center gap-2 text-[12px] text-ink-body mt-3 cursor-pointer">
              <input type="checkbox" checked={merge} onChange={(e) => setMerge(e.target.checked)} className="accent-brand-600" />
              {merge ? 'Add to existing tags' : 'Replace existing tags'}
            </label>
          </>
        )}

        {err && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700 mt-3">{err}</div>}

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="btn btn-ghost btn-md">Cancel</button>
          <button
            onClick={() => { setErr(''); m.mutate(); }}
            disabled={m.isPending || (mode === 'assign_domains' && !selectedDomains.length) || (mode === 'add_tags' && !tags.trim())}
            className={`btn btn-md ${mode === 'delete' ? 'border border-red-300 bg-white text-red-600 hover:bg-red-50' : 'btn-primary'}`}
          >
            {m.isPending && <Loader2 size={14} className="animate-spin" />}
            {mode === 'delete' ? `Delete ${ids.length}` : 'Apply'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────── Edit content modal (metadata only — no re-upload) ─────────── */
function EditContentModal({
  item,
  onClose,
  onSaved,
}: {
  item: ContentSource;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [meta, setMeta] = useState({
    title: item.title,
    description: item.description || '',
    domain_ids: item.domain_ids.join(','),
    tags: item.tags.join(','),
    author: item.author || '',
    publisher: item.publisher || '',
    publish_year: item.publish_year ? String(item.publish_year) : '',
  });
  const [err, setErr] = useState('');

  const m = useMutation({
    mutationFn: () => api(`/admin/content/${item.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title: meta.title || null,
        description: meta.description || null,
        domain_ids: meta.domain_ids,
        tags: meta.tags,
        author: meta.author || null,
        publisher: meta.publisher || null,
        publish_year: meta.publish_year ? parseInt(meta.publish_year, 10) : null,
      }),
    }),
    onSuccess: onSaved,
    onError: (e: Error) => setErr(e.message),
  });

  const selectedDomains = meta.domain_ids.split(',').map((s) => s.trim()).filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display text-xl font-extrabold text-ink">Edit Content</h2>
            <p className="text-[12px] text-ink-dim mt-0.5 truncate max-w-lg">{item.original_filename}</p>
          </div>
          <button onClick={onClose} className="grid place-items-center h-8 w-8 rounded hover:bg-slate-100"><X size={16} /></button>
        </div>

        <div className="grid gap-3 mb-5 md:grid-cols-2">
          <Field label="Title">
            <input className="input" value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} />
          </Field>
          <Field label="Tags (comma-separated)">
            <input className="input" value={meta.tags} onChange={(e) => setMeta({ ...meta, tags: e.target.value })} />
          </Field>
          <Field label="Author">
            <input className="input" value={meta.author} onChange={(e) => setMeta({ ...meta, author: e.target.value })} />
          </Field>
          <Field label="Publisher">
            <input className="input" value={meta.publisher} onChange={(e) => setMeta({ ...meta, publisher: e.target.value })} />
          </Field>
          <Field label="Publish year">
            <input type="number" className="input" value={meta.publish_year} onChange={(e) => setMeta({ ...meta, publish_year: e.target.value })} />
          </Field>
        </div>

        <Field label="Description">
          <textarea className="input min-h-[72px]" value={meta.description}
            onChange={(e) => setMeta({ ...meta, description: e.target.value })} />
        </Field>

        {/* Multi-domain picker (same UX as upload modal) */}
        <div className="mt-5 mb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="label m-0">Assign to domain(s)</div>
            <span className="inline-flex items-center gap-1 text-[11px] text-ink-dim">
              <Info size={11} /> Pick any, none, or change later
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
            {DOMAIN_OPTIONS.map((d) => {
              const selected = selectedDomains.includes(d.id);
              return (
                <label
                  key={d.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-[12.5px] ${
                    selected
                      ? 'bg-brand-50 border-brand-300 text-brand-800'
                      : 'bg-white border-ink-line hover:border-slate-300 text-ink-body'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => {
                      const next = selected
                        ? selectedDomains.filter((x) => x !== d.id)
                        : [...selectedDomains, d.id];
                      setMeta({ ...meta, domain_ids: next.join(',') });
                    }}
                    className="accent-brand-600"
                  />
                  <span className="font-semibold">{d.label}</span>
                </label>
              );
            })}
          </div>
          {selectedDomains.length > 0 && (
            <button
              type="button"
              onClick={() => setMeta({ ...meta, domain_ids: '' })}
              className="mt-2 text-[11.5px] font-semibold text-ink-dim hover:text-brand-700 inline-flex items-center gap-1"
            >
              <X size={11} /> Clear all domain assignments
            </button>
          )}
        </div>

        {err && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700 mb-3">
            {err}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn btn-ghost btn-md">Cancel</button>
          <button onClick={() => { setErr(''); m.mutate(); }} disabled={m.isPending} className="btn btn-primary btn-md">
            {m.isPending && <Loader2 className="animate-spin" size={15} />}
            Save changes
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="label">{label}</div>
      {children}
    </label>
  );
}
