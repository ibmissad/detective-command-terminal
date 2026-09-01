import { useState, type FormEvent, type ReactNode } from "react";
import { useRoom } from "@/lib/room";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldAlert, ShieldCheck, Lock } from "lucide-react";
import { DEFAULT_HOST_PASSCODE, lockHost, setHostPasscode, tryUnlockHost } from "@/lib/host-gate";
import { toast } from "sonner";

/** Wraps host-only surfaces (Game Master console, solution files). */
export function HostGate({ children }: { children: ReactNode }) {
  const { isHost, hostUnlocked, setHostUnlocked } = useRoom();
  const [code, setCode] = useState("");
  const [newCode, setNewCode] = useState("");

  const handleUnlock = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (tryUnlockHost(code)) {
      setHostUnlocked(true);
      toast.success("Host console unlocked.");
    } else {
      toast.error("Incorrect passcode.");
    }
  };

  const handleChangePasscode = () => {
    if (!newCode.trim()) {
      toast.error("Enter a new passcode.");
      return;
    }
    setHostPasscode(newCode);
    setNewCode("");
    toast.success("Host passcode updated.");
  };

  if (!isHost) {
    return (
      <section className="panel rounded-md p-10 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
        <h2 className="mt-4 text-2xl text-gold">Restricted — Game Master only</h2>
        <p className="mx-auto mt-2 max-w-lg text-base text-muted-foreground">
          This console holds the sealed solution and case-forge controls. Detectives joining from a
          phone cannot open it.
        </p>
      </section>
    );
  }

  if (!hostUnlocked) {
    return (
      <section className="panel mx-auto max-w-md rounded-md p-8 text-center">
        <Lock className="mx-auto h-10 w-10 text-gold" />
        <h2 className="mt-4 text-2xl text-gold">Host passcode</h2>
        <p className="mt-2 text-base text-muted-foreground">
          Enter the host passcode to unlock the Game Master console. Default: {DEFAULT_HOST_PASSCODE}
        </p>
        <form onSubmit={handleUnlock} className="mt-6 space-y-4">
          <Input
            type="password"
            value={code}
            inputMode="numeric"
            onChange={(e) => setCode(e.target.value)}
            className="mx-auto h-14 max-w-[16rem] border-border bg-surface-2 text-center font-mono text-3xl tracking-[0.4em] text-gold"
          />
          <Button type="submit" size="lg" className="w-full max-w-[16rem]">
            Unlock console
          </Button>
        </form>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 rounded border border-gold-dim bg-surface-2 px-4 py-3">
        <ShieldCheck className="h-5 w-5 text-success" />
        <span className="font-mono text-sm uppercase tracking-widest text-gold">Host console unlocked</span>
        <Input
          value={newCode}
          placeholder="New passcode"
          onChange={(e) => setNewCode(e.target.value)}
          className="h-9 w-44 border-border bg-surface font-mono"
        />
        <Button variant="outline" size="sm" onClick={handleChangePasscode}>
          Change passcode
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={() => {
            lockHost();
            setHostUnlocked(false);
          }}
        >
          Lock console
        </Button>
      </div>
      {children}
    </div>
  );
}
