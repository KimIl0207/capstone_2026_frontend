import React, { useState } from "react";

type LoginPayload = {
  id: string;
  password: string;
  rememberMe: boolean;
};

type SignupPayload = {
  username: string;
  email: string;
  password: string;
  fullName: string;
};

type LoginProps = {
  onLogin?: (payload: LoginPayload) => void | Promise<void>;
  onSignup?: (payload: SignupPayload) => void | Promise<void>;
};

type AuthMode = "login" | "signup";

const usernamePattern = /^[a-z]+$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).+$/;
const fullNamePattern = /^[A-Za-z가-힣][A-Za-z가-힣\s.'-]{1,49}$/;

function validateSignup(payload: SignupPayload): string | null {
  if (!usernamePattern.test(payload.username)) {
    return "Username must contain lowercase English letters only.";
  }

  if (!emailPattern.test(payload.email)) {
    return "Enter a valid email address.";
  }

  if (!passwordPattern.test(payload.password)) {
    return "Password must include letters, numbers, and a special character.";
  }

  if (!fullNamePattern.test(payload.fullName) || !/[A-Za-z가-힣]{2,}/.test(payload.fullName.replace(/[\s.'-]/g, ""))) {
    return "Full name must be a valid Korean or English name.";
  }

  return null;
}

export default function Login({ onLogin, onSignup }: LoginProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [id, setId] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignup = mode === "signup";

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setPassword("");
    setShowPassword(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const username = id.trim();

    if (isSignup) {
      const payload = {
        username,
        email: email.trim(),
        password,
        fullName: fullName.trim(),
      };
      const validationError = validateSignup(payload);

      if (validationError) {
        alert(validationError);
        return;
      }

      try {
        setIsSubmitting(true);
        await onSignup?.(payload);
        alert("Account created. Please log in.");
        setMode("login");
        setEmail("");
        setFullName("");
        setPassword("");
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    if (!username || !password.trim()) {
      alert("Enter your username and password.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onLogin?.({
        id: username,
        password,
        rememberMe,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0F1A] px-6 py-10 font-sans text-slate-200 selection:bg-indigo-500/30">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-80px] top-[-120px] h-[320px] w-[320px] rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute bottom-[-140px] right-[-60px] h-[360px] w-[360px] rounded-full bg-purple-600/20 blur-3xl" />
      </div>

      <div className="relative z-10 grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-[32px] border border-slate-800 bg-[#0D1117]/90 shadow-2xl backdrop-blur-md lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden flex-col justify-between border-r border-slate-800 bg-gradient-to-br from-[#111827] via-[#0F172A] to-[#0D1117] p-10 lg:flex">
          <div>
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>

            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.25em] text-indigo-400">
              Smart Factory Platform
            </p>
            <h1 className="text-4xl font-black leading-tight tracking-tight text-white">
              Unified Equipment
              <br />
              Monitoring
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
              Monitor equipment, sensors, and gateway data from a single dashboard.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { label: "Live Status", value: "24/7" },
              { label: "Assets", value: "128" },
              { label: "Gateway", value: "STOMP" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {item.label}
                </div>
                <div className="mt-2 text-xl font-black text-white">{item.value}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col justify-center bg-[#0D1117]/80 p-8 sm:p-10 lg:p-12">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-black uppercase tracking-tight text-white">Dashboard</div>
              <div className="font-mono text-[10px] text-slate-500">Secure access</div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black tracking-tight text-white">
              {isSignup ? "Create account" : "Login"}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {isSignup ? "Register a dashboard account." : "Access your monitoring dashboard."}
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-2xl border border-slate-800 bg-slate-950/60 p-1">
            {[
              { label: "Login", value: "login" as const },
              { label: "Sign up", value: "signup" as const },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => switchMode(item.value)}
                className={`h-10 rounded-xl text-sm font-bold transition-colors ${
                  mode === item.value
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                    : "text-slate-500 hover:text-slate-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Username
              </label>
              <input
                type="text"
                value={id}
                onChange={(event) => setId(event.target.value)}
                placeholder={isSignup ? "lowercase username" : "username"}
                className="h-12 w-full rounded-2xl border border-slate-700/50 bg-slate-900/80 px-4 text-sm outline-none transition-all placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                autoComplete="username"
              />
            </div>

            {isSignup ? (
              <>
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@example.com"
                    className="h-12 w-full rounded-2xl border border-slate-700/50 bg-slate-900/80 px-4 text-sm outline-none transition-all placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Full name"
                    className="h-12 w-full rounded-2xl border border-slate-700/50 bg-slate-900/80 px-4 text-sm outline-none transition-all placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    autoComplete="name"
                  />
                </div>
              </>
            ) : null}

            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="password"
                  className="h-12 w-full rounded-2xl border border-slate-700/50 bg-slate-900/80 px-4 pr-16 text-sm outline-none transition-all placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  autoComplete={isSignup ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 px-4 text-xs font-bold text-slate-500 transition-colors hover:text-white"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {!isSignup ? (
              <div className="flex items-center justify-between gap-4">
                <label className="flex cursor-pointer select-none items-center gap-3 text-sm text-slate-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                  />
                  Remember me
                </label>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              {isSubmitting ? "Submitting..." : isSignup ? "Create account" : "Login"}
            </button>
          </form>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-6">
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                Secure Channel
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
