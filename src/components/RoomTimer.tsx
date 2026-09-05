import { Button } from "@/components/ui/button";
import { formatCountdown, useTimer, TIMER_PRESETS } from "@/lib/timer";
import { Play, Pause, RotateCcw, Lock, Hourglass } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function RoomTimer() {
  const { remainingMs, running, locked, canControl, start, pause, reset, setDuration } = useTimer();
  const urgent = remainingMs <= 60_000 && remainingMs > 0;
  const done = remainingMs <= 0;

  return (
    <div
      className={`flex items-center gap-2 rounded border px-3 py-2 sm:px-4 ${
        locked || done ? "border-destructive" : urgent ? "border-destructive" : "border-gold-dim"
      }`}
    >
      {locked ? (
        <Lock className="h-5 w-5 text-destructive" />
      ) : (
        <Hourglass className={`h-5 w-5 ${running ? "text-gold animate-pulse" : "text-gold"}`} />
      )}
      <div className="leading-tight">
        <span className="font-mono text-xl tabular-nums text-gold sm:text-2xl">
          {formatCountdown(remainingMs)}
        </span>
        <p className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
          {locked ? "Verdict filed · locked" : running ? "Running" : done ? "Time up" : "Paused"}
        </p>
      </div>

      {canControl && !locked && (
        <div className="flex items-center gap-1">
          {running ? (
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={pause} aria-label="Pause timer">
              <Pause className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={start} aria-label="Start timer">
              <Play className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => reset()}
            aria-label="Reset timer"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 font-mono text-[0.65rem] uppercase">
                Set
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {TIMER_PRESETS.map((m) => (
                <DropdownMenuItem key={m} onClick={() => setDuration(m)}>
                  {m} minutes
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
