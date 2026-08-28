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
import type { CaseFile, LogEntry, Verdict } from "./case-types";
import { DEFAULT_CASE } from "./default-case";
import { useRoom } from "./room";


const KEY_CASE = "scc.case";
const KEY_LOG = "scc.log";
const KEY_UNLOCKED = "scc.unlocked";
const KEY_APIKEY = "scc.apikey";
const KEY_START = "scc.start";
const KEY_VERDICT = "scc.verdict";

type Ctx = {
  caseFile: CaseFile;
  setCaseFile: (c: CaseFile) => void;
  log: LogEntry[];
  addLog: (source: string, text: string) => void;
  clearLog: () => void;
  unlocked: string[];
  unlock: (id: string) => void;
  apiKey: string;
  setApiKey: (k: string) => void;
  elapsed: number;
  resetTimer: () => void;
  verdict: Verdict | null;
  setVerdict: (v: Verdict | null) => void;
  resetSession: () => void;
};

const CaseContext = createContext<Ctx | null>(null);

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function CaseProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [caseFile, setCaseFileState] = useState<CaseFile>(DEFAULT_CASE);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [apiKey, setApiKeyState] = useState("");
  const [startedAt, setStartedAt] = useState<number>(0);
  const [verdict, setVerdictState] = useState<Verdict | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    setCaseFileState(read(KEY_CASE, DEFAULT_CASE));
    setLog(read<LogEntry[]>(KEY_LOG, []));
    setUnlocked(read<string[]>(KEY_UNLOCKED, []));
    setApiKeyState(read<string>(KEY_APIKEY, ""));
    setVerdictState(read<Verdict | null>(KEY_VERDICT, null));
    const s = read<number>(KEY_START, 0) || Date.now();
    window.localStorage.setItem(KEY_START, JSON.stringify(s));
    setStartedAt(s);
    setNow(Date.now());
    setHydrated(true);
  }, []);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const persist = useCallback((key: string, value: unknown) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(value));
  }, []);

  const { publish, on, isHost } = useRoom();
  const stateRef = useRef({ caseFile, log, unlocked });
  stateRef.current = { caseFile, log, unlocked };

  const appendLog = useCallback(
    (entry: LogEntry) => {
      setLog((prev) => {
        if (prev.some((e) => e.id === entry.id)) return prev;
        const next = [...prev, entry];
        persist(KEY_LOG, next);
        return next;
      });
    },
    [persist],
  );

  const addLog = useCallback(
    (source: string, text: string) => {
      const entry: LogEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ts: Date.now(),
        source,
        text,
      };
      appendLog(entry);
      publish({ type: "log", entry });
    },
    [appendLog, publish],
  );

  useEffect(
    () =>
      on((e) => {
        if (e.type === "log") appendLog(e.entry);
        else if (e.type === "hotspot")
          setUnlocked((prev) => {
            if (prev.includes(e.id)) return prev;
            const next = [...prev, e.id];
            persist(KEY_UNLOCKED, next);
            return next;
          });
        else if (e.type === "case") {
          setCaseFileState(e.caseFile);
          persist(KEY_CASE, e.caseFile);
        } else if (e.type === "verdict") {
          setVerdictState(e.verdict);
          persist(KEY_VERDICT, e.verdict);
        } else if (e.type === "sync-request" && isHost) {
          const s = stateRef.current;
          publish({ type: "sync-state", caseFile: s.caseFile, log: s.log, unlocked: s.unlocked });
        } else if (e.type === "sync-state" && !isHost) {
          setCaseFileState(e.caseFile);
          setLog(e.log);
          setUnlocked(e.unlocked);
          persist(KEY_CASE, e.caseFile);
          persist(KEY_LOG, e.log);
          persist(KEY_UNLOCKED, e.unlocked);
        }
      }),
    [on, publish, isHost, appendLog, persist],
  );

  const value = useMemo<Ctx>(
    () => ({
      caseFile,
      setCaseFile: (c) => {
        setCaseFileState(c);
        persist(KEY_CASE, c);
        publish({ type: "case", caseFile: c });
      },
      log,
      addLog,
      clearLog: () => {
        setLog([]);
        persist(KEY_LOG, []);
      },
      unlocked,
      unlock: (id) => {
        setUnlocked((prev) => {
          if (prev.includes(id)) return prev;
          const next = [...prev, id];
          persist(KEY_UNLOCKED, next);
          return next;
        });
        publish({ type: "hotspot", id, label: "", detail: "", by: "" });
      },
      apiKey,
      setApiKey: (k) => {
        setApiKeyState(k);
        persist(KEY_APIKEY, k);
      },
      elapsed: hydrated && startedAt ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0,
      resetTimer: () => {
        const s = Date.now();
        setStartedAt(s);
        persist(KEY_START, s);
      },
      verdict,
      setVerdict: (v) => {
        setVerdictState(v);
        persist(KEY_VERDICT, v);
        publish({ type: "verdict", verdict: v });
      },
      resetSession: () => {
        setLog([]);
        setUnlocked([]);
        setVerdictState(null);
        const s = Date.now();
        setStartedAt(s);
        persist(KEY_LOG, []);
        persist(KEY_UNLOCKED, []);
        persist(KEY_VERDICT, null);
        persist(KEY_START, s);
      },
    }),
    [caseFile, log, unlocked, apiKey, verdict, now, startedAt, hydrated, addLog, persist, publish],
  );

  return <CaseContext.Provider value={value}>{children}</CaseContext.Provider>;
}

export function useCase() {
  const ctx = useContext(CaseContext);
  if (!ctx) throw new Error("useCase must be used within CaseProvider");
  return ctx;
}

export function formatClock(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}
