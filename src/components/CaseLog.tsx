import { useCase } from "@/lib/case-store";
import { ScrollText } from "lucide-react";

export function CaseLog({ className = "" }: { className?: string }) {
  const { log, clearLog } = useCase();

  return (
    <aside className={`panel flex min-h-0 flex-col rounded-md ${className}`}>
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-gold" />
          <span className="label-caps">Global Case Log</span>
        </div>
        <button
          onClick={clearLog}
          className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground transition-colors hover:text-destructive"
        >
          Clear
        </button>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {log.length === 0 ? (
          <p className="font-mono text-sm text-muted-foreground">
            No entries. Unlock scene hotspots or interrogate suspects to populate the log.
          </p>
        ) : (
          log.map((e) => (
            <div key={e.id} className="border-l-2 border-gold-dim pl-3">
              <div className="font-mono text-[0.65rem] uppercase tracking-widest text-gold-dim">
                {new Date(e.ts).toLocaleTimeString()} · {e.source}
              </div>
              <p className="mt-1 text-[0.95rem] leading-relaxed text-foreground/90">{e.text}</p>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
