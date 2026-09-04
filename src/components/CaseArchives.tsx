import { useEffect, useState } from "react";
import { listSessions, listTranscript, listVerdicts, readDbConfig, type SavedSession } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Archive, Trophy, MessagesSquare } from "lucide-react";
import { toast } from "sonner";

type VerdictRow = Awaited<ReturnType<typeof listVerdicts>>[number];
type TranscriptRow = Awaited<ReturnType<typeof listTranscript>>[number];

export function CaseArchives() {
  const [verdicts, setVerdicts] = useState<VerdictRow[]>([]);
  const [solved, setSolved] = useState<SavedSession[]>([]);
  const [openCase, setOpenCase] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptRow[]>([]);
  const [loading, setLoading] = useState(false);

  const envUrl = import.meta.env.VITE_SUPABASE_URL || "";
  const dbReady = Boolean(envUrl || readDbConfig().url);

  const load = () => {
    if (!dbReady) return;
    setLoading(true);
    Promise.all([listVerdicts(), listSessions(true)])
      .then(([v, s]) => {
        setVerdicts(v);
        setSolved(s);
      })
      .catch((e: Error) => toast.error(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [dbReady]);

  const openTranscript = (caseTitle: string) => {
    setOpenCase(caseTitle);
    listTranscript(caseTitle)
      .then(setTranscript)
      .catch((e: Error) => toast.error(e.message));
  };

  if (!dbReady) {
    return (
      <section className="panel rounded-md p-8 text-center">
        <Archive className="mx-auto h-9 w-9 text-gold" />
        <p className="mt-3 text-base text-muted-foreground">
          Connect your database to view the Hall of Fame archive.
        </p>
      </section>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="panel rounded-md p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <span className="label-caps flex items-center gap-2">
            <Trophy className="h-4 w-4 text-gold" /> Hall of Fame — filed verdicts
          </span>
          <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </Button>
        </div>
        <ul className="mt-4 space-y-3">
          {verdicts.length === 0 && (
            <li className="text-base text-muted-foreground">No verdicts filed yet.</li>
          )}
          {verdicts.map((v) => (
            <li key={v.id} className="rounded border border-border bg-surface-2 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-lg text-gold">{v.case_title}</span>
                <span
                  className={`font-mono text-xs uppercase tracking-widest ${
                    v.cracked ? "text-success" : "text-destructive"
                  }`}
                >
                  {v.cracked ? "case cracked" : "unsolved"}
                </span>
                <span className="ml-auto font-mono text-xs text-muted-foreground">
                  {new Date(v.created_at).toLocaleString()} · room {v.room_code ?? "—"}
                </span>
              </div>
              <p className="mt-2 text-base text-foreground/85">
                Culprit: {v.culprit} · Motive: {v.motive || "—"} · Weapon: {v.weapon || "—"}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => openTranscript(v.case_title)}
              >
                <MessagesSquare className="mr-2 h-4 w-4" /> View transcript
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel rounded-md p-4 sm:p-6">
        <span className="label-caps flex items-center gap-2">
          <MessagesSquare className="h-4 w-4 text-gold" />
          {openCase ? `Transcript — ${openCase}` : "Interrogation transcript"}
        </span>
        {!openCase && (
          <p className="mt-4 text-base text-muted-foreground">
            Pick a filed verdict to replay the club's full interrogation transcript.
          </p>
        )}
        <div className="mt-4 max-h-[32rem] space-y-3 overflow-y-auto pr-2">
          {openCase && transcript.length === 0 && (
            <p className="text-base text-muted-foreground">No recorded questions for this case.</p>
          )}
          {transcript.map((t) => (
            <div key={t.id} className="rounded border border-border bg-surface-2 p-3">
              <p className="text-base text-foreground/90">
                <span className="text-gold">[{t.detective_alias || "Detective"}]</span> {t.question}
              </p>
              <p className="mt-1 text-base text-foreground/70">
                <span className="text-gold-dim">{t.suspect_name}:</span> {t.answer}
              </p>
            </div>
          ))}
        </div>

        {solved.length > 0 && (
          <>
            <div className="gold-rule my-5" />
            <span className="label-caps">Completed sessions</span>
            <ul className="mt-2 space-y-1 font-mono text-sm text-foreground/80">
              {solved.map((s) => (
                <li key={s.id}>
                  {s.case_title} · room {s.room_code} · {new Date(s.updated_at).toLocaleDateString()}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
