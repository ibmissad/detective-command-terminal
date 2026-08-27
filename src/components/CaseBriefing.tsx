import { useState } from "react";
import { useCase } from "@/lib/case-store";
import { CaseLog } from "./CaseLog";
import sceneMain from "@/assets/scene-main.jpg";
import evidence1 from "@/assets/evidence-1.jpg";
import evidence2 from "@/assets/evidence-2.jpg";
import evidence3 from "@/assets/evidence-3.jpg";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Lock, Unlock } from "lucide-react";

const GALLERY = [
  { src: evidence1, title: "Exhibit A — Case glass fragment", note: "Latent print, unmatched." },
  { src: evidence2, title: "Exhibit B — Partial burned note", note: "Recovered from the grate." },
  { src: evidence3, title: "Exhibit C — Impression cast", note: "Garden path, east side." },
];

export function CaseBriefing() {
  const { caseFile, unlocked, unlock, addLog } = useCase();
  const [active, setActive] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<(typeof GALLERY)[number] | null>(null);

  const activeSpot = caseFile.hotspots.find((h) => h.id === active) ?? null;

  const openSpot = (id: string) => {
    const spot = caseFile.hotspots.find((h) => h.id === id);
    if (!spot) return;
    setActive(id);
    if (!unlocked.includes(id)) {
      unlock(id);
      addLog(`Hotspot · ${spot.label}`, spot.detail);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0 space-y-6">
        <section className="panel rounded-md p-6">
          <span className="label-caps">Master Case File</span>
          <h2 className="mt-2 text-3xl font-semibold text-gold">{caseFile.title}</h2>
          <div className="gold-rule my-4" />
          <p className="text-lg leading-relaxed text-foreground/90">{caseFile.overview}</p>
        </section>

        <section className="panel overflow-hidden rounded-md">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <span className="label-caps">Scene Survey — {unlocked.length}/{caseFile.hotspots.length} points examined</span>
            <span className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
              Click a marker
            </span>
          </div>
          <div className="relative">
            <img
              src={sceneMain}
              alt="Crime scene overview of the study at Blackwood House"
              width={1536}
              height={1024}
              className="w-full"
            />
            {caseFile.hotspots.map((h) => {
              const found = unlocked.includes(h.id);
              return (
                <button
                  key={h.id}
                  onClick={() => openSpot(h.id)}
                  aria-label={`Examine ${h.label}`}
                  style={{ left: `${h.x}%`, top: `${h.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 p-2 backdrop-blur-sm transition-transform hover:scale-125 ${
                    found
                      ? "border-gold bg-gold/25 text-gold"
                      : "hotspot-pulse border-gold bg-background/70 text-gold"
                  }`}
                >
                  {found ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
          {activeSpot && (
            <div className="border-t border-gold-dim bg-surface-2 px-5 py-4">
              <span className="label-caps">{activeSpot.label}</span>
              <p className="mt-2 text-lg leading-relaxed">{activeSpot.detail}</p>
            </div>
          )}
        </section>

        <section className="panel rounded-md p-6">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gold" />
            <span className="label-caps">Initial Police Report</span>
          </div>
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap font-mono text-base leading-relaxed text-foreground/85">
            {caseFile.policeReport}
          </pre>
        </section>

        <section>
          <span className="label-caps">Evidence Gallery</span>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            {GALLERY.map((g) => (
              <button
                key={g.title}
                onClick={() => setLightbox(g)}
                className="panel group overflow-hidden rounded-md text-left"
              >
                <img
                  src={g.src}
                  alt={g.title}
                  loading="lazy"
                  width={1024}
                  height={768}
                  className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="px-4 py-3">
                  <p className="font-mono text-sm text-gold">{g.title}</p>
                  <p className="text-sm text-muted-foreground">{g.note}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {caseFile.clues.length > 0 && (
          <section className="panel rounded-md p-6">
            <span className="label-caps">Physical Evidence Transcripts</span>
            <div className="mt-4 space-y-4">
              {caseFile.clues.map((c) => (
                <div key={c.id} className="border-l-2 border-gold-dim pl-4">
                  <h3 className="text-xl text-gold">{c.title}</h3>
                  <p className="mt-1 text-lg leading-relaxed text-foreground/85">{c.detail}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <CaseLog className="h-[42rem] xl:sticky xl:top-6" />

      <Dialog open={!!lightbox} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent className="max-w-4xl border-border bg-surface">
          <DialogHeader>
            <DialogTitle className="text-gold">{lightbox?.title}</DialogTitle>
          </DialogHeader>
          {lightbox && (
            <img src={lightbox.src} alt={lightbox.title} width={1024} height={768} className="w-full rounded" />
          )}
          <p className="text-muted-foreground">{lightbox?.note}</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
