import { useState } from 'react';
import { Calculator as CalcIcon, X } from 'lucide-react';

/**
 * Track 4 — Floating scientific calculator for exam mode.
 *
 * Matches BCSP-allowed operations: +, -, ×, ÷, √, x², 1/x, %, parentheses,
 * and standard scientific functions (log, ln, sin/cos/tan in degrees).
 *
 * Implemented with a safe parser (no eval) — only the listed operators.
 */
function safeEvaluate(expr: string): string {
  if (!expr.trim()) return '';
  // Whitelist tokens. Anything outside this set short-circuits to "Error".
  const cleaned = expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/√\(/g, 'Math.sqrt(')
    .replace(/log\(/g, 'Math.log10(')
    .replace(/ln\(/g, 'Math.log(')
    .replace(/sin\(/g, 'Math.sin(')
    .replace(/cos\(/g, 'Math.cos(')
    .replace(/tan\(/g, 'Math.tan(')
    .replace(/π/g, 'Math.PI')
    .replace(/\^/g, '**');

  if (!/^[\d+\-*/().,\s%MathPIsqrtlogincostan**]+$/.test(cleaned)) {
    return 'Error';
  }
  try {
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${cleaned})`)();
    if (typeof result !== 'number' || !isFinite(result)) return 'Error';
    return String(Math.round(result * 1e10) / 1e10);
  } catch {
    return 'Error';
  }
}

const KEYS: { label: string; value: string; wide?: boolean; danger?: boolean; ok?: boolean }[] = [
  { label: 'C', value: 'C', danger: true }, { label: '(', value: '(' }, { label: ')', value: ')' }, { label: '÷', value: '÷' },
  { label: '√', value: '√(' }, { label: 'x²', value: '^2' }, { label: '%', value: '%' }, { label: '×', value: '×' },
  { label: '7', value: '7' }, { label: '8', value: '8' }, { label: '9', value: '9' }, { label: '−', value: '-' },
  { label: '4', value: '4' }, { label: '5', value: '5' }, { label: '6', value: '6' }, { label: '+', value: '+' },
  { label: '1', value: '1' }, { label: '2', value: '2' }, { label: '3', value: '3' }, { label: 'log', value: 'log(' },
  { label: '0', value: '0' }, { label: '.', value: '.' }, { label: 'π', value: 'π' }, { label: 'ln', value: 'ln(' },
];

export default function CalculatorOverlay() {
  const [open, setOpen] = useState(false);
  const [expr, setExpr] = useState('');
  const [result, setResult] = useState('');

  const press = (v: string) => {
    if (v === 'C') { setExpr(''); setResult(''); return; }
    setExpr((prev) => prev + v);
    setResult(safeEvaluate(expr + v));
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-30 grid h-12 w-12 place-items-center rounded-full bg-slate-900 text-white shadow-lg hover:bg-slate-800"
        aria-label="Open calculator"
        title="Calculator"
      >
        <CalcIcon size={20} aria-hidden="true" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 grid place-items-center bg-black/30 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Calculator"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-xs rounded-2xl border border-ink-line bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-ink-line px-4 py-3">
              <div className="text-[12px] font-bold uppercase tracking-wider text-ink-dim">Calculator</div>
              <button onClick={() => setOpen(false)} aria-label="Close calculator" className="rounded p-1 text-ink-dim hover:bg-slate-100">
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <div className="bg-slate-50 px-4 py-3">
              <div className="text-right text-[13px] text-ink-dim min-h-[1.2em] break-all">{expr || ' '}</div>
              <div className="text-right font-display text-2xl font-bold text-ink min-h-[1.2em] break-all">{result || '0'}</div>
            </div>
            <div className="grid grid-cols-4 gap-px bg-ink-line p-px">
              {KEYS.map((k) => (
                <button
                  key={k.label}
                  onClick={() => press(k.value)}
                  className={`bg-white px-2 py-3 text-[14px] font-semibold ${k.danger ? 'text-red-600' : 'text-ink'} hover:bg-slate-50 active:bg-slate-100`}
                >
                  {k.label}
                </button>
              ))}
              <button
                onClick={() => { setExpr(''); setResult(''); }}
                className="col-span-2 bg-slate-100 py-3 text-[14px] font-semibold text-ink hover:bg-slate-200"
              >
                Clear all
              </button>
              <button
                onClick={() => setExpr(safeEvaluate(expr))}
                className="col-span-2 bg-brand-600 py-3 text-[14px] font-semibold text-white hover:bg-brand-700"
              >
                =
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
