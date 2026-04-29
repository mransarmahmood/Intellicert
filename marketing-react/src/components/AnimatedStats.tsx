import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

type Stat = {
  value: number;
  label: string;
  suffix?: string;
  prefix?: string;
};

const STATS: Stat[] = [
  { value: 15000, label: 'Students Trained',  suffix: '+' },
  { value: 95,    label: 'Pass Rate',         suffix: '%' },
  { value: 7,     label: 'Certifications Covered' },
  { value: 2000,  label: 'Practice Questions', suffix: '+' },
];

export default function AnimatedStats() {
  const ref = useRef<HTMLDivElement>(null);
  const [animated, setAnimated] = useState<number[]>(STATS.map(() => 0));
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started) {
            setStarted(true);
            STATS.forEach((stat, idx) => {
              const duration = 1500;
              const step = stat.value / (duration / 30);
              let cur = 0;
              const t = window.setInterval(() => {
                cur += step;
                if (cur >= stat.value) {
                  cur = stat.value;
                  window.clearInterval(t);
                }
                setAnimated((prev) => {
                  const n = [...prev];
                  n[idx] = Math.floor(cur);
                  return n;
                });
              }, 30);
            });
          }
        });
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [started]);

  return (
    <div ref={ref} className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
      {STATS.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: i * 0.08 }}
          className="text-center"
        >
          <div className="font-display text-4xl font-extrabold tracking-tight text-brand-600 md:text-5xl">
            {s.prefix}{animated[i].toLocaleString()}{s.suffix}
          </div>
          <div className="mt-1.5 text-[13px] font-medium text-ink-dim md:text-[14px]">{s.label}</div>
        </motion.div>
      ))}
    </div>
  );
}
