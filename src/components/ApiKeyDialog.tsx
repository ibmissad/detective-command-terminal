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
import { KeyRound } from "lucide-react";
import { toast } from "sonner";

export function ApiKeyDialog() {
  const { apiKey, setApiKey } = useCase();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setDraft(apiKey);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-gold-dim text-gold">
          <KeyRound className="mr-1 h-4 w-4" />
          {apiKey ? "Key set" : "Set API key"}
        </Button>
      </DialogTrigger>
      <DialogContent className="border-border bg-surface">
        <DialogHeader>
          <DialogTitle className="text-gold">Gemini API Key</DialogTitle>
          <DialogDescription>
            Stored only in this browser's local storage, never uploaded or shared. Clear it after
            the meeting if the machine is shared. Get a key from Google AI Studio.
          </DialogDescription>
        </DialogHeader>
        <Input
          type="password"
          autoComplete="off"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="AIza…"
          className="h-12 border-border bg-surface-2 font-mono"
        />
        <div className="flex justify-between gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              setApiKey("");
              setDraft("");
              toast.success("Key cleared from this device.");
            }}
          >
            Clear key
          </Button>
          <Button
            onClick={() => {
              setApiKey(draft.trim());
              setOpen(false);
              toast.success("Key saved locally.");
            }}
          >
            Save key
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
