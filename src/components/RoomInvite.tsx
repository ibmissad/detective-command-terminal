import { useEffect, useState } from "react";
import { useRoom } from "@/lib/room";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link2, Users } from "lucide-react";

export function RoomInvite() {
  const { roomId, members, online } = useRoom();
  const [origin, setOrigin] = useState("");

  useEffect(() => setOrigin(window.location.origin), []);
  const link = origin ? `${origin}/?room=${roomId}` : "";

  return (
    <section className="panel rounded-md p-6">
      <span className="label-caps">Live Session</span>
      <div className="mt-3 flex flex-wrap items-center gap-6">
        <div>
          <span className="label-caps">Access code</span>
          <p className="font-mono text-5xl tracking-[0.3em] text-gold">{roomId || "----"}</p>
        </div>
        <div className="min-w-0">
          <span className="label-caps">Members join at</span>
          <p className="truncate font-mono text-lg text-foreground/85">{link || "—"}</p>
        </div>
        <Button
          variant="outline"
          className="border-gold-dim text-gold"
          onClick={() => {
            void navigator.clipboard.writeText(link);
            toast.success("Join link copied.");
          }}
        >
          <Link2 className="mr-2 h-4 w-4" /> Copy join link
        </Button>
        <div className="ml-auto flex items-center gap-2 font-mono text-base">
          <Users className="h-5 w-5 text-gold" />
          {members.length || 1} connected
          <span className={online ? "text-success" : "text-muted-foreground"}>
            · {online ? "sync live" : "offline"}
          </span>
        </div>
      </div>
      {!online && (
        <p className="mt-3 text-sm text-muted-foreground">
          Link a database in the interrogation panel to turn on real-time sync between devices.
        </p>
      )}
    </section>
  );
}
