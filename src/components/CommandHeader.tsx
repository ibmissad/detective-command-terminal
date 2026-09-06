import { useCase } from "@/lib/case-store";
import { Button } from "@/components/ui/button";
import { Fingerprint, Radio, Users, LogOut } from "lucide-react";
import { useRoom } from "@/lib/room";
import { ApiKeyDialog } from "@/components/ApiKeyDialog";
import { DatabaseConfigDialog } from "@/components/DatabaseConfigDialog";
import { HowToPlay } from "@/components/HowToPlay";
import { RoomTimer } from "@/components/RoomTimer";

export function CommandHeader() {
  const { caseFile, unlocked } = useCase();
  const { roomId, alias, isHost, online, members, leaveRoom } = useRoom();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-[110rem] items-center gap-3 px-3 py-3 sm:px-6 sm:py-4">
        <Fingerprint className="h-7 w-7 shrink-0 text-gold sm:h-8 sm:w-8" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold tracking-wide text-gold sm:text-3xl">
            Sherlock Command Center
          </h1>
          <p className="label-caps hidden sm:block">Detective Club · Live Session</p>
        </div>
        <div className="shrink-0">
          <RoomTimer />
        </div>
        <HowToPlay trigger="icon" />
        <Button
          variant="ghost"
          size="sm"
          className="min-h-11 min-w-11 shrink-0 px-0 sm:min-w-0 sm:px-3"
          onClick={leaveRoom}
          aria-label="Leave room"
        >
          <LogOut className="h-4 w-4 sm:hidden" />
          <span className="hidden sm:inline">Leave</span>
        </Button>
      </div>

      <div className="-mx-3 flex items-center gap-2 overflow-x-auto border-t border-border/60 px-3 py-2 sm:mx-0 sm:flex-wrap sm:border-t-0 sm:px-6 sm:pb-3">
        <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-gold-dim bg-surface-2 px-3 py-1.5 font-mono text-xs text-foreground/90">
          <Radio className={`h-3 w-3 ${online ? "text-success animate-pulse" : "text-emerald-500 animate-pulse"}`} />
          Room {roomId || "—"}
        </span>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-gold-dim bg-surface-2 px-3 py-1.5 font-mono text-xs text-foreground/90">
          <Users className="h-3.5 w-3.5 text-gold" />
          {members.length || 1} online · {alias}
        </span>
        <span className="flex shrink-0 max-w-[12rem] items-center gap-1.5 truncate rounded-full border border-gold-dim bg-surface-2 px-3 py-1.5 font-mono text-xs text-foreground/90 sm:max-w-xs">
          {caseFile.title}
        </span>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-gold-dim bg-surface-2 px-3 py-1.5 font-mono text-xs text-gold">
          Leads {unlocked.length}/{caseFile.hotspots.length}
        </span>
        {isHost && (
          <div className="flex shrink-0 items-center gap-2 sm:ml-auto">
            <ApiKeyDialog />
            <DatabaseConfigDialog />
          </div>
        )}
      </div>
      <div className="gold-rule" />
    </header>
  );
}
