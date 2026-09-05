import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type Profile = {
  id: string;
  display_name: string | null;
  email: string | null;
  role: string | null;
};

/**
 * Safety net for brand-new accounts: if the database trigger has not created a
 * profile row yet (or the table is missing entirely), the app must still load.
 * Never throws — callers get null and render fallback state.
 */
export async function ensureProfile(user: User | null | undefined): Promise<Profile | null> {
  if (!user?.id) return null;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, email, role")
      .eq("id", user.id)
      .maybeSingle();

    if (data) return data as Profile;
    if (error && error.code !== "PGRST116") {
      // Table missing / not readable — run offline rather than crashing.
      return null;
    }

    const fallbackName =
      (user.user_metadata?.["display_name"] as string | undefined) ??
      user.email?.split("@")[0] ??
      "Detective";

    const { data: created } = await supabase
      .from("profiles")
      .insert({ id: user.id, email: user.email ?? null, display_name: fallbackName })
      .select("id, display_name, email, role")
      .maybeSingle();

    return (created as Profile | null) ?? {
      id: user.id,
      display_name: fallbackName,
      email: user.email ?? null,
      role: "detective",
    };
  } catch {
    return null;
  }
}
