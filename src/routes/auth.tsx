import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { BookOpen, Eye, EyeOff, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Lumen" },
      { name: "description", content: "Sign in to Lumen, the study app for high schoolers." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session, profile, loading, refreshProfile } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [grade, setGrade] = useState<number>(9);
  const [busy, setBusy] = useState(false);
  const [verifyEmailSent, setVerifyEmailSent] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && session && profile) {
      navigate({ to: "/" });
    }
  }, [loading, session, profile, navigate]);

  const needsOnboarding = !!session && !profile;

  const validUsername = (u: string) => /^[A-Za-z0-9_]{3,20}$/.test(u);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        if (!validUsername(username)) {
          throw new Error("Username must be 3–20 chars: letters, numbers, underscores.");
        }
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .ilike("username", username)
          .maybeSingle();
        if (existing) throw new Error("That username is taken.");

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/auth",
            data: { username, display_name: displayName || username, grade },
          },
        });
        if (error) throw error;

        // If email confirmation is required, no session yet — show "check your email"
        if (!data.session) {
          setVerifyEmailSent(email);
          toast.success("Verification email sent. Check your inbox.");
        } else if (data.user) {
          // Auto-confirmed: create profile immediately
          const { error: pErr } = await supabase.from("profiles").insert({
            id: data.user.id,
            display_name: displayName || username,
            username,
            grade,
          });
          if (pErr) throw pErr;
          await refreshProfile();
          toast.success("Welcome to Lumen!");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/auth",
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      setBusy(false);
    }
  };

  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;
    if (!validUsername(username)) {
      toast.error("Username must be 3–20 chars: letters, numbers, underscores.");
      return;
    }
    setBusy(true);
    try {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", username)
        .maybeSingle();
      if (existing) throw new Error("That username is taken.");

      const { error } = await supabase.from("profiles").insert({
        id: session.user.id,
        display_name: displayName || username,
        username,
        grade,
      });
      if (error) throw error;
      await refreshProfile();
    } catch (err: any) {
      toast.error(err.message ?? "Could not save profile");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="aurora-bg relative min-h-screen w-full">
      <div className="aurora-blob" style={{ width: 520, height: 520, background: "var(--color-aurora-1)", top: -120, left: -100 }} />
      <div className="aurora-blob" style={{ width: 460, height: 460, background: "var(--color-aurora-2)", top: 200, right: -120, animationDelay: "-6s" }} />
      <div className="starfield" />

      <div className="relative z-10 mx-auto grid min-h-screen max-w-md place-items-center px-4 py-12">
        <div className="w-full">
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="font-display text-3xl font-semibold">Lumen</h1>
            <p className="text-sm text-muted-foreground">
              A focused study space for high schoolers (grades 9–12).
            </p>
          </div>

          <div className="glass-panel p-6">
            {verifyEmailSent ? (
              <div className="space-y-4 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/15">
                  <MailCheck className="h-6 w-6 text-primary" />
                </div>
                <h2 className="font-display text-xl font-semibold">Verify your email</h2>
                <p className="text-sm text-muted-foreground">
                  We sent a confirmation link to <span className="text-foreground">{verifyEmailSent}</span>.
                  Click it to activate your account, then come back here to sign in.
                </p>
                <button
                  onClick={() => { setVerifyEmailSent(null); setMode("signin"); }}
                  className={primaryBtn}
                >
                  Back to sign in
                </button>
              </div>
            ) : needsOnboarding ? (
              <form onSubmit={handleOnboarding} className="space-y-4">
                <h2 className="font-display text-xl font-semibold">One quick thing</h2>
                <p className="text-sm text-muted-foreground">
                  Lumen is for high schoolers only. Pick a username and grade to continue.
                </p>
                <Field label="Username">
                  <input className={inputCls} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ada_lovelace" required />
                </Field>
                <Field label="Display name (optional)">
                  <input className={inputCls} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Ada" />
                </Field>
                <Field label="Grade">
                  <select className={inputCls} value={grade} onChange={(e) => setGrade(Number(e.target.value))}>
                    {[9, 10, 11, 12].map((g) => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </Field>
                <button disabled={busy} className={primaryBtn}>
                  {busy ? "Saving…" : "Continue"}
                </button>
              </form>
            ) : (
              <>
                <div className="mb-4 flex rounded-lg bg-white/5 p-1">
                  <button
                    type="button"
                    onClick={() => setMode("signin")}
                    className={`flex-1 rounded-md py-1.5 text-sm transition ${mode === "signin" ? "bg-primary/20 text-foreground" : "text-muted-foreground"}`}
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className={`flex-1 rounded-md py-1.5 text-sm transition ${mode === "signup" ? "bg-primary/20 text-foreground" : "text-muted-foreground"}`}
                  >
                    Sign up
                  </button>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-3">
                  {mode === "signup" && (
                    <>
                      <Field label="Username">
                        <input
                          className={inputCls}
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="ada_lovelace"
                          required
                          minLength={3}
                          maxLength={20}
                          pattern="[A-Za-z0-9_]{3,20}"
                          title="3–20 characters: letters, numbers, underscores"
                        />
                      </Field>
                      <Field label="Display name (optional)">
                        <input className={inputCls} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Ada" />
                      </Field>
                      <Field label="Grade (9–12 only)">
                        <select className={inputCls} value={grade} onChange={(e) => setGrade(Number(e.target.value))}>
                          {[9, 10, 11, 12].map((g) => (
                            <option key={g} value={g}>Grade {g}</option>
                          ))}
                        </select>
                      </Field>
                    </>
                  )}
                  <Field label="Email">
                    <input type="email" required className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
                  </Field>
                  <Field label="Password">
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        className={inputCls + " pr-10"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </Field>
                  <button disabled={busy} className={primaryBtn}>
                    {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
                  </button>
                  {mode === "signup" && (
                    <p className="text-xs text-muted-foreground">
                      We'll send a verification link to your email.
                    </p>
                  )}
                </form>

                <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
                </div>

                <button onClick={handleGoogle} disabled={busy} className="w-full rounded-lg border border-border bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10">
                  Continue with Google
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-border bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary/60";
const primaryBtn = "w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
