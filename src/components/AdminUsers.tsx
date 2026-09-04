import { useCallback, useEffect, useState } from "react";
import { listUsers, setUserStatus, type ClubUser } from "@/lib/auth";
import { readDbConfig } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { UserCheck, UserX, Users } from "lucide-react";

export function AdminUsers() {
  const [users, setUsers] = useState<ClubUser[]>([]);
  const [loading, setLoading] = useState(false);
  const dbReady = Boolean(readDbConfig().url && readDbConfig().anonKey);

  const load = useCallback(() => {
    if (!dbReady) return;
    setLoading(true);
    listUsers()
      .then(setUsers)
      .catch((e: Error) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [dbReady]);

  useEffect(() => {
    load();
  }, [load]);

  const decide = (u: ClubUser, status: ClubUser["status"]) => {
    void setUserStatus(u.id, status)
      .then(() => {
        toast.success(`${u.username} ${status}.`);
        setUsers((p) => p.map((x) => (x.id === u.id ? { ...x, status } : x)));
      })
      .catch((e: Error) => toast.error(e.message));
  };

  if (!dbReady) {
    return (
      <section className="panel rounded-md p-8 text-center text-base text-muted-foreground">
        Connect the club database to manage member accounts.
      </section>
    );
  }

  const pending = users.filter((u) => u.status === "pending");
  const rest = users.filter((u) => u.status !== "pending");

  return (
    <section className="panel rounded-md p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <span className="label-caps flex items-center gap-2">
          <Users className="h-4 w-4 text-gold" /> Admin · User management
        </span>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </Button>
      </div>

      <h3 className="mt-4 text-xl text-gold">Pending approval ({pending.length})</h3>
      <ul className="mt-2 space-y-2">
        {pending.length === 0 && <li className="text-base text-muted-foreground">No sign-ups waiting.</li>}
        {pending.map((u) => (
          <li
            key={u.id}
            className="flex flex-wrap items-center gap-3 rounded border border-gold-dim bg-surface-2 px-4 py-3"
          >
            <span className="text-lg text-foreground">{u.username}</span>
            <span className="font-mono text-sm text-muted-foreground">{u.email || "no email"}</span>
            <div className="ml-auto flex gap-2">
              <Button size="sm" onClick={() => decide(u, "approved")}>
                <UserCheck className="mr-1 h-4 w-4" /> Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => decide(u, "rejected")}>
                <UserX className="mr-1 h-4 w-4" /> Reject
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <div className="gold-rule my-5" />
      <h3 className="text-xl text-gold">Club roster</h3>
      <ul className="mt-2 space-y-1">
        {rest.map((u) => (
          <li key={u.id} className="flex items-center gap-3 font-mono text-base">
            <span className={u.status === "approved" ? "text-success" : "text-destructive"}>
              {u.status === "approved" ? "✓" : "✕"}
            </span>
            <span className="text-foreground/90">{u.username}</span>
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto"
              onClick={() => decide(u, u.status === "approved" ? "rejected" : "approved")}
            >
              {u.status === "approved" ? "Revoke" : "Approve"}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
