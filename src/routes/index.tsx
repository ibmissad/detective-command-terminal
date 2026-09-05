import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CaseProvider } from "@/lib/case-store";
import { RoomProvider } from "@/lib/room";
import { RoomGate } from "@/components/RoomGate";
import { CommandHeader } from "@/components/CommandHeader";
import { CaseBriefing } from "@/components/CaseBriefing";
import { InterrogationTerminal } from "@/components/InterrogationTerminal";
import { GameMasterConsole } from "@/components/GameMasterConsole";
import { VerdictConsole } from "@/components/VerdictConsole";
import { CaseArchives } from "@/components/CaseArchives";
import { PresenceBar } from "@/components/PresenceBar";
import { HostGate } from "@/components/HostGate";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sherlock Command Center — Live Detective Club Console" },
      {
        name: "description",
        content:
          "A projector-ready noir command center for detective clubs: case briefings, interactive scene hotspots, AI suspect interrogations, and a verdict reveal.",
      },
      { property: "og:title", content: "Sherlock Command Center" },
      {
        property: "og:description",
        content:
          "Run live detective club meetings: case files, scene hotspots, AI interrogations, and instant verdict post-mortems.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const TABS = [
  { value: "briefing", label: "Case Briefing" },
  { value: "interrogation", label: "Interrogation" },
  { value: "verdict", label: "Verdict" },
  { value: "archives", label: "Case Archives" },
  { value: "gm", label: "Game Master" },
];

function Index() {
  return (
    <RoomProvider>
      <CaseProvider>
      <TimerProvider>
      <RoomGate />
      <div className="min-h-screen">
        <CommandHeader />
        <main className="mx-auto max-w-[110rem] px-3 py-5 sm:px-6 sm:py-8">
          <PresenceBar />
          <Tabs defaultValue="briefing" className="mt-4 sm:mt-6">
            <div className="-mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0">
              <TabsList className="h-auto w-max min-w-full justify-start gap-1 bg-transparent p-0 sm:gap-2">
                {TABS.map((t) => (
                  <TabsTrigger
                    key={t.value}
                    value={t.value}
                    className="min-h-11 shrink-0 rounded-none border-b-2 border-transparent px-3 py-3 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground data-[state=active]:border-gold data-[state=active]:bg-transparent data-[state=active]:text-gold data-[state=active]:shadow-none sm:px-6 sm:text-sm sm:tracking-[0.18em]"
                  >
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <div className="mt-5 sm:mt-8">
              <TabsContent value="briefing">
                <CaseBriefing />
              </TabsContent>
              <TabsContent value="interrogation">
                <InterrogationTerminal />
              </TabsContent>
              <TabsContent value="verdict">
                <VerdictConsole />
              </TabsContent>
              <TabsContent value="archives">
                <CaseArchives />
              </TabsContent>
              <TabsContent value="gm">
                <HostGate>
                  <GameMasterConsole />
                </HostGate>
              </TabsContent>
            </div>
          </Tabs>
        </main>
      </div>
      </TimerProvider>
      </CaseProvider>
    </RoomProvider>
  );
}
