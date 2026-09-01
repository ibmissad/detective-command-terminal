import { useEffect } from "react";
import { formatClock, useCase } from "@/lib/case-store";
import { Button } from "@/components/ui/button";
import { Timer, Fingerprint, Radio, Users } from "lucide-react";
import { useRoom } from "@/lib/room";
import { ApiKeyDialog } from "@/components/ApiKeyDialog";
import { DatabaseConfigDialog } from "@/components/DatabaseConfigDialog";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function CommandHeader() {
  const { caseFile, elapsed, resetTimer, unlocked } = useCase();
  const { roomId, alias, online, members, leaveRoom, setOnline } = useRoom() as any; // fallback if setOnline exists, or manage via local effect
  const { user } = useAuth();

  // Sync Supabase presence real-time state
  useEffect(() => {
    if (!user || !roomId) return;

    const channel = supabase.channel(`room_${roomId}`, {
      config: { presence: { key: user.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        // Presence state synced successfully
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            online_at: new Date().toISOString(),
            alias: alias || user.email?.split("@")[0],
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [roomId, user, alias]);

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
              <Radio className={`h-3 w-3 ${online ? "text-success animate-pulse" : "text-emerald-500 animate-pulse"}`} />
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
          <div className="ml-auto flex flex-wrap items-center gap-2 lg:ml-0">
            <ApiKeyDialog />
            <DatabaseConfigDialog />
            <Button variant="ghost" size="sm" className="min-h-9" onClick={resetTimer}>
              Reset timer
            </Button>
            <Button variant="ghost" size="sm" className="min-h-9" onClick={leaveRoom}>
              Leave
            </Button>
          </div>
        </div>
      </div>
      <div className="gold-rule" />
    </header>
  );
}
