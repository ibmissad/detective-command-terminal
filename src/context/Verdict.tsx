import React, { useState } from "react";
import { useCase } from "@/lib/case-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, Gavel } from "lucide-react";
import { toast } from "sonner";

const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();

function evaluateFuzzyMatch(userInput: string, solutionText: string): boolean {
  const user = normalize(userInput);
  const solution = normalize(solutionText);

  if (!user || !solution) return false;

  // Direct substring hit in either direction
  if (solution.includes(user) || user.includes(solution)) return true;

  const userWords = user.split(/\s+/).filter((w) => w.length >= 3);
  const solutionWords = solution.split(/\s+/).filter((w) => w.length >= 3);

  // Keyword overlap
  const wordOverlap = userWords.some((uWord) =>
    solutionWords.some((sWord) => sWord.includes(uWord) || uWord.includes(sWord))
  );

  if (wordOverlap) return true;

  // Partial phrase hit ratio
  const matchedCount = solutionWords.filter((sWord) => user.includes(sWord)).length;
  return solutionWords.length > 0 && matchedCount / solutionWords.length >= 0.3;
}

export function Verdict() {
  const { caseFile, verdict, setVerdict } = useCase();
  const [form, setForm] = useState({ culprit: "", motive: "", weapon: "", keyEvidence: "" });

  const solution = caseFile.solution;

  const results = verdict
    ? {
        culprit: evaluateFuzzyMatch(verdict.culprit, solution.culprit),
        motive: evaluateFuzzyMatch(verdict.motive, solution.motive),
        weapon: evaluateFuzzyMatch(verdict.weapon, solution.weapon),
        keyEvidence: evaluateFuzzyMatch(verdict.keyEvidence, solution.keyEvidence),
      }
    : null;

  // Case is SOLVED purely based on correct culprit identification
  const isSolved = results ? results.culprit : false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.culprit.trim()) {
      toast.error("You must identify a prime suspect.");
      return;
    }
    setVerdict(form);
  };

  if (verdict && results) {
    return (
      <div className="space-y-6">
        <section
          className={`panel rounded-md border-2 p-8 text-center ${
            isSolved ? "border-success bg-success/5" : "border-destructive bg-destructive/5"
          }`}
        >
          {isSolved ? (
            <CheckCircle2 className="mx-auto h-16 w-16 text-success" />
          ) : (
            <XCircle className="mx-auto h-16 w-16 text-destructive" />
          )}

          <h2 className={`mt-4 text-4xl font-bold ${isSolved ? "text-success" : "text-destructive"}`}>
            {isSolved ? "Case Solved!" : "Case Unsolved"}
          </h2>

          <p className="mt-2 text-lg text-muted-foreground">
            {isSolved
              ? "The prime suspect was accurately identified!"
              : "The true perpetrator remains at large."}
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="panel rounded-md p-6">
            <span className="label-caps">Verdict Evaluation Breakdown</span>
            <div className="mt-4 space-y-4">
              {/* Culprit Evaluation */}
              <div className="rounded border border-border p-3">
                <div className="flex items-center gap-2">
                  {results.culprit ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  <span className="font-semibold uppercase tracking-wider text-sm">
                    Culprit (Required)
                  </span>
                </div>
                <p className="mt-1 text-sm">
                  <span className="text-muted-foreground">Submitted:</span> {verdict.culprit || "—"}
                </p>
                <p className="text-sm text-gold">
                  <span className="text-muted-foreground">Actual:</span> {solution.culprit}
                </p>
              </div>

              {/* Bonus Criteria */}
              {(["motive", "weapon", "keyEvidence"] as const).map((key) => (
                <div key={key} className="rounded border border-border/60 p-3 opacity-90">
                  <div className="flex items-center gap-2">
                    {results[key] ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="label-caps">
                      {key === "keyEvidence" ? "Key Evidence (Bonus)" : `${key} (Bonus)`}
                    </span>
                  </div>
                  <p className="mt-1 text-sm">
                    <span className="text-muted-foreground">Submitted:</span> {verdict[key] || "—"}
                  </p>
                  <p className="text-sm text-gold">
                    <span className="text-muted-foreground">Actual:</span> {solution[key]}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="panel rounded-md p-6">
            <span className="label-caps">Post-Mortem Logic Breakdown</span>
            <p className="mt-3 text-base leading-relaxed text-foreground/90">{solution.breakdown}</p>
          </section>
        </div>

        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            setVerdict(null);
            setForm({ culprit: "", motive: "", weapon: "", keyEvidence: "" });
          }}
        >
          File Another Verdict
        </Button>
      </div>
    );
  }

  return (
    <section className="panel mx-auto max-w-2xl rounded-md p-6">
      <div className="flex items-center gap-2">
        <Gavel className="h-5 w-5 text-gold" />
        <span className="label-caps">Submit Final Verdict</span>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="label-caps mb-1 block text-gold">Culprit *</label>
          <Input
            required
            value={form.culprit}
            onChange={(e) => setForm({ ...form, culprit: e.target.value })}
            placeholder="Name the suspect..."
            className="border-border bg-surface-2 text-lg"
          />
        </div>

        <div>
          <label className="label-caps mb-1 block">Weapon / Method (Optional Bonus)</label>
          <Input
            value={form.weapon}
            onChange={(e) => setForm({ ...form, weapon: e.target.value })}
            placeholder="How was the crime committed?"
            className="border-border bg-surface-2"
          />
        </div>

        <div>
          <label className="label-caps mb-1 block">Motive (Optional Bonus)</label>
          <Textarea
            rows={2}
            value={form.motive}
            onChange={(e) => setForm({ ...form, motive: e.target.value })}
            placeholder="Why was it committed?"
            className="border-border bg-surface-2"
          />
        </div>

        <div>
          <label className="label-caps mb-1 block">Key Evidence (Optional Bonus)</label>
          <Textarea
            rows={2}
            value={form.keyEvidence}
            onChange={(e) => setForm({ ...form, keyEvidence: e.target.value })}
            placeholder="What piece of evidence seals it?"
            className="border-border bg-surface-2"
          />
        </div>

        <Button type="submit" size="lg" className="w-full text-base">
          Submit Official Verdict
        </Button>
      </form>
    </section>
  );
}
