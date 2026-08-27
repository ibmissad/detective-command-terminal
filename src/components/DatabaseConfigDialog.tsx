import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Database } from "lucide-react";
import { toast } from "sonner";
import { readDbConfig, writeDbConfig, getDb, SCHEMA_SQL } from "@/lib/db";

export function DatabaseConfigDialog() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [anonKey, setAnonKey] = useState("");
  const [connected, setConnected] = useState(() => Boolean(readDbConfig().url && readDbConfig().anonKey));
  const [testing, setTesting] = useState(false);

  const test = async () => {
    setTesting(true);
    try {
      const db = getDb();
      if (!db) throw new Error("Save the URL and key first.");
      const { error } = await db.from("cases").select("id").limit(1);
      if (error) throw new Error(error.message);
      toast.success("Connection OK — tables reachable.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Connection failed.");
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          const cfg = readDbConfig();
          setUrl(cfg.url);
          setAnonKey(cfg.anonKey);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-gold-dim text-gold">
          <Database className="mr-1 h-4 w-4" />
          {connected ? "Database linked" : "Database setup"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-border bg-surface sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-gold">Database Configuration</DialogTitle>
          <DialogDescription>
            Connect your own Supabase project to archive generated cases, interrogation logs, and
            club verdicts. Credentials stay in this browser's local storage.
          </DialogDescription>
        </DialogHeader>

        <label className="label-caps">Project URL</label>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://xxxxx.supabase.co"
          className="h-12 border-border bg-surface-2 font-mono"
        />
        <label className="label-caps">Anon / publishable key</label>
        <Input
          type="password"
          autoComplete="off"
          value={anonKey}
          onChange={(e) => setAnonKey(e.target.value)}
          placeholder="eyJ… or sb_publishable_…"
          className="h-12 border-border bg-surface-2 font-mono"
        />

        <div className="flex flex-wrap justify-between gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              writeDbConfig({ url: "", anonKey: "" });
              setUrl("");
              setAnonKey("");
              setConnected(false);
              toast.success("Database settings cleared.");
            }}
          >
            Clear
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={test} disabled={testing}>
              {testing ? "Testing…" : "Test connection"}
            </Button>
            <Button
              onClick={() => {
                writeDbConfig({ url, anonKey });
                setConnected(Boolean(url.trim() && anonKey.trim()));
                toast.success("Database settings saved.");
              }}
            >
              Save
            </Button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className="label-caps">Run this SQL once in your Supabase SQL editor</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                void navigator.clipboard.writeText(SCHEMA_SQL);
                toast.success("Schema SQL copied.");
              }}
            >
              Copy SQL
            </Button>
          </div>
          <pre className="mt-2 max-h-64 overflow-auto rounded border border-border bg-surface-2 p-3 font-mono text-xs leading-relaxed text-foreground/80">
            {SCHEMA_SQL}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}
