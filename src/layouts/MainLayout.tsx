import { Outlet, NavLink } from "react-router-dom";


import { useDashboardState } from "../hooks/useDashboardState";
import { useEquipmentWebSocket } from "../hooks/useEquipmentWebSocket";

import { MOCK_DATA, ALERTS_DATA } from "../components/mocks/dashboardMockData";
import { initialLayouts } from "../utils/initialLayouts";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { useState } from "react";


export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const {
    autoArrange,
    time,
    equipment,
    setEquipment,

    setIsModalOpen,
    setIsEqModalOpen,
    setAutoArrange,
  } = useDashboardState({
    mockData: MOCK_DATA,
    initialLayouts,
    alertsData: ALERTS_DATA,
  });

  useEquipmentWebSocket(setEquipment);
  return (
    <div className="flex min-h-screen bg-[#0B0F1A] text-slate-200">

      {/* 사이드바 */}
       <aside
        className={`
          ${isSidebarOpen ? "w-64" : "w-20"}
          transition-all duration-300 ease-in-out
          border-r border-slate-800 bg-[#0D1117]/95 backdrop-blur-md
          flex flex-col
        `}
      >
        <div className="h-16 border-b border-slate-800 flex items-center justify-between px-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>

            {isSidebarOpen && (
              <div className="min-w-0">
                <div className="text-sm font-black text-white uppercase tracking-tight">
                  Nexus OS
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Control Panel
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="ml-2 text-slate-400 hover:text-white text-sm px-2 py-1 rounded-lg hover:bg-slate-800 transition"
          >
            {isSidebarOpen ? "◀" : "▶"}
          </button>
        </div>

        {/* <nav className="flex-1 p-3 space-y-2"> */}
          {/* <SidebarItem to="/dashboard" label="Dashboard" icon="📊" open={isSidebarOpen} />
          <SidebarItem to="/stats" label="Stats" icon="📈" open={isSidebarOpen} />
          <SidebarItem to="/settings" label="Settings" icon="⚙️" open={isSidebarOpen} />
        </nav> */}
      </aside>

      {/* 메인 영역 */}
      <div className="flex-1 flex flex-col">

        {/* header */}
        <header className="h-16 border-b border-slate-800/60 bg-[#0D1117]/80 backdrop-blur-md flex items-center px-6 justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white uppercase">
              {equipment.name} Dashboard
            </h1>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              {time.toLocaleDateString()}
              <span className="text-slate-400 ml-1">{time.toLocaleTimeString()}</span>
            </p>
          </div>
        </div>

        <div className="flex-grow max-w-2xl px-12">
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center text-indigo-400">
              <span className="text-xs font-bold">AI</span>
            </div>
            <input
              type="text"
              placeholder="장비 상태를 분석하거나 위젯 배치를 명령하세요..."
              className="w-full bg-slate-900/80 border border-slate-700/50 rounded-2xl h-11 pl-12 pr-4 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsEqModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2"
          >
            ⚙️ 장비 등록
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
          >
            <span className="text-lg">+</span> Add Widget
          </button>
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-500 tracking-wider uppercase">
              Live Connection
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 overflow-hidden p-1">
            <div className="w-full h-full rounded-full bg-indigo-500/20 flex items-center justify-center text-xs text-indigo-400 font-bold">
              JD
            </div>
          </div>
        </div>
        <button
          onClick={() => setAutoArrange(!autoArrange)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${autoArrange
              ? "bg-blue-600 text-white"
              : "bg-slate-800 text-slate-400"
            }`}
        >
          Auto Arrange: {autoArrange ? "ON" : "OFF"}
        </button>
      </header>

        {/* 페이지 내용 */}
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}