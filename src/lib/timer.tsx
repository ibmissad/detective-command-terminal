import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRoom } from "./room";
import { useCase } from "./case-store";

export type TimerSnapshot = {
  durationMs: number;
  remainingMs: number;
  running: boolean;
  locked: boolean;
};

const KEY_TIMER = "scc.timer";
export const TIMER_PRESETS = [15, 30, 45, 60, 90];
const DEFAULT_DURATION = 45 * 60_000;

type Ctx = {
  remainingMs: number;
  durationMs: number;
  running: boolean;
  locked: boolean;
  canControl: boolean;
  start: () => void;
  pause: () => void;
  reset: (minutes?: number) => void;
  setDuration: (minutes: number) => void;
};

const TimerCtx = createContext<Ctx | null>(null);

export function formatCountdown(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const parts = h > 0 ? [h, m, s] : [m, s];
  return parts.map((n) => String(n).padStart(2, "0")).join(":");
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const { isHost, publish, on } = useRoom();
  const { verdict } = useCase();

  // Anchor model: remaining at anchor + local monotonic offset. Anchoring on
  // receipt avoids drift from unsynced device clocks.
  const [anchor, setAnchor] = useState<{ remainingMs: number; at: number }>({
    remainingMs: DEFAULT_DURATION,
    at: Date.now(),
  });
  const [durationMs, setDurationMs] = useState(DEFAULT_DURATION);
  const [running, setRunning] = useState(false);
  const [locked, setLocked] = useState(false);
  const [tick, setTick] = useState(0);

  const remainingMs = running
    ? Math.max(0, anchor.remainingMs - (Date.now() - anchor.at))
    : anchor.remainingMs;

  useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), 250);
    return () => window.clearInterval(t);
  }, []);
  void tick;

  // Restore host-side settings so a refresh keeps the room clock sane.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY_TIMER);
      if (!raw) return;
      const s = JSON.parse(raw) as TimerSnapshot;
      setDurationMs(s.durationMs);
      setAnchor({ remainingMs: s.remainingMs, at: Date.now() });
      setLocked(Boolean(s.locked));
    } catch {
      /* ignore */
    }
  }, []);

  const stateRef = useRef({ durationMs, running, locked, anchor });
  stateRef.current = { durationMs, running, locked, anchor };

  const broadcast = useCallback(
    (snap: TimerSnapshot) => {
      publish({ type: "timer", timer: snap });
      window.localStorage.setItem(KEY_TIMER, JSON.stringify(snap));
    },
    [publish],
  );

  const snapshot = useCallback((): TimerSnapshot => {
    const s = stateRef.current;
    const rem = s.running
      ? Math.max(0, s.anchor.remainingMs - (Date.now() - s.anchor.at))
      : s.anchor.remainingMs;
    return { durationMs: s.durationMs, remainingMs: rem, running: s.running, locked: s.locked };
  }, []);

  const apply = useCallback((snap: TimerSnapshot) => {
    setDurationMs(snap.durationMs);
    setRunning(snap.running && !snap.locked && snap.remainingMs > 0);
    setLocked(snap.locked);
    setAnchor({ remainingMs: snap.remainingMs, at: Date.now() });
  }, []);

  // Receive remote timer state / answer late joiners.
  useEffect(
    () =>
      on((e) => {
        if (e.type === "timer") {
          if (!isHost) apply(e.timer);
        } else if (e.type === "sync-request" && isHost) {
          broadcast(snapshot());
        }
      }),
    [on, isHost, apply, broadcast, snapshot],
  );

  // Host heartbeat keeps every device re-anchored — no accumulating drift.
  useEffect(() => {
    if (!isHost) return;
    const t = window.setInterval(() => broadcast(snapshot()), 5000);
    return () => window.clearInterval(t);
  }, [isHost, broadcast, snapshot]);

  // Verdict filed → clock stops and locks for everyone.
  useEffect(() => {
    if (!verdict || locked) return;
    const snap = { ...snapshot(), running: false, locked: true };
    setRunning(false);
    setLocked(true);
    setAnchor({ remainingMs: snap.remainingMs, at: Date.now() });
    if (isHost) broadcast(snap);
  }, [verdict, locked, isHost, broadcast, snapshot]);

  const hostAction = useCallback(
    (next: TimerSnapshot) => {
      apply(next);
      broadcast(next);
    },
    [apply, broadcast],
  );

  const value = useMemo<Ctx>(
    () => ({
      remainingMs,
      durationMs,
      running,
      locked,
      canControl: isHost,
      start: () => {
        if (!isHost || locked) return;
        const rem = snapshot().remainingMs || durationMs;
        hostAction({ durationMs, remainingMs: rem, running: true, locked: false });
      },
      pause: () => {
        if (!isHost || locked) return;
        hostAction({ ...snapshot(), running: false });
      },
      reset: (minutes) => {
        if (!isHost) return;
        const d = minutes ? minutes * 60_000 : durationMs;
        hostAction({ durationMs: d, remainingMs: d, running: false, locked: false });
      },
      setDuration: (minutes) => {
        if (!isHost) return;
        const d = minutes * 60_000;
        hostAction({ durationMs: d, remainingMs: d, running: false, locked: locked });
      },
    }),
    [remainingMs, durationMs, running, locked, isHost, hostAction, snapshot],
  );

  return <TimerCtx.Provider value={value}>{children}</TimerCtx.Provider>;
}

export function useTimer() {
  const ctx = useContext(TimerCtx);
  if (!ctx) throw new Error("useTimer must be used within TimerProvider");
  return ctx;
}
