import { useState } from "react";
import { useCase } from "@/lib/case-store";
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
import { KeyRound, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export function ApiKeyDialog() {
  const { apiKey, setApiKey } = useCase();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  const envKey = import.meta.env.VITE_OPENROUTER_API_KEY || "";
  const isEnvActive = !apiKey && Boolean(envKey);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setDraft(apiKey || envKey);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-gold-dim text-gold">
          <KeyRound className="mr-1 h-4 w-4" />
          {apiKey ? "Custom Key Set" : isEnvActive ? "Key Active (Env)" : "Set API Key"}
        </Button>
      </DialogTrigger>
      <DialogContent className="border-border bg-surface">
        <DialogHeader>
          <DialogTitle className="text-gold flex items-center gap-2">
            <KeyRound className="h-5 w-5" /> Gemini API Key
          </DialogTitle>
          <DialogDescription>
            {isEnvActive ? (
              <span className="flex items-center gap-1 text-success font-medium">
                <CheckCircle className="h-4 w-4" /> Active key loaded from environment variables.
              </span>
            ) : (
              "Stored locally in your browser. Get your free key from Google AI Studio."
            )}
          </DialogDescription>
        </DialogHeader>

        <Input
          type="password"
          autoComplete="off"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="AIza…"
          className="h-12 border-border bg-surface-2 font-mono text-base"
        />

        <div className="flex justify-between gap-2 pt-2">
          <Button
            variant="ghost"
            onClick={() => {
              setApiKey("");
              setDraft(envKey);
              toast.success("Reset to default environment key.");
            }}
          >
            Reset to Env
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setApiKey("");
                setDraft("");
                toast.success("Key cleared.");
              }}
            >
              Clear
            </Button>
            <Button
              onClick={() => {
                setApiKey(draft.trim());
                setOpen(false);
                toast.success("Custom key saved locally.");
              }}
            >
              Save Key
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
