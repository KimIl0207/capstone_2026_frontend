import React, { useState } from "react";

type LoginProps = {
  onLogin?: (payload: { id: string; password: string; rememberMe: boolean }) => void;
};

export default function Login({ onLogin }: LoginProps) {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!id.trim() || !password.trim()) {
      alert("아이디와 비밀번호를 입력해주세요.");
      return;
    }

    onLogin?.({
      id: id.trim(),
      password,
      rememberMe,
    });
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-slate-200 font-sans selection:bg-indigo-500/30 flex items-center justify-center px-6 py-10">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-120px] left-[-80px] w-[320px] h-[320px] bg-indigo-600/20 blur-3xl rounded-full" />
        <div className="absolute bottom-[-140px] right-[-60px] w-[360px] h-[360px] bg-purple-600/20 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] rounded-[32px] overflow-hidden border border-slate-800 shadow-2xl bg-[#0D1117]/90 backdrop-blur-md">
        <section className="hidden lg:flex flex-col justify-between p-10 border-r border-slate-800 bg-gradient-to-br from-[#111827] via-[#0F172A] to-[#0D1117]">
          <div>
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-6">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>

            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-indigo-400 mb-4">
              Smart Factory Platform
            </p>
            <h1 className="text-4xl font-black tracking-tight text-white leading-tight">
              Unified Equipment
              <br />
              Monitoring Login
            </h1>
            <p className="mt-5 text-sm text-slate-400 leading-7 max-w-md">
              실시간 설비 상태, 센서 데이터, 운영 지표를 하나의 대시보드에서 확인할 수 있도록
              구성된 범용 관제 플랫폼입니다. 기존 대시보드와 동일한 톤으로 로그인 화면을
              구성했습니다.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-10">
            {[
              { label: "Live Status", value: "24/7" },
              { label: "Assets", value: "128" },
              { label: "Gateway", value: "OPC-UA" },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4"
              >
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {item.label}
                </div>
                <div className="mt-2 text-xl font-black text-white">{item.value}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="p-8 sm:p-10 lg:p-12 flex flex-col justify-center bg-[#0D1117]/80">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-black tracking-tight text-white uppercase">Login</div>
              <div className="text-[10px] text-slate-500 font-mono">Secure Access</div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black tracking-tight text-white">Sign in</h2>
            <p className="mt-2 text-sm text-slate-500">
              계정 권한에 따라 대시보드 편집 기능이 다르게 제공됩니다.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">
                User ID
              </label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="아이디를 입력하세요"
                className="w-full bg-slate-900/80 border border-slate-700/50 rounded-2xl h-12 px-4 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full bg-slate-900/80 border border-slate-700/50 rounded-2xl h-12 px-4 pr-14 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 px-4 text-xs font-bold text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <label className="flex items-center gap-3 text-sm text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                />
                로그인 상태 유지
              </label>

              <button
                type="button"
                className="text-xs font-bold text-indigo-400 hover:text-white transition-colors"
              >
                비밀번호 찾기
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-12 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
            >
              <span className="text-base">→</span>
              Login to Dashboard
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-500 tracking-wider uppercase">
                Secure Channel
              </span>
            </div>

            <div className="text-[11px] text-slate-500">
              New here? <button className="text-indigo-400 hover:text-white font-bold">Request Access</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
