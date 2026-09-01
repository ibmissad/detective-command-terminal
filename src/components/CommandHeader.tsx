import { formatClock, useCase } from "@/lib/case-store";
import { Button } from "@/components/ui/button";
import { Timer, Fingerprint, Radio, Users } from "lucide-react";
import { useRoom } from "@/lib/room";

export function CommandHeader() {
  const { caseFile, elapsed, resetTimer, unlocked } = useCase();
  const { roomId, alias, online, members, leaveRoom } = useRoom();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-[110rem] flex-wrap items-center gap-x-4 gap-y-3 px-3 py-3 sm:px-6 sm:py-4">
        <Fingerprint className="h-7 w-7 shrink-0 text-gold sm:h-8 sm:w-8" />
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-wide text-gold sm:text-3xl">
            Sherlock Command Center
          </h1>
          <p className="label-caps">Detective Club · Live Session</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-3 sm:gap-6 lg:ml-auto lg:w-auto">
          <div className="text-left lg:text-right">
            <span className="label-caps flex items-center gap-1 lg:justify-end">
              <Radio className={`h-3 w-3 ${online ? "text-success" : "text-muted-foreground"}`} />
              Room {roomId || "—"}
            </span>
            <p className="flex items-center gap-2 font-mono text-sm text-foreground/80 lg:justify-end">
              <Users className="h-4 w-4 text-gold" />
              {members.length || 1} online · {alias}
            </p>
          </div>
          <div className="min-w-0 text-left lg:text-right">
            <span className="label-caps">Active case</span>
            <p className="max-w-[14rem] truncate text-base text-foreground sm:max-w-xs sm:text-lg">
              {caseFile.title}
            </p>
          </div>
          <div className="text-left lg:text-right">
            <span className="label-caps">Leads</span>
            <p className="font-mono text-lg text-gold">
              {unlocked.length}/{caseFile.hotspots.length}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded border border-gold-dim px-3 py-2 sm:px-4">
            <Timer className="h-5 w-5 text-gold" />
            <span className="font-mono text-xl tabular-nums text-gold sm:text-2xl">
              {formatClock(elapsed)}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1 lg:ml-0">
            <Button variant="ghost" size="sm" className="min-h-11" onClick={resetTimer}>
              Reset timer
            </Button>
            <Button variant="ghost" size="sm" className="min-h-11" onClick={leaveRoom}>
              Leave
            </Button>
          </div>
        </div>
      </div>
      <div className="gold-rule" />
    </header>
  );
}
