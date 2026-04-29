// Lightweight text-to-speech control using the browser's built-in
// SpeechSynthesis API. Zero backend required.

import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Square, Volume2 } from 'lucide-react';

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export default function AudioListener({ text, label = 'Listen to this topic' }: { text: string; label?: string }) {
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Strip HTML so we don't read out tags
  const plain = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  if (!supported) return null;

  const start = () => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(plain);
    u.rate = rate;
    u.pitch = 1;
    u.onend = () => { setPlaying(false); setPaused(false); };
    u.onerror = () => { setPlaying(false); setPaused(false); };
    utterRef.current = u;
    window.speechSynthesis.speak(u);
    setPlaying(true);
    setPaused(false);
  };

  const pause = () => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setPaused(true);
    } else if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setPaused(false);
    }
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setPlaying(false);
    setPaused(false);
  };

  const toggle = () => (playing ? pause() : start());

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-ink-line bg-white px-2 py-1 shadow-sm">
      <button
        onClick={toggle}
        className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white transition hover:opacity-90"
        title={playing && !paused ? 'Pause' : 'Play'}
      >
        {playing && !paused ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
      </button>
      {playing && (
        <button
          onClick={stop}
          className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-ink-body transition hover:bg-slate-200"
          title="Stop"
        >
          <Square size={12} />
        </button>
      )}
      <span className="flex items-center gap-1.5 px-1.5 text-[12px] font-semibold text-ink-body">
        <Volume2 size={13} className="text-ink-dim" /> {label}
      </span>
      <select
        value={rate}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          setRate(v);
          if (playing && utterRef.current) {
            // restart at new speed
            stop();
            setTimeout(start, 80);
          }
        }}
        className="cursor-pointer rounded-md bg-surface px-1.5 py-1 text-[11px] font-bold text-ink-body outline-none ring-1 ring-ink-line hover:bg-slate-100"
      >
        {SPEEDS.map((s) => (
          <option key={s} value={s}>{s}x</option>
        ))}
      </select>
    </div>
  );
}
