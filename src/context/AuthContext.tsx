import { createContext, useContext, useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { AuthPage } from "../components/AuthPage";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType>({ user: null, session: null, signOut: () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = () => supabase.auth.signOut();

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
    <AuthContext.Provider value={{ user, session, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
