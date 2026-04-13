import { useContainerWidth, Responsive } from "react-grid-layout";
import type { DashboardItem } from "../../types/dashboard";
import { WidgetRenderer } from "../../components/WidgetRenderer";

import { useDashboardState } from "../../hooks/useDashboardState";
import { useEquipmentWebSocket } from "../../hooks/useEquipmentWebSocket";

import { MOCK_DATA, ALERTS_DATA, TEMP_DATA } from "../../components/mocks/dashboardMockData";
import { initialLayouts } from "../../utils/initialLayouts";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

export default function DashboardBody() {
    const { containerRef, width } = useContainerWidth();

  const {
    alerts,
    autoArrange,
    equipment,
    setEquipment,
    layouts,
    togglePinWidget,

    handleLayoutChange,
    removeWidget,
    applyLayout,
  } = useDashboardState({
    mockData: MOCK_DATA,
    initialLayouts,
    alertsData: ALERTS_DATA,
  });

  useEquipmentWebSocket(setEquipment);
  return (
    <main className="p-4 max-w-[1800px] mx-auto">
        <div ref={containerRef}>
          <Responsive
            className="layout"
            layouts={{ lg: layouts }}
            breakpoints={{ lg: 1200, md: 996, sm: 768 }}
            cols={{ lg: 12, md: 10, sm: 6 }}
            rowHeight={140}
            width={width || 1200}
            margin={[20, 20]}
            onDragStop={() => {
              if (!autoArrange) return;
              applyLayout(layouts, true);
            }}
            onResizeStop={() => {
              if (!autoArrange) return;
              applyLayout(layouts, true);
            }}
            onLayoutChange={handleLayoutChange}
          >
            {layouts.map((widget: DashboardItem) => (
              <div
                key={widget.i}
                className="bg-[#161B26] border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group flex flex-col"
              >
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

                <h3 className="drag-handle cursor-move text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2 select-none">
                  <div className={`w-1 h-3 ${widget.color} rounded-full`} />
                  {widget.title}
                  <span className="ml-auto opacity-0 group-hover:opacity-100 text-slate-600">
                    ⠿
                  </span>
                </h3>

                <div className="flex-grow overflow-hidden flex flex-col">
                  <WidgetRenderer
                    widget={widget}
                    equipment={equipment}
                    alerts={alerts}
                    trendData={TEMP_DATA}
                  />
                </div>
              </div>
            ))}
          </Responsive>
        </div>
      </main>
  );
}