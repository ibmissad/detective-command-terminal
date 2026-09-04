import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface SessionContextType {
  sessionId: string | null;
  activeCaseId: string | null;
  setActiveCase: (caseId: string) => Promise<void>;
  isHost: boolean;
}

const SessionContext = createContext<SessionContextType>({
  sessionId: null,
  activeCaseId: null,
  setActiveCase: async () => {},
  isHost: false,
});

export const SessionProvider: React.FC<{
  sessionId: string;
  isHost: boolean;
  children: React.ReactNode;
}> = ({ sessionId, isHost, children }) => {
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    // Fetch initial active case
    const fetchSession = async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select("active_case_id")
        .eq("id", sessionId)
        .single();

      if (data && !error) {
        setActiveCaseId(data["active_case_id"]);
      }
    };

    void fetchSession();

    // Subscribe to Postgres Real-Time changes on this session row
    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const newCaseId = payload.new["active_case_id"];
          if (newCaseId && newCaseId !== activeCaseId) {
            setActiveCaseId(newCaseId);
            toast.info("Active case updated by Host.");
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [sessionId, activeCaseId]);

  const setActiveCase = async (caseId: string) => {
    setActiveCaseId(caseId);
    const { error } = await supabase
      .from("sessions")
      .update({ active_case_id: caseId })
      .eq("id", sessionId);

    if (error) {
      toast.error("Failed to sync case across devices.");
    } else {
      toast.success("New case broadcasted to all detectives.");
    }
  };

  return (
    <SessionContext.Provider value={{ sessionId, activeCaseId, setActiveCase, isHost }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
