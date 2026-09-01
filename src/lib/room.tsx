import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getDb } from "./db";
import { isHostUnlocked } from "./host-gate";
import type { CaseFile, ChatMessage, LogEntry, Verdict } from "./case-types";

const KEY_ROOM = "scc.room";
const KEY_ALIAS = "scc.alias";
const KEY_HOST = "scc.host";

export type RoomEvent =
  | { type: "chat"; suspectId: string; message: ChatMessage }
  | { type: "hotspot"; id: string; label: string; detail: string; by: string }
  | { type: "log"; entry: LogEntry }
  | { type: "case"; caseFile: CaseFile }
  | { type: "verdict"; verdict: Verdict | null }
  | { type: "sync-request"; by: string }
  | { type: "sync-state"; caseFile: CaseFile; log: LogEntry[]; unlocked: string[] };

type Member = { alias: string; host: boolean };

type RoomCtx = {
  roomId: string;
  alias: string;
  isHost: boolean;
  hostUnlocked: boolean;
  setHostUnlocked: (v: boolean) => void;
  joined: boolean;
  online: boolean;
  members: Member[];
  hostRoom: (code: string, alias: string) => void;
  joinRoom: (code: string, alias: string) => void;
  leaveRoom: () => void;
  publish: (event: RoomEvent) => void;
  on: (handler: (event: RoomEvent) => void) => () => void;
};

const Ctx = createContext<RoomCtx | null>(null);

export function makeRoomCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function RoomProvider({ children }: { children: ReactNode }) {
  const [roomId, setRoomId] = useState("");
  const [alias, setAlias] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [hostUnlocked, setHostUnlocked] = useState(false);
  const [online, setOnline] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const handlers = useRef(new Set<(e: RoomEvent) => void>());
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRoom = params.get("room")?.replace(/\D/g, "").slice(0, 4) ?? "";
    setRoomId(urlRoom || window.localStorage.getItem(KEY_ROOM) || "");
    setAlias(window.localStorage.getItem(KEY_ALIAS) || "");
    setIsHost(window.localStorage.getItem(KEY_HOST) === "1" && !urlRoom);
    setHostUnlocked(isHostUnlocked());
  }, []);

  const dispatch = useCallback((event: RoomEvent) => {
    handlers.current.forEach((h) => h(event));
  }, []);

  useEffect(() => {
    if (!roomId || !alias) return;
    const db = getDb();
    if (!db) {
      setOnline(false);
      return;
    }

    const channel = db.channel(`scc-room-${roomId}`, {
      config: { broadcast: { self: false }, presence: { key: alias } },
    });

    channel
      .on("broadcast", { event: "scc" }, ({ payload }) => dispatch(payload as RoomEvent))
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ alias: string; host: boolean }>();
        const activeMembers = Object.values(state)
          .flat()
          .map((p) => ({ alias: p.alias, host: p.host }));
        
        setMembers(activeMembers);
        setOnline(activeMembers.length > 0);
      })
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "interrogation_logs", filter: `room_code=eq.${roomId}` },
        () => {
          /* rows are mirrored live via broadcast; this keeps the DB stream subscribed */
        },
      )
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "cases" }, () => {
        /* archived cases stream */
      })
      .subscribe(async (status) => {
        const ok = status === "SUBSCRIBED";
        setOnline(ok);
        if (ok) {
          await channel.track({ alias, host: isHost });
          if (!isHost) dispatch({ type: "sync-request", by: alias });
        }
      });

    channelRef.current = channel;
    return () => {
      channelRef.current = null;
      setOnline(false);
      setMembers([]);
      void db.removeChannel(channel);
    };
  }, [roomId, alias, isHost, dispatch]);

  const publish = useCallback((event: RoomEvent) => {
    void channelRef.current?.send({ type: "broadcast", event: "scc", payload: event });
  }, []);

  const enter = useCallback((code: string, name: string, host: boolean) => {
    const clean = code.replace(/\D/g, "").slice(0, 4);
    window.localStorage.setItem(KEY_ROOM, clean);
    window.localStorage.setItem(KEY_ALIAS, name.trim());
    window.localStorage.setItem(KEY_HOST, host ? "1" : "0");
    setRoomId(clean);
    setAlias(name.trim());
    setIsHost(host);
  }, []);

  const value = useMemo<RoomCtx>(
    () => ({
      roomId,
      alias,
      isHost,
      hostUnlocked,
      setHostUnlocked,
      joined: Boolean(roomId && alias),
      online,
      members,
      hostRoom: (code, name) => enter(code, name, true),
      joinRoom: (code, name) => enter(code, name, false),
      leaveRoom: () => {
        window.localStorage.removeItem(KEY_ROOM);
        window.localStorage.removeItem(KEY_HOST);
        setRoomId("");
        setIsHost(false);
      },
      publish,
      on: (handler) => {
        handlers.current.add(handler);
        return () => handlers.current.delete(handler);
      },
    }),
    [roomId, alias, isHost, hostUnlocked, online, members, enter, publish],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRoom() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRoom must be used within RoomProvider");
  return ctx;
}
