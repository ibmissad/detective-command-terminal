import { createContext, useContext, useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { AuthPage } from "../components/AuthPage";
import { ensureProfile, type Profile } from "../lib/profile";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  signOut: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let active = true;

    const apply = (next: Session | null) => {
      if (!active) return;
      setSession(next ?? null);
      setUser(next?.user ?? null);
      setLoading(false);
    };

    supabase.auth
      .getSession()
      .then(({ data }) => apply(data?.session ?? null))
      .catch(() => apply(null));

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      apply(nextSession ?? null);
    });

    return () => {
      active = false;
      data?.subscription?.unsubscribe();
    };
  }, []);

  // Brand-new accounts may not have a profile row yet — provision it safely.
  useEffect(() => {
    let active = true;
    if (!user?.id) {
      setProfile(null);
      return () => {
        active = false;
      };
    }
    void ensureProfile(user).then((p) => {
      if (active) setProfile(p);
    });
    return () => {
      active = false;
    };
  }, [user?.id]);

  if (typeof window === "undefined") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0c10] text-muted-foreground font-['Barlow']">
        Loading Command Center...
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, signOut: () => void supabase.auth.signOut() }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
