import { formatClock, useCase } from "@/lib/case-store";
import { Button } from "@/components/ui/button";
import { Timer, Fingerprint } from "lucide-react";

export function CommandHeader() {
  const { caseFile, elapsed, resetTimer, unlocked } = useCase();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-[110rem] flex-wrap items-center gap-4 px-6 py-4">
        <Fingerprint className="h-8 w-8 text-gold" />
        <div>
          <h1 className="text-2xl font-semibold tracking-wide text-gold sm:text-3xl">
            Sherlock Command Center
          </h1>
          <p className="label-caps">Detective Club · Live Session</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-6">
          <div className="text-right">
            <span className="label-caps">Active case</span>
            <p className="max-w-xs truncate text-lg text-foreground">{caseFile.title}</p>
          </div>
          <div className="text-right">
            <span className="label-caps">Leads found</span>
            <p className="font-mono text-lg text-gold">
              {unlocked.length}/{caseFile.hotspots.length}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded border border-gold-dim px-4 py-2">
            <Timer className="h-5 w-5 text-gold" />
            <span className="font-mono text-2xl tabular-nums text-gold">{formatClock(elapsed)}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={resetTimer}>
            Reset timer
          </Button>
        </div>
      </div>
      <div className="gold-rule" />
    </header>
  );
}
