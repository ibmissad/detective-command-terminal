import { useState, type FormEvent } from "react";
import { useCase } from "@/lib/case-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Gavel, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { saveVerdict } from "@/lib/db";
import { useRoom } from "@/lib/room";

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();

function matches(guess: string, truth: string) {
  const g = norm(guess);
  const t = norm(truth);
  if (!g || !t) return false;

  // Direct inclusion match
  if (t.includes(g) || g.includes(t)) return true;

  // Single word keyword match (e.g., "business" matching "business embezzlement")
  const gWords = g.split(/\s+/).filter((w) => w.length >= 3);
  const tWords = t.split(/\s+/).filter((w) => w.length >= 3);

  const hasKeywordHit = gWords.some((gw) => tWords.some((tw) => tw.includes(gw) || gw.includes(tw)));
  if (hasKeywordHit) return true;

  // Ratio check fallback
  const hits = tWords.filter((w) => g.includes(w)).length;
  return tWords.length > 0 && hits / tWords.length >= 0.3;
}

const INITIAL_FORM = { culprit: "", motive: "", weapon: "", keyEvidence: "" };

export function VerdictConsole() {
  const { caseFile, verdict, setVerdict, addLog } = useCase();
  const { roomId } = useRoom();
  const [form, setForm] = useState(INITIAL_FORM);

  const sol = caseFile.solution;
  const results = verdict
    ? {
        culprit: matches(verdict.culprit, sol.culprit),
        motive: matches(verdict.motive, sol.motive),
        weapon: matches(verdict.weapon, sol.weapon),
        keyEvidence: matches(verdict.keyEvidence, sol.keyEvidence),
      }
    : null;

  // Case is CRACKED as long as the culprit is correct
  const cracked = results ? results.culprit : false;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.culprit.trim()) {
      toast.error("Name a culprit before submitting.");
      return;
    }
    setVerdict(form);

    // Cracked if culprit is matched
    const wasCracked = matches(form.culprit, sol.culprit);

    void saveVerdict({ ...form, caseTitle: caseFile.title, cracked: wasCracked, roomCode: roomId })
      .then((r) => r && toast.success("Verdict archived to your database."))
      .catch((err: Error) => toast.error(`Database save failed: ${err.message}`));

    addLog(
      "Verdict filed",
      `Culprit: ${form.culprit} · Motive: ${form.motive} · Weapon: ${form.weapon} · Evidence: ${form.keyEvidence}`,
    );
  };

  const handleReset = () => {
    setVerdict(null);
    setForm(INITIAL_FORM);
  };

  if (verdict && results) {
    return (
      <div className="space-y-6">
        <section
          className={`panel rounded-md border-2 p-8 text-center ${
            cracked ? "border-success" : "border-destructive"
          }`}
        >
          {cracked ? (
            <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
          ) : (
            <XCircle className="mx-auto h-14 w-14 text-destructive" />
          )}
          <h2 className={`mt-4 text-5xl ${cracked ? "text-success" : "text-destructive"}`}>
            {cracked ? "Case Cracked" : "Case Unsolved"}
          </h2>
          <p className="mt-3 text-xl text-muted-foreground">
            {cracked
              ? "The club named the right culprit behind the crime!"
              : "The true culprit walked out of the room tonight."}
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="panel rounded-md p-4 sm:p-6">
            <span className="label-caps">Verdict vs. Truth</span>
            <div className="mt-4 space-y-4">
              {(["culprit", "motive", "weapon", "keyEvidence"] as const).map((k) => (
                <div key={k}>
                  <div className="flex items-center gap-2">
                    {results[k] ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    <span className="label-caps">{k === "keyEvidence" ? "Key evidence" : k}</span>
                  </div>
                  <p className="mt-1 text-lg">
                    <span className="text-muted-foreground">Club:</span> {verdict[k] || "—"}
                  </p>
                  <p className="text-lg text-gold">
                    <span className="text-muted-foreground">Truth:</span> {sol[k]}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="panel rounded-md p-4 sm:p-6">
            <span className="label-caps">Post-mortem — Logic breakdown</span>
            <p className="mt-3 text-lg leading-relaxed text-foreground/90">{sol.breakdown}</p>
          </section>
        </div>

        <Button variant="outline" size="lg" onClick={handleReset}>
          File a new verdict
        </Button>
      </div>
    );
  }

  return (
    <section className="panel mx-auto max-w-3xl rounded-md p-8">
      <div className="flex items-center gap-2">
        <Gavel className="h-5 w-5 text-gold" />
        <span className="label-caps">Official Verdict Submission</span>
      </div>
      <h2 className="mt-2 text-3xl text-gold">{caseFile.title}</h2>
      <div className="gold-rule my-5" />
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field
          id="culprit"
          label="Culprit"
          value={form.culprit}
          onChange={(v) => setForm((p) => ({ ...p, culprit: v }))}
          placeholder="Who did it?"
        />
        <Field
          id="weapon"
          label="Weapon / Method"
          value={form.weapon}
          onChange={(v) => setForm((p) => ({ ...p, weapon: v }))}
          placeholder="How was it done?"
        />
        <div>
          <label htmlFor="motive" className="label-caps">Motive</label>
          <Textarea
            id="motive"
            rows={3}
            value={form.motive}
            onChange={(e) => setForm((p) => ({ ...p, motive: e.target.value }))}
            placeholder="Why did they do it?"
            className="mt-2 border-border bg-surface-2 text-lg"
          />
        </div>
        <div>
          <label htmlFor="keyEvidence" className="label-caps">Key Evidence</label>
          <Textarea
            id="keyEvidence"
            rows={3}
            value={form.keyEvidence}
            onChange={(e) => setForm((p) => ({ ...p, keyEvidence: e.target.value }))}
            placeholder="What proves it?"
            className="mt-2 border-border bg-surface-2 text-lg"
          />
        </div>
        <Button type="submit" size="lg" className="w-full text-lg">
          Submit final verdict
        </Button>
      </form>
    </section>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="label-caps">{label}</label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 h-12 border-border bg-surface-2 text-lg"
      />
    </div>
  );
}
