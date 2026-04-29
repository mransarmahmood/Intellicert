import { useRef, useState } from 'react';
import { Loader2, Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiUpload } from '../lib/api';
import Modal from './Modal';

type Preview = { headers: string[]; preview_rows: string[][]; total_rows: number };
type Result = { imported: number; errors: { row: number; email?: string; key?: string; error: string }[] };

export type ImportConfig = {
  title: string;
  importPath: string; // e.g. /bulk-import/users
  requiredColumns: string[];
  hint: string;
  templateRows?: string;
};

export default function ImportModal({
  config,
  onClose,
  onSuccess,
}: {
  config: ImportConfig;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState<'preview' | 'import' | null>(null);
  const [err, setErr] = useState('');

  const onPick = async (f: File | null) => {
    setErr('');
    setPreview(null);
    setResult(null);
    setFile(f);
    if (!f) return;
    setBusy('preview');
    try {
      const fd = new FormData();
      fd.append('csv_file', f);
      const data = await apiUpload<Preview & { success: boolean }>('/bulk-import/preview', fd);
      setPreview(data);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(null);
    }
  };

  const doImport = async () => {
    if (!file) return;
    setErr('');
    setResult(null);
    setBusy('import');
    try {
      const fd = new FormData();
      fd.append('csv_file', file);
      const data = await apiUpload<Result & { success: boolean; message: string }>(config.importPath, fd);
      setResult(data);
      if (data.imported > 0) onSuccess();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal title={config.title} onClose={onClose} size="xl">
      <div className="space-y-5">
        {/* Required columns hint */}
        <div className="rounded-lg border border-ink-line bg-surface px-4 py-3 text-[12.5px] text-ink-body">
          <div className="font-semibold text-ink">{config.hint}</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {config.requiredColumns.map((c) => (
              <code key={c} className="rounded bg-white px-1.5 py-0.5 text-[11px] ring-1 ring-ink-line">{c}</code>
            ))}
          </div>
          {config.templateRows && (
            <pre className="mt-2 overflow-x-auto rounded bg-white px-2 py-1.5 text-[11px] text-ink-dim ring-1 ring-ink-line">
              {config.templateRows}
            </pre>
          )}
        </div>

        {/* File picker */}
        <div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-ink-line bg-white px-5 py-6 text-left transition hover:border-brand-500/40 hover:bg-brand-50/30"
          >
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-500/15">
              {file ? <FileSpreadsheet size={22} /> : <Upload size={22} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-ink">{file ? file.name : 'Click to choose CSV file'}</div>
              <div className="text-[12px] text-ink-dim">
                {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Drop a file picker — CSV only'}
              </div>
            </div>
            {busy === 'preview' && <Loader2 className="animate-spin text-ink-dim" size={18} />}
          </button>
        </div>

        {/* Preview */}
        {preview && (
          <div>
            <div className="mb-2 text-[12px] font-semibold text-ink-body">
              Preview · first {preview.preview_rows.length} of <strong>{preview.total_rows}</strong> rows
            </div>
            <div className="overflow-x-auto rounded-lg border border-ink-line">
              <table className="w-full text-left text-[12px]">
                <thead className="bg-surface text-[10px] font-bold uppercase tracking-wider text-ink-dim">
                  <tr>
                    {preview.headers.map((h, i) => (
                      <th key={i} className="px-3 py-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-line bg-white">
                  {preview.preview_rows.map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td key={ci} className="max-w-[220px] truncate px-3 py-2 text-ink-body">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className={`rounded-lg border p-4 ${result.errors.length === 0 ? 'border-green-300 bg-green-50' : 'border-amber-300 bg-amber-50'}`}>
            <div className="flex items-center gap-2 text-[14px] font-bold text-ink">
              {result.errors.length === 0 ? <CheckCircle2 size={16} className="text-green-600" /> : <AlertCircle size={16} className="text-amber-600" />}
              Imported {result.imported} {result.errors.length > 0 && `· ${result.errors.length} errors`}
            </div>
            {result.errors.length > 0 && (
              <div className="mt-3 max-h-44 overflow-y-auto rounded bg-white px-3 py-2 text-[12px]">
                {result.errors.map((e, i) => (
                  <div key={i} className="border-b border-ink-line py-1 last:border-0">
                    <span className="font-bold text-ink">Row {e.row}</span>
                    {(e.email || e.key) && <span className="ml-2 text-ink-dim">· {e.email || e.key}</span>}
                    <span className="ml-2 text-red-600">— {e.error}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {err && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">{err}</div>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn btn-ghost btn-md">{result ? 'Close' : 'Cancel'}</button>
          <button
            onClick={doImport}
            className="btn btn-primary btn-md"
            disabled={!preview || busy === 'import'}
          >
            {busy === 'import' && <Loader2 size={14} className="animate-spin" />}
            Import {preview ? `${preview.total_rows} rows` : ''}
          </button>
        </div>
      </div>
    </Modal>
  );
}
