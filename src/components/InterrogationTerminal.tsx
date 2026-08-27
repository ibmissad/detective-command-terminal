import { useEffect, useMemo, useRef, useState } from "react";
import { useCase } from "@/lib/case-store";
import { callGemini, type GeminiTurn } from "@/lib/gemini";
import type { ChatMessage, Suspect } from "@/lib/case-types";
import { ApiKeyDialog } from "./ApiKeyDialog";
import { DatabaseConfigDialog } from "./DatabaseConfigDialog";
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
  const [suspectId, setSuspectId] = useState(caseFile.suspects[0]?.id ?? "");
  const [threads, setThreads] = useState<Record<string, ChatMessage[]>>({});
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const suspect = useMemo(
    () => caseFile.suspects.find((s) => s.id === suspectId) ?? caseFile.suspects[0],
    [caseFile.suspects, suspectId],
  );
  const messages = threads[suspect?.id ?? ""] ?? [];

  useEffect(() => {
    if (!caseFile.suspects.some((s) => s.id === suspectId)) {
      setSuspectId(caseFile.suspects[0]?.id ?? "");
    }
  }, [caseFile.suspects, suspectId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, busy]);

  const send = async () => {
    const question = input.trim();
    if (!question || !suspect || busy) return;
    if (!apiKey) {
      toast.error("Add your Gemini API key in Terminal Settings first.");
      return;
    }

    const mine: ChatMessage = { id: `${Date.now()}-q`, role: "investigator", text: question };
    setThreads((p) => ({ ...p, [suspect.id]: [...(p[suspect.id] ?? []), mine] }));
    setInput("");
    setBusy(true);

    try {
      const turns: GeminiTurn[] = [...messages, mine].map((m) => ({
        role: m.role === "investigator" ? "user" : "model",
        text: m.text,
      }));
      const reply = await callGemini(
        apiKey,
        systemFor(suspect, caseFile.title, caseFile.overview),
        turns,
      );
      setThreads((p) => ({
        ...p,
        [suspect.id]: [...(p[suspect.id] ?? []), { id: `${Date.now()}-a`, role: "suspect", text: reply }],
      }));
      addLog(`Interrogation · ${suspect.name}`, `Q: ${question}\nA: ${reply}`);
      void saveInterrogation({
        caseTitle: caseFile.title,
        suspectName: suspect.name,
        question,
        answer: reply,
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
      <div className="panel flex min-h-[38rem] flex-col rounded-md">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
          <UserSearch className="h-5 w-5 text-gold" />
          <Select value={suspectId} onValueChange={setSuspectId}>
            <SelectTrigger className="h-11 w-72 border-border bg-surface-2 text-base">
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
          <span className="label-caps">Live channel open</span>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setThreads((p) => ({ ...p, [suspect.id]: [] }))}
            >
              <Trash2 className="mr-1 h-4 w-4" /> Clear
            </Button>
            <ApiKeyDialog />
            <DatabaseConfigDialog />
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-6">
          <p className="font-mono text-sm text-muted-foreground">
            {suspect.name} takes the chair. {suspect.publicBio}
          </p>
          {messages.map((m) => (
            <div
              key={m.id}
              className={m.role === "investigator" ? "text-right" : "text-left"}
            >
              <div className="label-caps">
                {m.role === "investigator" ? "Club Investigator" : suspect.name}
              </div>
              <p
                className={`mt-1 inline-block max-w-3xl rounded-md px-5 py-3 text-2xl leading-snug ${
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

        <div className="flex gap-3 border-t border-border p-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Put your question to the suspect…"
            className="h-14 border-border bg-surface-2 text-xl"
          />
          <Button onClick={send} disabled={busy} size="lg" className="h-14 px-8 text-base">
            <Send className="mr-2 h-5 w-5" /> Ask
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
