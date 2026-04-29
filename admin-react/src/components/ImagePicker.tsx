import { useRef, useState } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
import { apiUpload } from '../lib/api';

/**
 * Combined input field that lets the user either:
 *   - Type/paste an image URL
 *   - OR upload a file (multipart) which is then stored at /uploads/...
 *     and the resulting URL is written back into the field.
 */
export default function ImagePicker({
  value,
  onChange,
  placeholder = 'https://... or upload',
}: {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const upload = async (file: File) => {
    setBusy(true); setErr('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await apiUpload<{ url: string }>('/uploads/image', fd);
      onChange(res.url);
    } catch (e: any) {
      setErr(e.message ?? 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          className="input flex-1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="btn btn-ghost btn-md shrink-0"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          Upload
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
          }}
        />
      </div>
      {value && (
        <div className="relative inline-block">
          <img src={value.startsWith('http') ? value : value} alt="Preview" className="h-24 w-24 rounded-lg object-cover ring-1 ring-ink-line" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-white text-ink-muted shadow ring-1 ring-ink-line hover:text-red-600"
            title="Clear"
          >
            <X size={11} />
          </button>
        </div>
      )}
      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[12px] text-red-700">{err}</div>
      )}
    </div>
  );
}
