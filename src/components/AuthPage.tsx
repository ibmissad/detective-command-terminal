import { useState } from "react";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

export function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("Agent clearance granted! Check your email or log in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Access granted, Detective.");
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0c10] px-4 font-['Barlow',sans-serif]">
      <div className="w-full max-w-md rounded-xl border border-border/40 bg-[#12151c] p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="font-['Cinzel'] text-2xl font-bold tracking-wider text-foreground">
            SHERLOCK COMMAND CENTER
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isSignUp ? "Register new agency credentials" : "Authenticate to access active case files"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
              Agent Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              placeholder="detective@agency.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
              Security Passcode
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Verifying..." : isSignUp ? "Register Agent" : "Access Terminal"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-muted-foreground hover:text-primary transition-colors underline"
          >
            {isSignUp ? "Already cleared? Log in here" : "Need agent credentials? Register here"}
          </button>
        </div>
      </div>
    </div>
  );
}
