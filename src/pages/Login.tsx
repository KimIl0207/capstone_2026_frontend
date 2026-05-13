import React, { useState } from "react";

type LoginProps = {
  onLogin?: (payload: { id: string; password: string; rememberMe: boolean }) => void | Promise<void>;
};

export default function Login({ onLogin }: LoginProps) {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!id.trim() || !password.trim()) {
      alert("아이디와 비밀번호를 입력해주세요.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onLogin?.({
        id: id.trim(),
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
              Monitoring Login
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
              실시간 장비 상태와 센서 데이터를 통합 대시보드에서 확인합니다.
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
              <div className="text-sm font-black uppercase tracking-tight text-white">로그인</div>
              <div className="font-mono text-[10px] text-slate-500">보안 접속</div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black tracking-tight text-white">로그인</h2>
            <p className="mt-2 text-sm text-slate-500">
              백엔드 계정으로 대시보드에 접속합니다.
            </p>
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
                placeholder="사용자명을 입력하세요"
                className="h-12 w-full rounded-2xl border border-slate-700/50 bg-slate-900/80 px-4 text-sm outline-none transition-all placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="h-12 w-full rounded-2xl border border-slate-700/50 bg-slate-900/80 px-4 pr-16 text-sm outline-none transition-all placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 px-4 text-xs font-bold text-slate-500 transition-colors hover:text-white"
                >
                  {showPassword ? "숨기기" : "보기"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <label className="flex cursor-pointer select-none items-center gap-3 text-sm text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                />
                로그인 상태 유지
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              {isSubmitting ? "로그인 중..." : "대시보드 로그인"}
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
