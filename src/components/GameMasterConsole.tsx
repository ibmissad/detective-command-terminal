import { useState } from "react";
import { useCase } from "@/lib/case-store";
import { callGemini, extractJson } from "@/lib/gemini";
import type { CaseFile } from "@/lib/case-types";
import { DEFAULT_CASE } from "@/lib/default-case";
import { ApiKeyDialog } from "./ApiKeyDialog";
import { DatabaseConfigDialog } from "./DatabaseConfigDialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { saveCase } from "@/lib/db";
import { useRoom } from "@/lib/room";
import { RoomInvite } from "./RoomInvite";
import { EyeOff, Eye, RotateCcw, Wand2 } from "lucide-react";

const GEN_PROMPT = `You are the Game Master engine for a live detective club. Given a case concept, invent a complete, internally consistent mystery.

Return ONLY JSON matching this shape:
{
  "title": string,
  "overview": string (120-180 words, atmospheric crime scene narrative),
  "policeReport": string (a terse official report with times, findings, plain line breaks),
  "hotspots": [ { "id": "h1", "x": number 8-92, "y": number 12-88, "label": string, "detail": string (2-3 sentences of deduction-relevant discovery) } ] (exactly 6, spread across the image, no two within 12 units of each other),
  "suspects": [ { "id": "s1", "name": string, "role": string, "publicBio": string, "demeanor": string, "hiddenMotive": string (secret, second person, addressed to the suspect), "alibi": string, "isCulprit": boolean } ] (exactly 4, exactly one culprit, the three innocents each hide an unrelated embarrassing secret),
  "clues": [ { "id": "c1", "title": string, "detail": string } ] (exactly 3 physical evidence transcripts),
  "solution": { "culprit": string (must match a suspect name), "motive": string, "weapon": string, "keyEvidence": string, "breakdown": string (150-220 words explaining the chain of deduction and why each innocent is cleared) }
}

The solution must be deducible from the hotspots and clues alone. No supernatural elements.`;

export function GameMasterConsole() {
  const { caseFile, setCaseFile, apiKey, resetSession } = useCase();
  const { roomId } = useRoom();
  const [concept, setConcept] = useState("");
  const [busy, setBusy] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const generate = async () => {
    if (!concept.trim()) {
      toast.error("Enter a case concept first.");
      return;
    }
    if (!apiKey) {
      toast.error("Add your Gemini API key first.");
      return;
    }
    setBusy(true);
    try {
      const raw = await callGemini(
        apiKey,
        GEN_PROMPT,
        [{ role: "user", text: `Case concept: ${concept.trim()}` }],
        true,
      );
      const parsed = extractJson(raw) as CaseFile;
      if (!parsed.suspects?.length || !parsed.hotspots?.length || !parsed.solution?.culprit) {
        throw new Error("The generated case was incomplete. Try again.");
      }
      setCaseFile(parsed);
      resetSession();
      toast.success(`Case loaded: ${parsed.title}`);
      void saveCase(parsed, roomId)
        .then((r) => r && toast.success("Case archived to your database."))
        .catch((e) => toast.error(`Database save failed: ${e.message}`));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <RoomInvite />
      <section className="panel rounded-md p-6">
        <div className="flex items-center justify-between">
          <span className="label-caps">Game Master · Case Forge</span>
          <div className="flex gap-2">
            <DatabaseConfigDialog />
            <ApiKeyDialog />
          </div>
        </div>
        <h2 className="mt-2 text-2xl text-gold">Generate a new mystery</h2>
        <p className="mt-2 text-base text-muted-foreground">
          Enter a brief case concept (e.g. "Stolen diamond at a museum gala"). The engine writes
          suspect profiles with hidden motives and alibis, physical clues, six scene hotspots, and
          the exact true solution.
        </p>
        <Textarea
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          rows={4}
          placeholder="Stolen diamond at a museum gala…"
          className="mt-4 border-border bg-surface-2 text-lg"
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={generate} disabled={busy} size="lg">
            <Wand2 className="mr-2 h-5 w-5" />
            {busy ? "Forging case…" : "Generate case"}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              setCaseFile(DEFAULT_CASE);
              resetSession();
              toast.success("Restored the built-in case.");
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Load built-in case
          </Button>
          <Button variant="ghost" size="lg" onClick={resetSession}>
            Reset session
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              void saveCase(caseFile, roomId)
                .then((r) =>
                  r
                    ? toast.success("Current case archived.")
                    : toast.error("Connect a database first."),
                )
                .catch((e) => toast.error(`Database save failed: ${e.message}`));
            }}

          >
            Archive current case
          </Button>
        </div>
      </section>

      <section className="panel rounded-md p-6">
        <div className="flex items-center justify-between">
          <span className="label-caps">Sealed Solution — Game Master eyes only</span>
          <Button variant="ghost" size="sm" onClick={() => setRevealed((r) => !r)}>
            {revealed ? <EyeOff className="mr-1 h-4 w-4" /> : <Eye className="mr-1 h-4 w-4" />}
            {revealed ? "Hide" : "Reveal"}
          </Button>
        </div>
        {!revealed ? (
          <p className="mt-6 font-mono text-base text-muted-foreground">
            [ REDACTED ] Do not project this panel while the club is playing.
          </p>
        ) : (
          <div className="mt-4 space-y-3 text-base">
            <Row label="Culprit" value={caseFile.solution.culprit} />
            <Row label="Motive" value={caseFile.solution.motive} />
            <Row label="Weapon" value={caseFile.solution.weapon} />
            <Row label="Key evidence" value={caseFile.solution.keyEvidence} />
            <div>
              <span className="label-caps">Hidden motives</span>
              <ul className="mt-1 space-y-2">
                {caseFile.suspects.map((s) => (
                  <li key={s.id} className="text-foreground/85">
                    <span className="text-gold">{s.name}</span>
                    {s.isCulprit && <span className="ml-2 text-destructive">[CULPRIT]</span>} —{" "}
                    {s.hiddenMotive}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="label-caps">{label}</span>
      <p className="text-foreground/90">{value}</p>
    </div>
  );
}
