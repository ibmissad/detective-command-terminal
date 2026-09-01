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
import { Database, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { readDbConfig, writeDbConfig, getDb, SCHEMA_SQL } from "@/lib/db";

export function DatabaseConfigDialog() {
  const [open, setOpen] = useState(false);
  
  // Default to env vars if available, fallback to local storage
  const envUrl = import.meta.env.VITE_SUPABASE_URL || "";
  const envAnon = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

  const [url, setUrl] = useState("");
  const [anonKey, setAnonKey] = useState("");
  const [connected, setConnected] = useState(() => Boolean(envUrl || readDbConfig().url));
  const [testing, setTesting] = useState(false);

  const test = async () => {
    setTesting(true);
    try {
      const db = getDb();
      if (!db) throw new Error("Database client not initialized. Check URL and Key.");
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
          setUrl(cfg.url || envUrl);
          setAnonKey(cfg.anonKey || envAnon);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-gold-dim text-gold">
          <Database className="mr-1 h-4 w-4" />
          {connected ? "Database active" : "Database setup"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-border bg-surface sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-gold flex items-center gap-2">
            <Database className="h-5 w-5" /> Database Configuration
          </DialogTitle>
          <DialogDescription>
            {envUrl ? (
              <span className="flex items-center gap-1 text-success font-medium">
                <CheckCircle className="h-4 w-4" /> Pre-configured via Vercel Environment Variables.
              </span>
            ) : (
              "Connect your Supabase project to archive generated cases, interrogation logs, and club verdicts."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="label-caps">Project URL</label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xxxxx.supabase.co"
              className="mt-1 h-12 border-border bg-surface-2 font-mono"
            />
          </div>

          <div>
            <label className="label-caps">Anon / publishable key</label>
            <Input
              type="password"
              autoComplete="off"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJ… or sb_publishable_…"
              className="mt-1 h-12 border-border bg-surface-2 font-mono"
            />
          </div>

          <div className="flex flex-wrap justify-between gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                writeDbConfig({ url: "", anonKey: "" });
                setUrl(envUrl);
                setAnonKey(envAnon);
                setConnected(Boolean(envUrl));
                toast.success("Reset to default environment settings.");
              }}
            >
              Reset to Env Defaults
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

          <div className="pt-4">
            <div className="flex items-center justify-between">
              <span className="label-caps">Schema SQL Reference</span>
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
            <pre className="mt-2 max-h-48 overflow-auto rounded border border-border bg-surface-2 p-3 font-mono text-xs leading-relaxed text-foreground/80">
              {SCHEMA_SQL}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
