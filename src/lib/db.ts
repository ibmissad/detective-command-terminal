import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { CaseFile, Verdict } from "./case-types";

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
  const { url, anonKey } = readDbConfig();
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
  case_title text not null,
  suspect_name text not null,
  question text not null,
  answer text not null
);

create table if not exists public.verdicts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  case_title text not null,
  culprit text not null,
  motive text,
  weapon text,
  key_evidence text,
  cracked boolean not null default false
);

grant select, insert on public.cases, public.interrogation_logs, public.verdicts to anon, authenticated;

alter table public.cases enable row level security;
alter table public.interrogation_logs enable row level security;
alter table public.verdicts enable row level security;

create policy "club read cases" on public.cases for select to anon, authenticated using (true);
create policy "club write cases" on public.cases for insert to anon, authenticated with check (true);
create policy "club read logs" on public.interrogation_logs for select to anon, authenticated using (true);
create policy "club write logs" on public.interrogation_logs for insert to anon, authenticated with check (true);
create policy "club read verdicts" on public.verdicts for select to anon, authenticated using (true);
create policy "club write verdicts" on public.verdicts for insert to anon, authenticated with check (true);`;

export async function saveCase(c: CaseFile) {
  const db = getDb();
  if (!db) return null;
  const { error } = await db.from("cases").insert({
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
}) {
  const db = getDb();
  if (!db) return null;
  const { error } = await db.from("interrogation_logs").insert({
    case_title: input.caseTitle,
    suspect_name: input.suspectName,
    question: input.question,
    answer: input.answer,
  });
  if (error) throw new Error(error.message);
  return true;
}

export async function saveVerdict(input: Verdict & { caseTitle: string; cracked: boolean }) {
  const db = getDb();
  if (!db) return null;
  const { error } = await db.from("verdicts").insert({
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
