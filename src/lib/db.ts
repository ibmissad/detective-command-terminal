import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { CaseFile, ChatMessage, LogEntry, Verdict } from "./case-types";

const KEY_URL = "scc.db.url";
const KEY_ANON = "scc.db.anon";

export type DbConfig = { url: string; anonKey: string };

export function readDbConfig(): DbConfig {
  if (typeof window === "undefined") return { url: "", anonKey: "" };
  return {
    url: window.localStorage.getItem(KEY_URL) ?? "",
    anonKey: window.localStorage.getItem(KEY_ANON) ?? "",
  };
}

export function writeDbConfig(cfg: DbConfig) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY_URL, cfg.url.trim().replace(/\/$/, ""));
  window.localStorage.setItem(KEY_ANON, cfg.anonKey.trim());
  cached = null;
}

let cached: { key: string; client: SupabaseClient } | null = null;

export function getDb(): SupabaseClient | null {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";
  const envAnon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? "";
  const local = readDbConfig();

  const url = (local.url || envUrl).trim().replace(/\/$/, "");
  const anonKey = (local.anonKey || envAnon).trim();

  if (!url || !anonKey) return null;

  const key = `${url}|${anonKey}`;
  if (cached?.key === key) return cached.client;
  const client = createClient(url, anonKey, { auth: { persistSession: false } });
  cached = { key, client };
  return client;
}

export const SCHEMA_SQL = `create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  room_code text,
  title text not null,
  briefing text not null,
  police_report text,
  evidence jsonb not null default '[]'::jsonb,
  hotspots jsonb not null default '[]'::jsonb,
  suspects jsonb not null default '[]'::jsonb,
  solution jsonb not null
);

create table if not exists public.interrogation_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  room_code text,
  detective_alias text,
  case_title text not null,
  suspect_name text not null,
  question text not null,
  answer text not null
);

create table if not exists public.verdicts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  room_code text,
  case_title text not null,
  culprit text not null,
  motive text,
  weapon text,
  key_evidence text,
  cracked boolean not null default false
);

-- Club member accounts, gated by host approval
create table if not exists public.club_users (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  username text not null unique,
  email text,
  password_hash text not null,
  status text not null default 'pending'
);

-- Saved / resumable room sessions
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  room_code text not null,
  case_title text not null,
  state jsonb not null,
  solved boolean not null default false
);
create unique index if not exists sessions_room_case_idx on public.sessions (room_code, case_title);

grant select, insert on public.cases, public.interrogation_logs, public.verdicts to anon, authenticated;
grant select, insert, update on public.club_users, public.sessions to anon, authenticated;
grant delete on public.club_users to anon, authenticated;

alter table public.cases enable row level security;
alter table public.interrogation_logs enable row level security;
alter table public.verdicts enable row level security;
alter table public.club_users enable row level security;
alter table public.sessions enable row level security;

create policy "club read cases" on public.cases for select to anon, authenticated using (true);
create policy "club write cases" on public.cases for insert to anon, authenticated with check (true);
create policy "club read logs" on public.interrogation_logs for select to anon, authenticated using (true);
create policy "club write logs" on public.interrogation_logs for insert to anon, authenticated with check (true);
create policy "club read verdicts" on public.verdicts for select to anon, authenticated using (true);
create policy "club write verdicts" on public.verdicts for insert to anon, authenticated with check (true);
create policy "club read users" on public.club_users for select to anon, authenticated using (true);
create policy "club write users" on public.club_users for insert to anon, authenticated with check (true);
create policy "club update users" on public.club_users for update to anon, authenticated using (true) with check (true);
create policy "club delete users" on public.club_users for delete to anon, authenticated using (true);
create policy "club read sessions" on public.sessions for select to anon, authenticated using (true);
create policy "club write sessions" on public.sessions for insert to anon, authenticated with check (true);
create policy "club update sessions" on public.sessions for update to anon, authenticated using (true) with check (true);

-- Realtime streams for live multi-device sync
alter publication supabase_realtime add table public.cases;
alter publication supabase_realtime add table public.interrogation_logs;
alter publication supabase_realtime add table public.verdicts;
alter publication supabase_realtime add table public.club_users;`;

export async function saveCase(c: CaseFile, roomCode = "") {
  const db = getDb();
  if (!db) return null;
  const { error } = await db.from("cases").insert({
    room_code: roomCode || null,
    title: c.title,
    briefing: c.overview,
    police_report: c.policeReport,
    evidence: c.clues,
    hotspots: c.hotspots,
    suspects: c.suspects,
    solution: c.solution,
  });
  if (error) throw new Error(error.message);
  return true;
}

export async function saveInterrogation(input: {
  caseTitle: string;
  suspectName: string;
  question: string;
  answer: string;
  roomCode?: string;
  alias?: string;
}) {
  export function getDb(): SupabaseClient | null {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";
  const envAnon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? "";
  const local = readDbConfig();

  // A manually saved override (if any) wins; otherwise fall back to the env vars automatically.
  const url = (local.url || envUrl).trim().replace(/\/$/, "");
  const anonKey = (local.anonKey || envAnon).trim();

  if (!url || !anonKey) return null;

  const key = `${url}|${anonKey}`;
  if (cached?.key === key) return cached.client;
  const client = createClient(url, anonKey, { auth: { persistSession: false } });
  cached = { key, client };
  return client;
}

export async function saveVerdict(input: Verdict & { caseTitle: string; cracked: boolean; roomCode?: string }) {
  const db = getDb();
  if (!db) return null;
  const { error } = await db.from("verdicts").insert({
    room_code: input.roomCode || null,
    case_title: input.caseTitle,
    culprit: input.culprit,
    motive: input.motive,
    weapon: input.weapon,
    key_evidence: input.keyEvidence,
    cracked: input.cracked,
  });
  if (error) throw new Error(error.message);
  return true;
}

/* ---------------- Sessions: save / resume ---------------- */

export type SessionState = {
  caseFile: CaseFile;
  log: LogEntry[];
  unlocked: string[];
  verdict: Verdict | null;
  chats: Record<string, ChatMessage[]>;
};

export type SavedSession = {
  id: string;
  room_code: string;
  case_title: string;
  updated_at: string;
  solved: boolean;
  state: SessionState;
};

export async function saveSession(roomCode: string, state: SessionState, solved: boolean) {
  const db = getDb();
  if (!db) return null;
  const { error } = await db.from("sessions").upsert(
    {
      room_code: roomCode || "local",
      case_title: state.caseFile.title,
      state,
      solved,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "room_code,case_title" },
  );
  if (error) throw new Error(error.message);
  return true;
}

export async function listSessions(solved?: boolean) {
  const db = getDb();
  if (!db) return [];
  let q = db.from("sessions").select("*").order("updated_at", { ascending: false }).limit(50);
  if (solved !== undefined) q = q.eq("solved", solved);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as SavedSession[];
}

export async function listVerdicts(caseTitle?: string) {
  const db = getDb();
  if (!db) return [];
  let q = db.from("verdicts").select("*").order("created_at", { ascending: false }).limit(50);
  if (caseTitle) q = q.eq("case_title", caseTitle);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as Array<{
    id: string;
    created_at: string;
    room_code: string | null;
    case_title: string;
    culprit: string;
    motive: string | null;
    weapon: string | null;
    key_evidence: string | null;
    cracked: boolean;
  }>;
}

export async function listTranscript(caseTitle: string) {
  const db = getDb();
  if (!db) return [];
  const { data, error } = await db
    .from("interrogation_logs")
    .select("*")
    .eq("case_title", caseTitle)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []) as Array<{
    id: string;
    created_at: string;
    detective_alias: string | null;
    suspect_name: string;
    question: string;
    answer: string;
  }>;
}
