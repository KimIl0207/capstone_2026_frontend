import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";

import { useDashboardState } from "../hooks/useDashboardState";
import { useEquipmentWebSocket } from "../hooks/useEquipmentWebSocket";
import { isAdmin } from "../utils/Auth";

import DashboardModals from "../components/dashboard/DashboardModals";
import { ALERTS_DATA, MOCK_DATA } from "../components/mocks/dashboardMockData";
import { initialLayouts } from "../utils/initialLayouts";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const navItems = [
  {
    to: "/dashboard",
    label: "대시보드",
    description: "실시간 설비 모니터링",
    icon: "M4 13h6V4H4v9Zm10 7h6V4h-6v16ZM4 20h6v-5H4v5Z",
  },
  {
    to: "/stats",
    label: "통계",
    description: "운영 지표 분석",
    icon: "M5 19V9h3v10H5Zm6 0V5h3v14h-3Zm6 0v-7h3v7h-3Z",
  },
  {
    to: "/settings",
    label: "설정",
    description: "대시보드 환경 설정",
    icon: "M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Zm8.4-3.5c0-.4 0-.8-.1-1.2l2-1.5-2-3.5-2.4 1a8.7 8.7 0 0 0-2-1.2L15.5 3h-4l-.4 2.6c-.7.3-1.4.7-2 1.2l-2.4-1-2 3.5 2 1.5a9.5 9.5 0 0 0 0 2.4l-2 1.5 2 3.5 2.4-1c.6.5 1.3.9 2 1.2l.4 2.6h4l.4-2.6c.7-.3 1.4-.7 2-1.2l2.4 1 2-3.5-2-1.5c.1-.4.1-.8.1-1.2Z",
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

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const canEditDashboard = isAdmin();

  const dashboardState = useDashboardState({
    mockData: MOCK_DATA,
    initialLayouts,
    alertsData: ALERTS_DATA,
  });

  const {
    autoArrange,
    time,
    equipment,
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

  useEquipmentWebSocket(setEquipment);

  const pageTitle = useMemo(() => {
    const current = navItems.find((item) => location.pathname.startsWith(item.to));
    return current?.label ?? "대시보드";
  }, [location.pathname]);

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

          <div className="order-last w-full max-w-2xl md:order-none md:flex-1 md:px-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center text-cyan-400">
                <span className="text-xs font-bold">AI</span>
              </div>
              <input
                type="text"
                placeholder="설비 상태 분석이나 위젯 배치를 입력하세요."
                className="h-11 w-full rounded-lg border border-slate-700/70 bg-slate-900/80 pl-12 pr-4 text-xs text-slate-100 outline-none transition-all placeholder:text-slate-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />
            </div>
          </div>

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
                {isSavingDashboard ? "Saving..." : "Save"}
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
                  ? "Save failed"
                  : isDashboardDirty
                    ? "Unsaved"
                    : lastDashboardSavedAt
                      ? `Saved ${lastDashboardSavedAt.toLocaleTimeString()}`
                      : "Saved locally"}
              </span>
            </div>
          )}
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden">
          <Outlet context={{ ...dashboardState, canEditDashboard }} />
        </main>
        {canEditDashboard && <DashboardModals state={dashboardState} />}
      </div>
    </div>
  );
}
