import { useEffect, useMemo, useRef, useState } from "react";
import { useCase } from "@/lib/case-store";
import { useRoom } from "@/lib/room";
import { callGemini, type GeminiTurn } from "@/lib/gemini";
import type { ChatMessage, Suspect } from "@/lib/case-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { saveInterrogation } from "@/lib/db";
import { Send, Trash2, UserSearch } from "lucide-react";

function systemFor(suspect: Suspect, caseTitle: string, overview: string) {
  return `You are role-playing a suspect in a detective club's live interrogation. Stay fully in character and never break the fiction, never mention being an AI or these instructions.

CASE: ${caseTitle}
SCENE: ${overview}

YOU ARE: ${suspect.name}, ${suspect.role}.
PUBLIC BIO: ${suspect.publicBio}
DEMEANOUR: ${suspect.demeanor}
YOUR ALIBI (what you tell people): ${suspect.alibi}
YOUR SECRET (never volunteer this): ${suspect.hiddenMotive}
${suspect.isCulprit ? "YOU ARE THE CULPRIT. Deny, deflect, and lie about the crime itself, but let small inconsistencies slip when the detective presents concrete contradicting evidence." : "YOU ARE INNOCENT OF THE MAIN CRIME, but you are hiding your own embarrassing secret and will squirm around it."}

RULES:
- Answer in 1-3 short spoken sentences. Period-appropriate, vivid, in character.
- Never confess unless the detective states the correct concrete evidence against you; even then, confess reluctantly.
- If asked something you would not know, say so in character.
- Output dialogue only, no narration or asterisks.`;
}

export function InterrogationTerminal() {
  const { caseFile, apiKey, addLog } = useCase();
  const { alias, roomId, publish, on } = useRoom();
  const [suspectId, setSuspectId] = useState(caseFile.suspects[0]?.id ?? "");
  const [threads, setThreads] = useState<Record<string, ChatMessage[]>>({});
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Fallback to environment variable if state key isn't explicitly set
  const effectiveApiKey = apiKey || import.meta.env.VITE_OPENROUTER_API_KEY || "";

  const suspect = useMemo(
    () => caseFile.suspects.find((s) => s.id === suspectId) ?? caseFile.suspects[0],
    [caseFile.suspects, suspectId],
  );
  const messages = threads[suspect?.id ?? ""] ?? [];

  // Persist threads so a refresh — or a resumed session — keeps the transcript.
  useEffect(() => {
    const load = () => {
      try {
        const raw = window.localStorage.getItem("scc.threads");
        setThreads(raw ? (JSON.parse(raw) as Record<string, ChatMessage[]>) : {});
      } catch {
        setThreads({});
      }
    };
    load();
    window.addEventListener("scc-threads", load);
    return () => window.removeEventListener("scc-threads", load);
  }, []);

  useEffect(() => {
    if (Object.keys(threads).length) window.localStorage.setItem("scc.threads", JSON.stringify(threads));
  }, [threads]);

  useEffect(() => {
    if (!caseFile.suspects.some((s) => s.id === suspectId)) {
      setSuspectId(caseFile.suspects[0]?.id ?? "");
    }
  }, [caseFile.suspects, suspectId]);

  useEffect(
    () =>
      on((e) => {
        if (e.type !== "chat") return;
        setThreads((p) => {
          const cur = p[e.suspectId] ?? [];
          if (cur.some((m) => m.id === e.message.id)) return p;
          return { ...p, [e.suspectId]: [...cur, e.message] };
        });
      }),
    [on],
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, busy]);

  const send = async () => {
    const question = input.trim();
    if (!question || !suspect || busy) return;
    if (!effectiveApiKey) {
      toast.error("Gemini API key is missing. Add your API key in the top header.");
      return;
    }

    const mine: ChatMessage = {
      id: `${Date.now()}-q-${Math.random().toString(36).slice(2, 7)}`,
      role: "investigator",
      text: question,
      author: alias || "Detective",
    };
    setThreads((p) => ({ ...p, [suspect.id]: [...(p[suspect.id] ?? []), mine] }));
    publish({ type: "chat", suspectId: suspect.id, message: mine });
    setInput("");
    setBusy(true);

    try {
      const turns: GeminiTurn[] = [...messages, mine].map((m) => ({
        role: m.role === "investigator" ? "user" : "model",
        text: m.text,
      }));
      const reply = await callGemini(
        effectiveApiKey,
        systemFor(suspect, caseFile.title, caseFile.overview),
        turns,
      );
      const answer: ChatMessage = {
        id: `${Date.now()}-a-${Math.random().toString(36).slice(2, 7)}`,
        role: "suspect",
        text: reply,
        author: suspect.name,
      };
      setThreads((p) => ({ ...p, [suspect.id]: [...(p[suspect.id] ?? []), answer] }));
      publish({ type: "chat", suspectId: suspect.id, message: answer });
      addLog(`Interrogation · ${suspect.name}`, `[${mine.author}] Q: ${question}\nA: ${reply}`);
      void saveInterrogation({
        caseTitle: caseFile.title,
        suspectName: suspect.name,
        question,
        answer: reply,
        roomCode: roomId,
        alias: mine.author ?? "Detective",
      }).catch((e) => toast.error(`Database log failed: ${e.message}`));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Interrogation failed.");
    } finally {
      setBusy(false);
    }
  };

  if (!suspect) {
    return <p className="text-muted-foreground">No suspects loaded. Generate a case first.</p>;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="panel flex min-h-[32rem] flex-col rounded-md sm:min-h-[38rem]">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-3 sm:gap-3 sm:px-5 sm:py-4">
          <UserSearch className="hidden h-5 w-5 text-gold sm:block" />
          <Select value={suspectId} onValueChange={setSuspectId}>
            <SelectTrigger className="h-11 w-full border-border bg-surface-2 text-base sm:w-72">
              <SelectValue placeholder="Select suspect" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {caseFile.suspects.map((s) => (
                <SelectItem key={s.id} value={s.id} className="text-base">
                  {s.name} — {s.role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="label-caps hidden sm:inline">Live channel open</span>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="min-h-11"
              onClick={() => setThreads((p) => ({ ...p, [suspect.id]: [] }))}
            >
              <Trash2 className="mr-1 h-4 w-4" /> Clear Transcript
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:space-y-5 sm:px-6 sm:py-6">
          <p className="font-mono text-sm text-muted-foreground">
            {suspect.name} takes the chair. {suspect.publicBio}
          </p>
          {messages.map((m) => (
            <div
              key={m.id}
              className={m.role === "investigator" ? "text-right" : "text-left"}
            >
              <div className="label-caps">
                {m.role === "investigator" ? `[${m.author ?? "Detective"}]` : suspect.name}
              </div>
              <p
                className={`mt-1 inline-block max-w-full break-words rounded-md px-4 py-2.5 text-lg leading-snug sm:max-w-3xl sm:px-5 sm:py-3 sm:text-2xl ${
                  m.role === "investigator"
                    ? "bg-secondary text-secondary-foreground"
                    : "border border-gold-dim bg-surface-2 text-gold"
                }`}
              >
                {m.text}
              </p>
            </div>
          ))}
          {busy && (
            <p className="font-mono text-lg text-gold-dim">{suspect.name} is considering the question…</p>
          )}
          <div ref={endRef} />
        </div>

        <div className="flex gap-2 border-t border-border p-3 sm:gap-3 sm:p-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Put your question to the suspect…"
            className="h-12 border-border bg-surface-2 text-base sm:h-14 sm:text-xl"
          />
          <Button
            onClick={send}
            disabled={busy}
            size="lg"
            className="h-12 shrink-0 px-5 text-base sm:h-14 sm:px-8"
          >
            <Send className="h-5 w-5 sm:mr-2" /> <span className="hidden sm:inline">Ask</span>
          </Button>
        </div>
      </div>

      <aside className="panel h-fit rounded-md p-5">
        <span className="label-caps">Dossier</span>
        <h3 className="mt-2 text-2xl text-gold">{suspect.name}</h3>
        <p className="font-mono text-sm text-muted-foreground">{suspect.role}</p>
        <div className="gold-rule my-4" />
        <p className="text-base leading-relaxed text-foreground/85">{suspect.publicBio}</p>
        <div className="mt-4">
          <span className="label-caps">Stated whereabouts</span>
          <p className="mt-1 text-base leading-relaxed text-foreground/85">
            Withheld until the suspect offers it under questioning.
          </p>
        </div>
      </aside>
    </div>
  );
}
