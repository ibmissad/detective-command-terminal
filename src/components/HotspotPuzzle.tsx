import { useState } from "react";
import type { Hotspot } from "@/lib/case-types";
import { puzzleFor, type Puzzle } from "@/lib/puzzles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Fingerprint, Clock, KeySquare } from "lucide-react";

const ICONS: Record<Puzzle["kind"], typeof Fingerprint> = {
  cipher: KeySquare,
  fingerprint: Fingerprint,
  timeline: Clock,
};

export function HotspotPuzzle({
  spot,
  index,
  open,
  onOpenChange,
  onSolved,
}: {
  spot: Hotspot | null;
  index: number;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSolved: () => void;
}) {
  const [guess, setGuess] = useState("");
  const [wrong, setWrong] = useState(false);

  if (!spot) return null;
  const puzzle = puzzleFor(spot, index);
  const Icon = ICONS[puzzle.kind];

  const submit = (value: string) => {
    if (value.trim().toUpperCase() === puzzle.answer.toUpperCase()) {
      setGuess("");
      setWrong(false);
      onSolved();
      onOpenChange(false);
    } else {
      setWrong(true);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        setGuess("");
        setWrong(false);
      }}
    >
      <DialogContent className="border-gold-dim bg-surface sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-gold">
            <Icon className="h-6 w-6" /> {spot.label}
          </DialogTitle>
          <DialogDescription className="text-base">{puzzle.prompt}</DialogDescription>
        </DialogHeader>

        {puzzle.kind === "cipher" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(guess);
            }}
            className="space-y-4"
          >
            <div className="rounded border border-gold-dim bg-surface-2 p-5 text-center">
              <p className="label-caps">Encrypted tag · Caesar shift +{puzzle.shift}</p>
              <p className="mt-2 font-mono text-4xl tracking-[0.3em] text-gold">{puzzle.scrambled}</p>
            </div>
            <Input
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Decoded word"
              className="h-12 border-border bg-surface-2 text-center font-mono text-xl uppercase tracking-widest"
            />
            <Button type="submit" className="w-full" size="lg">
              Decrypt
            </Button>
          </form>
        )}

        {puzzle.kind === "fingerprint" && (
          <div className="space-y-4">
            <div className="rounded border border-gold-dim bg-surface-2 p-5 text-center">
              <p className="label-caps">Reference card</p>
              <p className="mt-2 font-mono text-3xl tracking-[0.2em] text-gold">{puzzle.target}</p>
            </div>
            <div className="grid gap-2">
              {puzzle.options.map((o) => (
                <Button key={o} variant="outline" size="lg" className="font-mono" onClick={() => submit(o)}>
                  {o}
                </Button>
              ))}
            </div>
          </div>
        )}

        {puzzle.kind === "timeline" && (
          <div className="grid gap-2">
            {puzzle.options.map((o) => (
              <Button key={o} variant="outline" size="lg" className="font-mono text-2xl" onClick={() => submit(o)}>
                {o}
              </Button>
            ))}
          </div>
        )}

        {wrong && <p className="text-center text-base text-destructive">No match. Examine the scene again.</p>}
      </DialogContent>
    </Dialog>
  );
}
