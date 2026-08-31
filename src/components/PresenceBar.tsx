import { useRoom } from "@/lib/room";
import { Users, Crown } from "lucide-react";

export function PresenceBar() {
  const { members, alias, isHost, online } = useRoom();
  const list = members.length ? members : [{ alias: alias || "You", host: isHost }];

  return (
    <div className="panel flex flex-wrap items-center gap-3 rounded-md px-5 py-3">
      <span className="label-caps flex items-center gap-2">
        <Users className="h-4 w-4 text-gold" /> Live detectives online
      </span>
      <span className="font-mono text-sm text-muted-foreground">
        {online ? "sync live" : "offline"}
      </span>
      <div className="flex flex-wrap gap-2">
        {list.map((m, i) => (
          <span
            key={`${m.alias}-${i}`}
            className="flex items-center gap-1 rounded-full border border-gold-dim bg-surface-2 px-3 py-1 font-mono text-sm text-foreground/90"
          >
            <span className="h-2 w-2 rounded-full bg-success" />
            {m.host && <Crown className="h-3 w-3 text-gold" />}
            {m.alias}
          </span>
        ))}
      </div>
    </div>
  );
}
