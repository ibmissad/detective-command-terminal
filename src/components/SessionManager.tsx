import { useCallback, useEffect, useState } from "react";
import { useCase } from "@/lib/case-store";
import { useRoom } from "@/lib/room";
import { listSessions, saveSession, type SavedSession, type SessionState } from "@/lib/db";
import type { ChatMessage } from "@/lib/case-types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Save, History, PlayCircle } from "lucide-react";

function readThreads(): Record<string, ChatMessage[]> {
  try {
    const raw = window.localStorage.getItem("scc.threads");
    return raw ? (JSON.parse(raw) as Record<string, ChatMessage[]>) : {};
  } catch {
    return {};
  }
}

export function SessionManager() {
  const { caseFile, log, unlocked, verdict, loadState } = useCase();
  const { roomId } = useRoom();
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    listSessions()
      .then(setSessions)
      .catch((e: Error) => toast.error(e.message));
  }, []);

  useEffect(load, [load]);

  const save = () => {
    setBusy(true);
    const state: SessionState = { caseFile, log, unlocked, verdict, chats: readThreads() };
    void saveSession(roomId, state, Boolean(verdict?.culprit))
      .then((r) => {
        if (!r) {
          toast.error("Failed to save session to the database.");
          return;
        }
        toast.success("Session saved. Resume it any time.");
        load();
      })
      .catch((e: Error) => toast.error(e.message))
      .finally(() => setBusy(false));
  };

  const resume = (s: SavedSession) => {
    const st = s.state;
    loadState({
      caseFile: st.caseFile,
      log: st.log ?? [],
      unlocked: st.unlocked ?? [],
      verdict: st.verdict ?? null,
    });
    window.localStorage.setItem("scc.threads", JSON.stringify(st.chats ?? {}));
    window.dispatchEvent(new Event("scc-threads"));
    toast.success(`Resumed: ${s.case_title}`);
  };

  return (
    <section className="panel rounded-md p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="label-caps flex items-center gap-2">
          <History className="h-4 w-4 text-gold" /> Save &amp; resume
        </span>
        <Button onClick={save} disabled={busy} size="lg">
          <Save className="mr-2 h-4 w-4" /> {busy ? "Saving…" : "Save session"}
        </Button>
      </div>
      <p className="mt-3 text-base text-muted-foreground">
        Saves the current room code, unlocked clues, case log, interrogation transcripts and verdict
        state to your club database.
      </p>

      <ul className="mt-5 space-y-2">
        {sessions.length === 0 && (
          <li className="text-base text-muted-foreground">No saved sessions yet.</li>
        )}
        {sessions.map((s) => (
          <li
            key={s.id}
            className="flex flex-wrap items-center gap-3 rounded border border-border bg-surface-2 px-4 py-3"
          >
            <span className="text-lg text-gold">{s.case_title}</span>
            <span className="font-mono text-sm text-muted-foreground">
              room {s.room_code} · {new Date(s.updated_at).toLocaleString()}
            </span>
            <span
              className={`font-mono text-xs uppercase tracking-widest ${
                s.solved ? "text-success" : "text-muted-foreground"
              }`}
            >
              {s.solved ? "solved" : "in progress"}
            </span>
            <Button size="sm" variant="outline" className="ml-auto" onClick={() => resume(s)}>
              <PlayCircle className="mr-1 h-4 w-4" /> Resume case
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
