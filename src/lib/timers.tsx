import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

// Görev zamanlayıcıları — uygulama kökünde yaşar, böylece sayfa değişse de
// (arka planda) saymaya devam eder. localStorage'a yazılır; uygulama kapanıp
// açılsa bile geçen süre korunur.
interface TimerState {
  elapsed: number; // saniye (durdurulmuş toplam)
  running: boolean;
  startedAt: number | null; // çalışıyorsa epoch ms
}

interface TimersCtx {
  timers: Record<number, TimerState>;
  seconds: (taskId: number) => number;
  isRunning: (taskId: number) => boolean;
  start: (taskId: number) => void;
  stop: (taskId: number) => void;
  reset: (taskId: number) => void;
}

const Ctx = createContext<TimersCtx | null>(null);
const KEY = "pms.timers";

function load(): Record<number, TimerState> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const [timers, setTimers] = useState<Record<number, TimerState>>(load);
  const [, force] = useState(0);
  const tref = useRef<number | null>(null);

  // Çalışan zamanlayıcı varken saniyede bir yeniden çiz.
  useEffect(() => {
    const anyRunning = Object.values(timers).some((t) => t.running);
    if (anyRunning && tref.current == null) {
      tref.current = window.setInterval(() => force((n) => n + 1), 1000);
    } else if (!anyRunning && tref.current != null) {
      clearInterval(tref.current);
      tref.current = null;
    }
    return () => {
      if (tref.current != null) {
        clearInterval(tref.current);
        tref.current = null;
      }
    };
  }, [timers]);

  const persist = (next: Record<number, TimerState>) => {
    setTimers(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const seconds = (taskId: number) => {
    const t = timers[taskId];
    if (!t) return 0;
    return t.running && t.startedAt ? t.elapsed + Math.floor((Date.now() - t.startedAt) / 1000) : t.elapsed;
  };

  const isRunning = (taskId: number) => !!timers[taskId]?.running;

  const start = (taskId: number) => {
    const cur = timers[taskId] ?? { elapsed: 0, running: false, startedAt: null };
    persist({ ...timers, [taskId]: { ...cur, running: true, startedAt: Date.now() } });
  };

  const stop = (taskId: number) => {
    const cur = timers[taskId];
    if (!cur || !cur.running) return;
    const elapsed = cur.elapsed + Math.floor((Date.now() - (cur.startedAt ?? Date.now())) / 1000);
    persist({ ...timers, [taskId]: { elapsed, running: false, startedAt: null } });
  };

  const reset = (taskId: number) => {
    const next = { ...timers };
    delete next[taskId];
    persist(next);
  };

  return (
    <Ctx.Provider value={{ timers, seconds, isRunning, start, stop, reset }}>{children}</Ctx.Provider>
  );
}

export function useTimers() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTimers, TimerProvider içinde kullanılmalı");
  return ctx;
}

// saniye -> "01:23:45"
export function formatDuration(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}
