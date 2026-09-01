import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Shield, KeyRound } from "lucide-react";

export function AuthPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegistering) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("Account created! Check your email for confirmation if required.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Authenticated successfully.");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="panel w-full max-w-md rounded-md border border-gold-dim p-8 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <Shield className="h-12 w-12 text-gold" />
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gold">Detective HQ</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isRegistering ? "Register your detective credentials" : "Enter credentials to access HQ"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label-caps mb-1 block">Agent Email</label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="detective@agency.com"
              className="border-border bg-surface-2"
            />
          </div>

          <div>
            <label className="label-caps mb-1 block">Passcode</label>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="border-border bg-surface-2"
            />
          </div>

          <Button type="submit" size="lg" className="w-full text-base" disabled={loading}>
            <KeyRound className="mr-2 h-4 w-4" />
            {loading ? "Authenticating..." : isRegistering ? "Register Agent" : "Access Console"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm text-gold hover:underline"
          >
            {isRegistering ? "Already registered? Sign in" : "Need an agent account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
}
