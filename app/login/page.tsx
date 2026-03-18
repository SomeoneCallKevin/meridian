"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const { login, register, user, loading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [loading, user, router]);

  if (!loading && user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (mode === "register") {
      if (!name.trim()) { setError("Name is required"); return; }
      if (password !== confirmPassword) { setError("Passwords don't match"); return; }
      if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    }

    setSubmitting(true);
    const result = mode === "login"
      ? await login(email, password)
      : await register(email, name, password);

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-deep flex items-center justify-center px-4">
      {/* Background subtle grid */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      <div className="w-full max-w-[420px] relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="no-underline">
            <h1 className="font-display text-[32px] text-t-primary tracking-tight">
              Meridian<span className="text-accent-green">.</span>
            </h1>
          </Link>
          <p className="text-t-muted text-sm mt-1">
            {mode === "login" ? "Sign in to your account" : "Create your account"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-white/[0.06] rounded-2xl p-8">
          {/* Tab toggle */}
          <div className="flex rounded-lg bg-white/[0.04] p-1 mb-6">
            <button
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 py-2 text-[13px] font-medium rounded-md transition-all ${
                mode === "login"
                  ? "bg-white/[0.08] text-t-primary shadow-sm"
                  : "text-t-muted hover:text-t-secondary"
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => { setMode("register"); setError(""); }}
              className={`flex-1 py-2 text-[13px] font-medium rounded-md transition-all ${
                mode === "register"
                  ? "bg-white/[0.08] text-t-primary shadow-sm"
                  : "text-t-muted hover:text-t-secondary"
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "register" && (
              <div>
                <label className="text-[12px] text-t-muted font-medium uppercase tracking-wider block mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-[14px] text-t-primary placeholder:text-t-muted/50 focus:outline-none focus:border-accent-green/40 focus:ring-1 focus:ring-accent-green/20 transition-colors"
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <label className="text-[12px] text-t-muted font-medium uppercase tracking-wider block mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-[14px] text-t-primary placeholder:text-t-muted/50 focus:outline-none focus:border-accent-green/40 focus:ring-1 focus:ring-accent-green/20 transition-colors"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="text-[12px] text-t-muted font-medium uppercase tracking-wider block mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "register" ? "Min 6 characters" : "Your password"}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-[14px] text-t-primary placeholder:text-t-muted/50 focus:outline-none focus:border-accent-green/40 focus:ring-1 focus:ring-accent-green/20 transition-colors"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
              />
            </div>

            {mode === "register" && (
              <div>
                <label className="text-[12px] text-t-muted font-medium uppercase tracking-wider block mb-1.5">
                  Confirm password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-[14px] text-t-primary placeholder:text-t-muted/50 focus:outline-none focus:border-accent-green/40 focus:ring-1 focus:ring-accent-green/20 transition-colors"
                  autoComplete="new-password"
                  required
                />
              </div>
            )}

            {error && (
              <div className="bg-accent-red/10 border border-accent-red/20 rounded-lg px-4 py-2.5 text-[13px] text-accent-red">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || loading}
              className="w-full py-3 bg-accent-green text-deep font-semibold text-[14px] rounded-lg hover:bg-[#2EE89A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            >
              {submitting
                ? mode === "login" ? "Signing in..." : "Creating account..."
                : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>

        {/* Bottom text */}
        <p className="text-center text-[12px] text-t-muted mt-6">
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button onClick={() => { setMode("register"); setError(""); }} className="text-accent-green hover:text-[#2EE89A] underline">
                Create one
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button onClick={() => { setMode("login"); setError(""); }} className="text-accent-green hover:text-[#2EE89A] underline">
                Sign in
              </button>
            </>
          )}
        </p>

        {/* Demo note */}
        <div className="mt-4 text-center">
          <p className="text-[11px] text-t-muted/60">
            Your positions, watchlist, and signals are saved to your account
          </p>
        </div>
      </div>
    </div>
  );
}
