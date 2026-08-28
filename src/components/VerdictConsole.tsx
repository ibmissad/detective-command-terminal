import { useState } from "react";
import { useCase } from "@/lib/case-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Gavel, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { saveVerdict } from "@/lib/db";
import { useRoom } from "@/lib/room";

const norm = (s: string) => s.toLowerCase().replace(/[^a-z ]/g, "").trim();

function matches(guess: string, truth: string) {
  const g = norm(guess);
  const t = norm(truth);
  if (!g) return false;
  if (t.includes(g) || g.includes(t)) return true;
  const tokens = t.split(/\s+/).filter((w) => w.length > 3);
  const hits = tokens.filter((w) => g.includes(w)).length;
  return tokens.length > 0 && hits / tokens.length >= 0.5;
}

export function VerdictConsole() {
  const { caseFile, verdict, setVerdict, addLog } = useCase();
  const { roomId } = useRoom();
  const [form, setForm] = useState({ culprit: "", motive: "", weapon: "", keyEvidence: "" });

  const sol = caseFile.solution;
  const results = verdict
    ? {
        culprit: matches(verdict.culprit, sol.culprit),
        motive: matches(verdict.motive, sol.motive),
        weapon: matches(verdict.weapon, sol.weapon),
        keyEvidence: matches(verdict.keyEvidence, sol.keyEvidence),
      }
    : null;
  const cracked = results ? results.culprit && (results.motive || results.keyEvidence) : false;

  const submit = () => {
    if (!form.culprit.trim()) {
      toast.error("Name a culprit before submitting.");
      return;
    }
    setVerdict(form);
    const wasCracked =
      matches(form.culprit, sol.culprit) &&
      (matches(form.motive, sol.motive) || matches(form.keyEvidence, sol.keyEvidence));
    void saveVerdict({ ...form, caseTitle: caseFile.title, cracked: wasCracked, roomCode: roomId })
      .then((r) => r && toast.success("Verdict archived to your database."))
      .catch((e) => toast.error(`Database save failed: ${e.message}`));
    addLog(
      "Verdict filed",
      `Culprit: ${form.culprit} · Motive: ${form.motive} · Weapon: ${form.weapon} · Evidence: ${form.keyEvidence}`,
    );
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
              ? "The club named the right hand behind the crime."
              : "The true culprit walked out of the room tonight."}
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="panel rounded-md p-6">
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

          <section className="panel rounded-md p-6">
            <span className="label-caps">Post-mortem — Logic breakdown</span>
            <p className="mt-3 text-lg leading-relaxed text-foreground/90">{sol.breakdown}</p>
          </section>
        </div>

        <Button variant="outline" size="lg" onClick={() => setVerdict(null)}>
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
      <div className="space-y-5">
        <Field
          label="Culprit"
          value={form.culprit}
          onChange={(v) => setForm({ ...form, culprit: v })}
          placeholder="Who did it?"
        />
        <Field
          label="Weapon / Method"
          value={form.weapon}
          onChange={(v) => setForm({ ...form, weapon: v })}
          placeholder="How was it done?"
        />
        <div>
          <label className="label-caps">Motive</label>
          <Textarea
            rows={3}
            value={form.motive}
            onChange={(e) => setForm({ ...form, motive: e.target.value })}
            placeholder="Why did they do it?"
            className="mt-2 border-border bg-surface-2 text-lg"
          />
        </div>
        <div>
          <label className="label-caps">Key Evidence</label>
          <Textarea
            rows={3}
            value={form.keyEvidence}
            onChange={(e) => setForm({ ...form, keyEvidence: e.target.value })}
            placeholder="What proves it?"
            className="mt-2 border-border bg-surface-2 text-lg"
          />
        </div>
        <Button onClick={submit} size="lg" className="w-full text-lg">
          Submit final verdict
        </Button>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="label-caps">{label}</label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 h-12 border-border bg-surface-2 text-lg"
      />
    </div>
  );
}
