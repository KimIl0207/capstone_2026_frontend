import type { FormEvent } from "react";
import { useState } from "react";

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <div className="fixed bottom-5 right-5 z-[70] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {isOpen && (
        <section
          className="flex h-[520px] max-h-[calc(100vh-7rem)] w-[min(calc(100vw-2.5rem),380px)] flex-col overflow-hidden rounded-lg border border-slate-700/80 bg-[#0D1117] shadow-2xl shadow-black/50"
          aria-label="AI 챗봇 대화창"
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950/70 px-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2a7 7 0 0 0-7 7v2.1A4 4 0 0 0 6 19h1.4a2.5 2.5 0 0 0 4.8.7h1.4A4.4 4.4 0 0 0 18 15.3V9a6 6 0 0 0-6-7Zm-3.5 9.2a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Zm7 0a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4ZM9.8 15h4.4a2.2 2.2 0 0 1-4.4 0Z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-black text-white">Nexus AI</h2>
                <p className="truncate text-[10px] font-semibold text-emerald-400">Online</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              aria-label="챗봇 닫기"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-[#0B0F1A] px-4 py-4">
            <div className="max-w-[82%] rounded-lg rounded-tl-sm border border-slate-700/70 bg-slate-900 px-3 py-2 text-xs leading-5 text-slate-200">
              설비 상태나 알림 내용을 물어보세요. 대시보드 상황을 빠르게 확인해드릴게요.
            </div>
            <div className="ml-auto max-w-[82%] rounded-lg rounded-tr-sm bg-cyan-500 px-3 py-2 text-xs font-semibold leading-5 text-slate-950">
              현재 이상 알림 요약해줘
            </div>
            <div className="max-w-[82%] rounded-lg rounded-tl-sm border border-slate-700/70 bg-slate-900 px-3 py-2 text-xs leading-5 text-slate-200">
              확인했어요. 우선순위가 높은 알림부터 정리해서 보여드릴게요.
            </div>
          </div>

          <form
            className="flex shrink-0 items-center gap-2 border-t border-slate-800 bg-slate-950/70 p-3"
            onSubmit={handleSubmit}
          >
            <input
              type="text"
              placeholder="메시지 입력..."
              className="h-10 min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 text-xs text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-cyan-400"
            />
            <button
              type="submit"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500 text-slate-950 transition-colors hover:bg-cyan-400"
              aria-label="메시지 보내기"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M3.4 20.4 21 12 3.4 3.6 3 10l10 2-10 2 .4 6.4Z" />
              </svg>
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500 text-slate-950 shadow-xl shadow-cyan-500/25 ring-1 ring-cyan-300/50 transition-all hover:-translate-y-0.5 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-200"
        aria-label={isOpen ? "챗봇 접기" : "챗봇 열기"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" fill="none" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M4 5.8A3.8 3.8 0 0 1 7.8 2h8.4A3.8 3.8 0 0 1 20 5.8v6.9a3.8 3.8 0 0 1-3.8 3.8h-4.8L7 20.4v-3.9A3.8 3.8 0 0 1 4 12.7V5.8Zm5 4.1a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Zm3 0a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Zm3 0a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Z" />
          </svg>
        )}
      </button>
    </div>
  );
}
