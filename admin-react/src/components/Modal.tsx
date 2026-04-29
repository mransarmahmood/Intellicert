import { X } from 'lucide-react';
import type { ReactNode } from 'react';

export default function Modal({
  title,
  children,
  onClose,
  size = 'md',
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  size?: 'md' | 'lg' | 'xl';
}) {
  const widths = { md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-3xl' };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className={`card w-full ${widths[size]} my-8 p-6`}>
        <div className="mb-5 flex items-start justify-between">
          <h3 className="font-display text-[18px] font-bold text-ink">{title}</h3>
          <button onClick={onClose} className="text-ink-muted hover:text-ink">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
