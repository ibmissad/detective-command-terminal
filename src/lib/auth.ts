import { getDb } from "./db";

export type ClubUser = {
  id: string;
  created_at: string;
  username: string;
  email: string | null;
  status: "pending" | "approved" | "rejected";
};

const KEY_ACCOUNT = "scc.account";

export function readAccount(): ClubUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY_ACCOUNT);
    return raw ? (JSON.parse(raw) as ClubUser) : null;
  } catch {
    return null;
  }
}

export function writeAccount(user: ClubUser | null) {
  if (typeof window === "undefined") return;
  if (user) window.localStorage.setItem(KEY_ACCOUNT, JSON.stringify(user));
  else window.localStorage.removeItem(KEY_ACCOUNT);
}

export async function hashPassword(password: string) {
  const bytes = new TextEncoder().encode(`scc::${password}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function registerUser(username: string, email: string, password: string): Promise<ClubUser> {
  const db = getDb();
  if (!db) throw new Error("Connect the club database first.");
  const password_hash = await hashPassword(password);
  const { data, error } = await db
    .from("club_users")
    .insert({ username: username.trim(), email: email.trim() || null, password_hash, status: "pending" })
    .select("id, created_at, username, email, status")
    .single();
  if (error) {
    throw new Error(
      error.code === "23505" ? "That username is already registered." : error.message,
    );
  }
  return data as ClubUser;
}

export async function signIn(username: string, password: string): Promise<ClubUser> {
  const db = getDb();
  if (!db) throw new Error("Connect the club database first.");
  const password_hash = await hashPassword(password);
  const { data, error } = await db
    .from("club_users")
    .select("id, created_at, username, email, status, password_hash")
    .eq("username", username.trim())
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || (data as { password_hash: string }).password_hash !== password_hash) {
    throw new Error("Unknown username or wrong password.");
  }
  const { password_hash: _drop, ...user } = data as ClubUser & { password_hash: string };
  return user as ClubUser;
}

export async function refreshAccount(id: string): Promise<ClubUser | null> {
  const db = getDb();
  if (!db) return null;
  const { data } = await db
    .from("club_users")
    .select("id, created_at, username, email, status")
    .eq("id", id)
    .maybeSingle();
  return (data as ClubUser) ?? null;
}

export async function listUsers(): Promise<ClubUser[]> {
  const db = getDb();
  if (!db) return [];
  const { data, error } = await db
    .from("club_users")
    .select("id, created_at, username, email, status")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []) as ClubUser[];
}

export async function setUserStatus(id: string, status: ClubUser["status"]) {
  const db = getDb();
  if (!db) throw new Error("Connect the club database first.");
  const { error } = await db.from("club_users").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}
