import { Responsive, useContainerWidth } from "react-grid-layout";
import { useOutletContext } from "react-router-dom";
import type { DashboardItem } from "../../types/dashboard";
import { WidgetRenderer } from "../../components/WidgetRenderer";
import {
  DASHBOARD_BREAKPOINTS,
  DASHBOARD_COLS,
  type DashboardBreakpoint,
  type DashboardState,
} from "../../hooks/useDashboardState";

import { TEMP_DATA } from "../../components/mocks/dashboardMockData";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

type DashboardOutletContext = DashboardState & {
  canEditDashboard: boolean;
};

export default function DashboardBody() {
  const { containerRef, width, mounted } = useContainerWidth();

  const {
    alerts,
    autoArrange,
    equipment,
    equipmentById,
    layouts,
    responsiveLayouts,
    togglePinWidget,
    handleLayoutChange,
    removeWidget,
    applyLayout,
    setCurrentBreakpoint,
    canEditDashboard,
  } = useOutletContext<DashboardOutletContext>();

  return (
    <main className="p-4 max-w-[1800px] mx-auto">
        <div ref={containerRef}>
          {mounted && (
          <Responsive<DashboardBreakpoint>
            className="layout"
            layouts={responsiveLayouts}
            breakpoints={DASHBOARD_BREAKPOINTS}
            cols={DASHBOARD_COLS}
            rowHeight={140}
            width={width}
            margin={[20, 20]}
            containerPadding={[0, 0]}
            dragConfig={{
              enabled: canEditDashboard,
              handle: ".drag-handle",
              cancel: ".no-drag",
              threshold: 3,
            }}
            resizeConfig={{
              enabled: canEditDashboard,
              handles: ["se"],
            }}
            onBreakpointChange={(breakpoint) => {
              setCurrentBreakpoint(breakpoint);
            }}
            onDragStop={(currentLayout) => {
              if (!canEditDashboard) return;
              if (!autoArrange) return;
              applyLayout(currentLayout, true);
            }}
            onResizeStop={(currentLayout) => {
              if (!canEditDashboard) return;
              if (!autoArrange) return;
              applyLayout(currentLayout, true);
            }}
            onLayoutChange={(currentLayout, allLayouts) => {
              if (!canEditDashboard) return;
              handleLayoutChange(currentLayout, allLayouts);
            }}
          >
            {layouts.map((widget: DashboardItem) => (
              <div
                key={widget.i}
                className="bg-[#161B26] border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group flex flex-col"
              >
                {canEditDashboard && (
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center gap-1.5">
                    <button
                      className="text-slate-500 hover:text-white p-1 text-xs"
                      title="위젯 설정"
                    >
                      ⚙️
                    </button>

                    <button
                      onClick={() => removeWidget(widget.i)}
                      className="text-slate-500 hover:text-rose-500 p-1 transition-colors"
                      title="위젯 삭제"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                    <button
                      onClick={() => togglePinWidget(widget.i)}
                      className={`p-1 text-xs transition-colors ${widget.pinned ? "text-yellow-400" : "text-slate-500 hover:text-white"
                        }`}
                      title={widget.pinned ? "핀 해제" : "핀 고정"}
                    >
                      📌
                    </button>
                  </div>
                )}

                <h3 className={`${canEditDashboard ? "drag-handle cursor-move" : "cursor-default"} text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2 select-none`}>
                  <div className={`w-1 h-3 ${widget.color} rounded-full`} />
                  {widget.title}
                  {canEditDashboard && (
                    <span className="ml-auto opacity-0 group-hover:opacity-100 text-slate-600">
                      ⠿
                    </span>
                  )}
                </h3>

                <div className="flex-grow overflow-hidden flex flex-col">
                  <WidgetRenderer
                    widget={widget}
                    equipment={equipment}
                    equipmentById={equipmentById}
                    alerts={alerts}
                    trendData={TEMP_DATA}
                  />
                </div>
              </div>
            ))}
          </Responsive>
          )}
        </div>
      </main>
  );
}
