import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle, Search, MessagesSquare, Gavel, Users } from "lucide-react";

const STEPS = [
  {
    icon: Users,
    title: "1. Join the room",
    body: "Get the 4-digit room code from whoever is hosting. Enter it, pick a detective alias, and you're in — everyone sees the same live case at once.",
  },
  {
    icon: Search,
    title: "2. Examine the scene",
    body: "Open the Case Briefing tab. Tap the glowing markers on the scene image to investigate — most are locked behind a quick puzzle. Solve it to unlock the lead.",
  },
  {
    icon: MessagesSquare,
    title: "3. Interrogate suspects",
    body: "Head to the Interrogation tab, pick a suspect, and ask questions in plain English. They'll answer in character — press them on anything that contradicts the evidence you've found.",
  },
  {
    icon: Gavel,
    title: "4. Submit your verdict",
    body: "Once you're confident, go to the Verdict tab and name the culprit. Getting the motive and weapon right too earns bonus credit, but the culprit alone is what solves the case.",
  },
];

export function HowToPlay({ trigger }: { trigger?: "button" | "icon" }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger === "icon" ? (
          <Button variant="ghost" size="sm" className="min-h-9 min-w-9 px-0" aria-label="How to play">
            <HelpCircle className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="border-gold-dim text-gold">
            <HelpCircle className="mr-1.5 h-4 w-4" /> How to play
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] w-[calc(100vw-1.5rem)] overflow-y-auto border-gold-dim bg-surface sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl text-gold">How to Play</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {STEPS.map((s) => (
            <div key={s.title} className="flex gap-3">
              <s.icon className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
              <div>
                <h3 className="text-lg text-gold">{s.title}</h3>
                <p className="mt-1 text-base leading-relaxed text-foreground/85">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
        <Button className="mt-2 w-full" onClick={() => setOpen(false)}>
          Got it — let's investigate
        </Button>
      </DialogContent>
    </Dialog>
  );
}
