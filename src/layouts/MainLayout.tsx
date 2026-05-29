import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getMe, logoutSession } from "../api/client";
import { useDashboardState } from "../hooks/useDashboardState";
import { useEquipmentWebSocket } from "../hooks/useEquipmentWebSocket";
import { getAccessToken, logout } from "../utils/Auth";

import DashboardModals from "../components/dashboard/DashboardModals";
import { ALERTS_DATA } from "../components/mocks/dashboardMockData";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const INACTIVITY_WARNING_MS = 30 * 60 * 1000;
const INACTIVITY_LOGOUT_GRACE_MS = 60 * 1000;

const navItems = [
  {
    to: "/dashboard",
    label: "대시보드",
    description: "실시간 설비 모니터링",
    icon: "M4 13h6V4H4v9Zm10 7h6V4h-6v16ZM4 20h6v-5H4v5Z",
  },
];

function SidebarItem({
  to,
  label,
  description,
  icon,
  open,
}: {
  to: string;
  label: string;
  description: string;
  icon: string;
  open: boolean;
}) {
  return (
    <NavLink
      to={to}
      title={!open ? label : undefined}
      className={({ isActive }) =>
        [
          "group flex items-center gap-3 rounded-lg border px-3 py-3 text-sm font-semibold transition-colors",
          isActive
            ? "border-cyan-400/40 bg-cyan-400/10 text-white"
            : "border-transparent text-slate-400 hover:border-slate-700 hover:bg-slate-800/70 hover:text-slate-100",
          open ? "justify-start" : "justify-center",
        ].join(" ")
      }
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900/80 text-cyan-300 ring-1 ring-slate-700/80 group-hover:ring-cyan-400/50">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d={icon} />
        </svg>
      </span>
      {open && (
        <span className="min-w-0">
          <span className="block truncate">{label}</span>
          <span className="mt-0.5 block truncate text-[11px] font-medium text-slate-500">
            {description}
          </span>
        </span>
      )}
    </NavLink>
  );
}

function FloatingChatbot() {
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

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const inactivityWarningTimer = useRef<number | null>(null);
  const inactivityLogoutTimer = useRef<number | null>(null);
  const [canEditDashboard, setCanEditDashboard] = useState(false);
  const [isAuthVerified, setIsAuthVerified] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const dashboardState = useDashboardState({
    alertsData: ALERTS_DATA,
  });

  const {
    autoArrange,
    time,
    equipment,
    layouts,
    setEquipment,
    setIsModalOpen,
    setIsEqModalOpen,
    setAutoArrange,
    arrangeWidgets,
    saveDashboardState,
    isDashboardDirty,
    isSavingDashboard,
    lastDashboardSavedAt,
    dashboardSaveError,
  } = dashboardState;

  useEquipmentWebSocket(setEquipment, layouts);

  const clearInactivityTimers = useCallback(() => {
    if (inactivityWarningTimer.current !== null) {
      window.clearTimeout(inactivityWarningTimer.current);
      inactivityWarningTimer.current = null;
    }

    if (inactivityLogoutTimer.current !== null) {
      window.clearTimeout(inactivityLogoutTimer.current);
      inactivityLogoutTimer.current = null;
    }
  }, []);

  const handleLogout = useCallback(async () => {
    const accessToken = getAccessToken();

    try {
      if (accessToken) {
        await logoutSession(accessToken);
      }
    } catch (error) {
      console.error("[Auth] Logout request failed", error);
    } finally {
      logout();
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    let isActive = true;
    const accessToken = getAccessToken();

    if (!accessToken) {
      logout();
      navigate("/login", { replace: true });
      return undefined;
    }

    setIsAuthVerified(false);
    getMe(accessToken)
      .then((response) => {
        if (!isActive) {
          return;
        }

        if (!response.success || !response.data) {
          throw new Error(response.message ?? "Failed to verify session.");
        }

        setCanEditDashboard(true);
        setIsAuthVerified(true);
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        console.error("[Auth] Session verification failed", error);
        logout();
        navigate("/login", { replace: true });
      });

    return () => {
      isActive = false;
    };
  }, [navigate]);

  useEffect(() => {
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ] as const;

    const resetInactivityTimers = () => {
      clearInactivityTimers();

      inactivityWarningTimer.current = window.setTimeout(() => {
        alert("장시간 활동이 없어 1분 후 자동 로그아웃됩니다.");
        inactivityLogoutTimer.current = window.setTimeout(() => {
          void handleLogout();
        }, INACTIVITY_LOGOUT_GRACE_MS);
      }, INACTIVITY_WARNING_MS);
    };

    resetInactivityTimers();
    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, resetInactivityTimers, { passive: true });
    });

    return () => {
      clearInactivityTimers();
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, resetInactivityTimers);
      });
    };
  }, [clearInactivityTimers, handleLogout]);

  const pageTitle = useMemo(() => {
    const current = navItems.find((item) => location.pathname.startsWith(item.to));
    return current?.label ?? "대시보드";
  }, [location.pathname]);

  if (!isAuthVerified) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F1A] text-sm font-semibold text-slate-300">
        Verifying session...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0B0F1A] text-slate-200">
      {isMobileSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/70 md:hidden"
          aria-label="사이드바 닫기"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex h-screen w-64 shrink-0 flex-col border-r border-slate-800 bg-[#0D1117]/95 backdrop-blur transition-transform duration-300 ease-in-out md:sticky md:z-auto md:translate-x-0 md:transition-[width]",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
          isSidebarOpen ? "md:w-64" : "md:w-20",
        ].join(" ")}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/15">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M13 2 3 14h8l-1 8 11-14h-8l1-6Z" />
              </svg>
            </div>

            {isSidebarOpen && (
              <div className="min-w-0">
                <div className="truncate text-sm font-black uppercase tracking-tight text-white">
                  Nexus OS
                </div>
                <div className="truncate text-[10px] font-mono text-slate-500">
                  제어 패널
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="ml-2 hidden rounded-md px-2 py-1 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-white md:block"
            aria-label={isSidebarOpen ? "사이드바 접기" : "사이드바 펼치기"}
          >
            {isSidebarOpen ? "<" : ">"}
          </button>
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="ml-2 rounded-md px-2 py-1 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-white md:hidden"
            aria-label="사이드바 닫기"
          >
            x
          </button>
        </div>

        <nav className="flex-1 space-y-2 p-3">
          {navItems.map((item) => (
            <div key={item.to} onClick={() => setIsMobileSidebarOpen(false)}>
              <SidebarItem {...item} open={isSidebarOpen || isMobileSidebarOpen} />
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-800 p-3">
          <div
            className={[
              "flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3",
              isSidebarOpen ? "justify-start" : "justify-center",
            ].join(" ")}
          >
            <div className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.7)]" />
            {isSidebarOpen && (
              <div className="min-w-0">
                <div className="truncate text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Live Connection
                </div>
                <div className="truncate text-[10px] text-slate-500">OPC-UA v2.1</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-50 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-slate-800/60 bg-[#0D1117]/90 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300 md:hidden"
              aria-label="사이드바 열기"
            >
              메뉴
            </button>
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/15 md:flex">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M13 2 3 14h8l-1 8 11-14h-8l1-6Z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-black uppercase tracking-tight text-white">
                {pageTitle === "대시보드" ? `${equipment.name} 대시보드` : pageTitle}
              </h1>
              <p className="mt-0.5 truncate text-[10px] font-mono text-slate-500">
                {time.toLocaleDateString()}
                <span className="ml-1 text-slate-400">{time.toLocaleTimeString()}</span>
              </p>
            </div>
          </div>

          <div className="hidden min-w-0 flex-1 md:block" />

          {canEditDashboard && (
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEqModalOpen(true)}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 transition-colors hover:bg-emerald-500"
              >
                설비 등록
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 transition-colors hover:bg-cyan-500"
              >
                + 위젯 추가
              </button>
              <button
                type="button"
                onClick={() => setAutoArrange(!autoArrange)}
                className={[
                  "rounded-lg px-4 py-2 text-xs font-bold transition-colors",
                  autoArrange ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400",
                ].join(" ")}
              >
                자동 정렬: {autoArrange ? "켜짐" : "꺼짐"}
              </button>
              <button
                type="button"
                onClick={arrangeWidgets}
                className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300 transition-colors hover:border-cyan-400 hover:text-white"
              >
                지금 정렬
              </button>
              <button
                type="button"
                onClick={() => void saveDashboardState()}
                disabled={isSavingDashboard}
                className={[
                  "rounded-lg px-4 py-2 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                  isDashboardDirty
                    ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700",
                ].join(" ")}
                title={dashboardSaveError ?? undefined}
              >
                {isSavingDashboard ? "저장 중..." : "저장"}
              </button>
              <span
                className={[
                  "hidden text-[10px] font-semibold md:inline",
                  dashboardSaveError
                    ? "text-rose-400"
                    : isDashboardDirty
                      ? "text-amber-300"
                      : "text-slate-500",
                ].join(" ")}
                title={dashboardSaveError ?? undefined}
              >
                {dashboardSaveError
                  ? "저장 실패"
                  : isDashboardDirty
                    ? "저장되지 않음"
                    : lastDashboardSavedAt
                      ? `저장됨 ${lastDashboardSavedAt.toLocaleTimeString()}`
                      : "Saved locally"}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300 transition-colors hover:border-rose-400 hover:text-rose-200"
          >
            로그아웃
          </button>
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden">
          <Outlet context={{ ...dashboardState, canEditDashboard }} />
        </main>
        {canEditDashboard && <DashboardModals state={dashboardState} />}
      </div>
      <FloatingChatbot />
    </div>
  );
}
