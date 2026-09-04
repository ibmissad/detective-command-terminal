import { useState, type FormEvent } from "react";
import { makeRoomCode, useRoom } from "@/lib/room";
import { readDbConfig } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatabaseConfigDialog } from "./DatabaseConfigDialog";
import { toast } from "sonner";
import { Radio } from "lucide-react";

export function RoomGate() {
  const { joined, hostRoom, joinRoom, online } = useRoom();
  const [hostCode, setHostCode] = useState(() => makeRoomCode());
  const [hostAlias, setHostAlias] = useState("Game Master");
  const [joinCode, setJoinCode] = useState(() =>
    typeof window === "undefined"
      ? ""
      : (new URLSearchParams(window.location.search).get("room") ?? "").replace(/\D/g, "").slice(0, 4),
  );
  const [joinAlias, setJoinAlias] = useState("");

  const dbReady = Boolean(readDbConfig().url && readDbConfig().anonKey);

  const handleHost = (e: FormEvent) => {
    e.preventDefault();
    if (hostCode.length !== 4) {
      toast.error("Use a 4-digit access code.");
      return;
    }
    if (!hostAlias.trim()) {
      toast.error("Enter a host alias.");
      return;
    }
    hostRoom(hostCode, hostAlias);
  };

  const handleJoin = (e: FormEvent) => {
    e.preventDefault();
    if (joinCode.length !== 4) {
      toast.error("Enter the 4-digit room ID.");
      return;
    }
    if (!joinAlias.trim()) {
      toast.error("Enter your detective alias.");
      return;
    }
    joinRoom(joinCode, joinAlias);
  };

  return (
    <Dialog open={!joined}>
      <DialogContent
        className="max-h-[90dvh] w-[calc(100vw-1.5rem)] overflow-y-auto border-gold-dim bg-surface sm:max-w-xl [&>button]:hidden"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-gold sm:text-3xl">
            <Radio className="h-6 w-6" /> Enter the Session
          </DialogTitle>
          <DialogDescription className="text-base">
            Host the projector screen or join from your phone with the room's 4-digit access code.
          </DialogDescription>
        </DialogHeader>

        {!dbReady && (
          <div className="rounded border border-gold-dim bg-surface-2 px-4 py-3 text-sm text-foreground/80">
            Live sync needs a linked database. You can still play offline on this device.
            <div className="mt-2">
              <DatabaseConfigDialog />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between rounded border border-border bg-surface-2 px-4 py-2 text-sm font-mono">
          <span className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${online ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
            <span className="text-muted-foreground uppercase tracking-wider text-xs">Connection Status</span>
          </span>
          <span className={online ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>
            {online ? "online" : "offline"}
          </span>
        </div>

        <Tabs defaultValue={joinCode ? "join" : "host"}>
          <TabsList className="w-full">
            <TabsTrigger value="host" className="flex-1">
              Host Room
            </TabsTrigger>
            <TabsTrigger value="join" className="flex-1">
              Join Room
            </TabsTrigger>
          </TabsList>

          <TabsContent value="host" className="pt-4">
            <form onSubmit={handleHost} className="space-y-4">
              <div>
                <label htmlFor="host-code" className="label-caps">Access code</label>
                <div className="flex gap-2">
                  <Input
                    id="host-code"
                    value={hostCode}
                    inputMode="numeric"
                    onChange={(e) => setHostCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    className="h-14 border-border bg-surface-2 text-center font-mono text-3xl tracking-[0.4em] text-gold"
                  />
                  <Button type="button" variant="outline" className="h-14" onClick={() => setHostCode(makeRoomCode())}>
                    Generate
                  </Button>
                </div>
              </div>
              <div>
                <label htmlFor="host-alias" className="label-caps">Host alias</label>
                <Input
                  id="host-alias"
                  value={hostAlias}
                  onChange={(e) => setHostAlias(e.target.value)}
                  className="h-12 border-border bg-surface-2 text-lg"
                />
              </div>
              <Button type="submit" size="lg" className="w-full">
                Open room {hostCode}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="join" className="pt-4">
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label htmlFor="join-code" className="label-caps">Room ID</label>
                <Input
                  id="join-code"
                  value={joinCode}
                  inputMode="numeric"
                  placeholder="0000"
                  onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className="h-14 border-border bg-surface-2 text-center font-mono text-3xl tracking-[0.4em] text-gold"
                />
              </div>
              <div>
                <label htmlFor="join-alias" className="label-caps">Detective alias</label>
                <Input
                  id="join-alias"
                  value={joinAlias}
                  placeholder="Detective Alex"
                  onChange={(e) => setJoinAlias(e.target.value)}
                  className="h-12 border-border bg-surface-2 text-lg"
                />
              </div>
              <Button type="submit" size="lg" className="w-full">
                Join as {joinAlias.trim() || "detective"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
