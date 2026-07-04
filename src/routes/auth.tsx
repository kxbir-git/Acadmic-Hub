import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GraduationCap, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CampusBackground } from "@/components/CampusBackground";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — Kabir.io" },
      {
        name: "description",
        content:
          "Sign in to Kabir.io with your Gmail account to access your academic notes and notification hub.",
      },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.object({
  email: z.string().trim().email().max(255),
});

function AuthPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      if (error || !data.session) return;
      navigate({ to: "/dashboard", replace: true });
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        navigate({ to: "/dashboard", replace: true });
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  const onGoogle = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/auth",
      extraParams: { prompt: "select_account" },
    });
    if (result.error) {
      setBusy(false);
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  };

  const onEmailLink = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = emailSchema.safeParse({ email: fd.get("email") });
    if (!parsed.success) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setEmailBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data.email,
      options: { emailRedirectTo: `${window.location.origin}/auth` },
    });
    setEmailBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Check your inbox for a magic sign-in link.");
  };

  return (
    <>
      <CampusBackground />
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
              <GraduationCap className="h-7 w-7" />
            </div>
            <h1 className="mt-4 font-display text-3xl font-semibold">
              Kabir<span className="text-gradient-gold">.io</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in with Gmail to continue
            </p>
          </div>

          <div className="glass rounded-2xl p-6">
            <Button
              type="button"
              size="lg"
              className="w-full bg-white text-slate-900 hover:bg-white/90"
              onClick={onGoogle}
              disabled={busy}
            >
              {busy ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <GoogleIcon className="mr-2 h-4 w-4" />
              )}
              Continue with Google
            </Button>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              New here? Signing in with Google creates your account instantly.
            </p>

            <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
              <div className="h-px flex-1 bg-white/10" />
              or email link
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <form onSubmit={onEmailLink} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@gmail.com"
                  required
                  className="bg-white/5"
                />
              </div>
              <Button
                type="submit"
                variant="outline"
                className="w-full border-white/15 bg-white/5 hover:bg-white/10"
                disabled={emailBusy}
              >
                {emailBusy ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                Send magic link
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing you agree to receive account-related emails.
          </p>
        </div>
      </div>
    </>
  );
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="#EA4335"
        d="M12 11v3.2h5.4c-.2 1.4-1.6 4.1-5.4 4.1-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.7 14.6 2.8 12 2.8 6.9 2.8 2.8 6.9 2.8 12S6.9 21.2 12 21.2c6.9 0 9.2-4.8 9.2-7.3 0-.5-.1-.9-.1-1.3H12z"
      />
    </svg>
  );
}
