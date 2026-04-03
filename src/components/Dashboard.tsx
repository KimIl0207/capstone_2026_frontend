import { useContainerWidth, Responsive } from "react-grid-layout";
import type { DashboardItem } from "../types/dashboard";
import { WidgetRenderer } from "./WidgetRenderer";

import { useDashboardState } from "../hooks/useDashboardState";
import { useEquipmentWebSocket } from "../hooks/useEquipmentWebSocket";

import { MOCK_DATA, ALERTS_DATA, TEMP_DATA } from "./mocks/dashboardMockData";
import { initialLayouts } from "./utils/initialLayouts";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

export default function Dashboard() {
  const { containerRef, width } = useContainerWidth();

  const {
    allEquipments,
    alerts,
    time,
    equipment,
    setEquipment,
    layouts,
    isModalOpen,
    isEqModalOpen,
    newWidgetConfig,
    builderStep,
    selectedDataCart,
    tempSelection,
    searchTerm,

    setIsModalOpen,
    setIsEqModalOpen,
    setNewWidgetConfig,
    setBuilderStep,
    setTempSelection,
    setSearchTerm,

    handleLayoutChange,
    removeWidget,
    resetWidgetBuilder,
    addSelectedSensorToCart,
    removeSelectedSensorFromCart,
    goToBuilderStep2,
    addWidgetToDashboard,
    startNetworkScan,
    closeEquipmentModal,
    applyEquipmentRegistration,
  } = useDashboardState({
    mockData: MOCK_DATA,
    initialLayouts,
    alertsData: ALERTS_DATA,
  });

  useEquipmentWebSocket(setEquipment);

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-slate-200 font-sans selection:bg-indigo-500/30">
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
      </header>

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

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#1C212E] border border-slate-700 w-full max-w-3xl rounded-3xl p-8 shadow-2xl flex flex-col min-h-[500px]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                Widget Builder <span className="text-indigo-500 ml-2">Step {builderStep}/2</span>
              </h2>
              <button onClick={resetWidgetBuilder} className="text-slate-500 hover:text-white">
                ✕
              </button>
            </div>

            {builderStep === 1 && (
              <div className="flex-1 flex gap-6">
                <div className="w-1/2 bg-slate-900/50 p-5 rounded-2xl border border-slate-800 flex flex-col h-[400px]">
                  <h3 className="text-sm font-bold text-slate-400 mb-4">1. Select Data Source</h3>

                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Equipment
                  </label>
                  <select
                    className="bg-slate-800 border border-slate-700 text-white p-3 rounded-xl mb-4 outline-none text-sm focus:border-indigo-500 transition-all"
                    onChange={(e) => {
                      setTempSelection({ eqId: e.target.value, sensorId: "" });
                      setSearchTerm("");
                    }}
                  >
                    <option value="">장비를 선택하세요</option>
                    {allEquipments.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.name}
                      </option>
                    ))}
                  </select>

                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Sensors (Search)
                  </label>
                  <div className="flex-1 border border-slate-700 rounded-xl overflow-hidden flex flex-col bg-slate-800/50">
                    <div className="p-2 border-b border-slate-700 bg-slate-800 flex items-center gap-2">
                      <span className="text-slate-400 ml-1">🔍</span>
                      <input
                        type="text"
                        placeholder="센서 이름 검색... (예: Temp)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-transparent border-none text-sm text-white outline-none placeholder:text-slate-500"
                      />
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                      {!tempSelection.eqId ? (
                        <div className="h-full flex items-center justify-center text-xs text-slate-500 text-center">
                          장비를 먼저 선택해주세요.
                        </div>
                      ) : (
                        allEquipments
                          .find((eq) => eq.id === tempSelection.eqId)
                          ?.sensors.filter((s) =>
                            s.label.toLowerCase().includes(searchTerm.toLowerCase())
                          )
                          .map((s) => (
                            <button
                              key={s.id}
                              onClick={() =>
                                setTempSelection({ ...tempSelection, sensorId: s.label })
                              }
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                                tempSelection.sensorId === s.label
                                  ? "bg-indigo-600 text-white font-bold"
                                  : "text-slate-300 hover:bg-slate-700"
                              }`}
                            >
                              {s.label}
                            </button>
                          ))
                      )}
                    </div>
                  </div>

                  <button
                    onClick={addSelectedSensorToCart}
                    className="mt-4 bg-indigo-500/20 text-indigo-400 py-3 rounded-xl font-bold border border-indigo-500/50 hover:bg-indigo-500 hover:text-white transition-all"
                  >
                    + Add to Cart
                  </button>
                </div>

                <div className="w-1/2 bg-slate-900/50 p-5 rounded-2xl border border-slate-800 flex flex-col">
                  <h3 className="text-sm font-bold text-slate-400 mb-4">
                    Selected Data ({selectedDataCart.length})
                  </h3>
                  <div className="flex-1 overflow-y-auto space-y-2">
                    {selectedDataCart.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-600 text-sm">
                        담긴 데이터가 없습니다.
                      </div>
                    ) : (
                      selectedDataCart.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-800 p-3 rounded-xl flex justify-between items-center border border-slate-700"
                        >
                          <div>
                            <div className="text-xs text-slate-400">{item.eqName}</div>
                            <div className="text-sm text-white font-bold">{item.sensorId}</div>
                          </div>
                          <button
                            onClick={() => removeSelectedSensorFromCart(idx)}
                            className="text-rose-500 hover:text-rose-400 text-xs font-bold bg-rose-500/10 px-2 py-1 rounded-md"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {builderStep === 2 && (
              <div className="flex-1 flex flex-col">
                <h3 className="text-sm font-bold text-slate-400 mb-4">2. Select Visualization</h3>

                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 mb-6 flex gap-2 flex-wrap items-center">
                  <span className="text-xs font-bold text-slate-500 mr-2">선택된 데이터:</span>
                  {selectedDataCart.map((item, idx) => (
                    <span
                      key={idx}
                      className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-md text-xs border border-indigo-500/30"
                    >
                      {item.eqName} - {item.sensorId}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-4 gap-4">
                  {["GAUGE", "TREND", "DONUT", "STATUS", "LOG", "BAR_V", "BAR_H"].map((t) => {
                    const isMulti = selectedDataCart.length > 1;
                    const isDisabled =
                      isMulti && (t === "GAUGE" || t === "DONUT" || t === "STATUS");

                    const isRecommended =
                      t === "TREND" || t === "GAUGE";

                    return (
                      <button
                        key={t}
                        disabled={isDisabled}
                        onClick={() =>
                          setNewWidgetConfig({
                            ...newWidgetConfig,
                            type: t as DashboardItem["type"],
                          })
                        }
                        className={`relative p-6 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all ${
                          isDisabled
                            ? "opacity-20 cursor-not-allowed bg-slate-900 border-slate-800"
                            : newWidgetConfig.type === t
                            ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-lg shadow-indigo-500/10 scale-[1.02]"
                            : isRecommended
                            ? "bg-slate-800/80 border-slate-600 text-slate-300 hover:border-indigo-400"
                            : "bg-slate-900 border-slate-800 text-slate-600 hover:border-slate-700 opacity-60"
                        }`}
                      >
                        {isRecommended && !isDisabled && (
                          <div className="absolute -top-2 -right-2 bg-indigo-500 text-[8px] font-black px-2 py-1 rounded-full text-white shadow-lg animate-bounce">
                            AI 추천
                          </div>
                        )}

                        <div className="text-3xl">
                          {t === "GAUGE" && "⏲️"}
                          {t === "TREND" && "📉"}
                          {t === "DONUT" && "⭕"}
                          {t === "STATUS" && "🚦"}
                          {t === "LOG" && "🗒️"}
                          {t === "BAR_V" && "📊"}
                          {t === "BAR_H" && "▤"}
                        </div>
                        <span className="text-[10px] font-black tracking-widest uppercase">
                          {t}
                        </span>

                        {isDisabled && (
                          <span className="text-[8px] text-rose-500/70 font-bold">
                            단일 데이터 전용
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-800">
              {builderStep === 1 ? (
                <>
                  <button
                    onClick={resetWidgetBuilder}
                    className="px-6 py-3 rounded-xl bg-slate-800 text-slate-400 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={goToBuilderStep2}
                    className={`px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${
                      selectedDataCart.length > 0
                        ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20"
                        : "bg-slate-700 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    Next Step ➡️
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setBuilderStep(1)}
                    className="px-6 py-3 rounded-xl bg-slate-800 text-slate-400 font-bold hover:bg-slate-700"
                  >
                    ⬅️ Back
                  </button>
                  <button
                    onClick={addWidgetToDashboard}
                    className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                  >
                    ✅ Add to Dashboard
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {isEqModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
          <div className="bg-[#1C212E] border border-slate-700 w-full max-w-5xl rounded-3xl p-8 shadow-2xl flex flex-col h-[85vh]">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                  <span className="text-indigo-500">Auto</span> Discovery
                </h2>
                <p className="text-sm text-slate-500 mt-1 font-medium text-balance">
                  게이트웨이에 연결된 모든 장치와 하위 태그(Tags)를 자동으로 식별합니다.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex flex-col items-end mr-4">
                  <span className="text-[10px] text-slate-500 font-bold uppercase mb-1">
                    Network Status
                  </span>
                  <span className="text-xs text-emerald-400 font-mono">
                    OPC-UA v2.1 Connected
                  </span>
                </div>
                <button
                  onClick={startNetworkScan}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-indigo-600/30 transition-all active:scale-95 flex items-center gap-2"
                >
                  🔍 Start Network Scan
                </button>
              </div>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden">
              <div className="w-1/3 bg-slate-900/40 rounded-2xl border border-slate-800 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-800 bg-slate-800/20 flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Detected Assets
                  </span>
                  <span className="bg-indigo-500/20 text-indigo-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {allEquipments.length} EA
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                  {allEquipments.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-600 text-xs italic">
                      스캔을 시작해주세요.
                    </div>
                  ) : (
                    allEquipments.map((eq) => (
                      <button
                        key={eq.id}
                        onClick={() => setTempSelection({ eqId: eq.id, sensorId: "" })}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all border flex items-center justify-between group ${
                          tempSelection.eqId === eq.id
                            ? "bg-indigo-600 border-indigo-400 text-white font-bold"
                            : "bg-transparent border-transparent text-slate-400 hover:bg-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg opacity-80">
                            {eq.type === "CVD" ? "🧪" : "⚡"}
                          </span>
                          <span>{eq.name}</span>
                        </div>
                        <span
                          className={`text-[9px] px-2 py-1 rounded ${
                            tempSelection.eqId === eq.id
                              ? "bg-white/20"
                              : "bg-slate-800 group-hover:bg-slate-700"
                          }`}
                        >
                          {eq.sensors.length} Tags
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="w-2/3 bg-slate-900/40 rounded-2xl border border-slate-800 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-800 bg-slate-800/20 flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Tag Explorer
                  </span>
                  {tempSelection.eqId && (
                    <button className="text-[10px] font-bold text-indigo-400 hover:text-white transition-colors">
                      Select All in this Asset
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 grid grid-cols-2 gap-3 content-start">
                  {!tempSelection.eqId ? (
                    <div className="col-span-2 h-full flex flex-col items-center justify-center text-slate-600 py-20">
                      <div className="text-5xl mb-4 opacity-20">📡</div>
                      <p className="text-sm font-medium">
                        장비를 선택하면 하위 태그 리스트가 로드됩니다.
                      </p>
                    </div>
                  ) : (
                    allEquipments
                      .find((e) => e.id === tempSelection.eqId)
                      ?.sensors.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center gap-4 p-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl hover:border-indigo-500/40 hover:bg-slate-800/60 transition-all cursor-pointer group"
                        >
                          <div className="w-5 h-5 rounded border border-slate-600 flex items-center justify-center group-hover:border-indigo-500 transition-colors">
                            <div className="w-3 h-3 bg-indigo-500 rounded-sm opacity-0 group-hover:opacity-30" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[11px] text-slate-300 font-mono leading-none mb-1">
                              {s.label}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-slate-500 font-bold uppercase">
                                {s.unit}
                              </span>
                              <span className="w-1 h-1 bg-slate-700 rounded-full" />
                              <span className="text-[9px] text-indigo-400/70 font-bold">
                                ANALOG_INPUT
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                    Database Sync
                  </span>
                  <span className="text-xs text-slate-300">
                    Ready to Map {allEquipments.length * 50} Tags
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={closeEquipmentModal}
                  className="px-8 py-3 rounded-xl bg-slate-800 text-slate-400 font-bold hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={applyEquipmentRegistration}
                  className="px-10 py-3 rounded-xl bg-emerald-600 text-white font-black hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                >
                  Apply & Register
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}