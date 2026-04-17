import { useEffect, useState, useRef } from "react";
import type { UniversalEquipment } from "../types/equipment";
import type {
  DashboardItem,
  DashboardWidgetType,
  EquipmentMaster,
  AlertItem,
  SelectedData,
} from "../types/dashboard";
import type { Layout, ResponsiveLayouts } from "react-grid-layout";

const DASHBOARD_LAYOUT_STORAGE_KEY = "myFoundryDashboard";
export type DashboardBreakpoint = "lg" | "md" | "sm";
export type DashboardLayouts = Partial<Record<DashboardBreakpoint, DashboardItem[]>>;

export const DASHBOARD_BREAKPOINTS: Record<DashboardBreakpoint, number> = {
  lg: 1200,
  md: 996,
  sm: 768,
};

export const DASHBOARD_COLS: Record<DashboardBreakpoint, number> = {
  lg: 12,
  md: 10,
  sm: 6,
};

const DASHBOARD_BREAKPOINT_KEYS: DashboardBreakpoint[] = ["lg", "md", "sm"];

// 대시보드 상태 관리를 위한 커스텀 훅
type WidgetConfig = {
  type: DashboardWidgetType;
  dataKey: string;
  title: string;
};

// useDashboardState 훅의 파라미터 타입 정의
type UseDashboardStateParams = {
  mockData: UniversalEquipment;
  initialLayouts: DashboardLayouts;
  alertsData: AlertItem[];
};

const isDashboardItemArray = (value: unknown): value is DashboardItem[] => {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item === "object" &&
        "i" in item &&
        "x" in item &&
        "y" in item &&
        "w" in item &&
        "h" in item,
    )
  );
};

const normalizeStoredLayouts = (
  stored: unknown,
  fallback: DashboardLayouts,
): DashboardLayouts => {
  if (isDashboardItemArray(stored)) {
    return { lg: stored };
  }

  if (!stored || typeof stored !== "object") {
    return { lg: fallback.lg ?? [] };
  }

  const next: DashboardLayouts = {};

  DASHBOARD_BREAKPOINT_KEYS.forEach((breakpoint) => {
    const value = (stored as Record<string, unknown>)[breakpoint];
    if (isDashboardItemArray(value)) {
      next[breakpoint] = value;
    }
  });

  return next.lg ? next : { lg: fallback.lg ?? [] };
};

const getBaseLayout = (layouts: DashboardLayouts, fallback: DashboardLayouts) => {
  return layouts.lg ?? fallback.lg ?? [];
};

const mergeLayoutMetadata = (
  sourceItems: DashboardItem[],
  layout: Layout,
): DashboardItem[] => {
  return sourceItems.map((widget) => {
    const found = layout.find((item) => item.i === widget.i);

    return found
      ? {
        ...widget,
        x: found.x,
        y: found.y,
        w: found.w,
        h: found.h,
        static: found.static ?? widget.static,
        isDraggable: found.isDraggable ?? widget.isDraggable,
        isResizable: found.isResizable ?? widget.isResizable,
      }
      : widget;
  });
};

// useDashboardState 훅 정의
export function useDashboardState({
  mockData,
  initialLayouts,
  alertsData,
}: UseDashboardStateParams) {
  const [allEquipments, setAllEquipments] = useState<EquipmentMaster[]>([
    {
      id: mockData.id,
      name: mockData.name,
      type: mockData.type,
      sensors: mockData.sensors.map((s, index) => ({
        id: `sns-mock-${index}`,
        label: s.label,
        unit: s.unit,
      })),
    },
  ]);

  const [isEqModalOpen, setIsEqModalOpen] = useState(false);
  const [equipment, setEquipment] = useState<UniversalEquipment>(mockData);
  const [alerts] = useState(alertsData);
  const [time, setTime] = useState(new Date());

  const [responsiveLayouts, setResponsiveLayouts] = useState<DashboardLayouts>(() => {
    try {
      const savedLayout = localStorage.getItem(DASHBOARD_LAYOUT_STORAGE_KEY);
      if (!savedLayout) return { lg: initialLayouts.lg ?? [] };

      const parsed = JSON.parse(savedLayout);
      return normalizeStoredLayouts(parsed, initialLayouts);
    } catch (e) {
      console.error("Layout 로딩 실패:", e);
      return { lg: initialLayouts.lg ?? [] };
    }
  });
  const [currentBreakpoint, setCurrentBreakpoint] = useState<DashboardBreakpoint>("lg");
  const layouts = getBaseLayout(responsiveLayouts, initialLayouts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWidgetConfig, setNewWidgetConfig] = useState<WidgetConfig>({
    type: "GAUGE",
    dataKey: "Temperature",
    title: "New Widget",
  });

  const [builderStep, setBuilderStep] = useState<1 | 2>(1);
  const [selectedDataCart, setSelectedDataCart] = useState<SelectedData[]>([]);
  const [tempSelection, setTempSelection] = useState({ eqId: "", sensorId: "" });
  const [searchTerm, setSearchTerm] = useState("");

  const [autoArrange, setAutoArrange] = useState(true);
  const skipNextLayoutChange = useRef(false);

  // 헤더 시계를 최신 상태로 유지
  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // 레이아웃이 변경될 때마다 로컬 스토리지에 저장
  useEffect(() => {
    if (layouts.length > 0) {
      localStorage.setItem(DASHBOARD_LAYOUT_STORAGE_KEY, JSON.stringify(responsiveLayouts));
    }
  }, [layouts.length, responsiveLayouts]);

  const compactWidgets = (items: DashboardItem[], cols = 12) => {
    const pinned = items.filter(item => item.pinned);
    const movable = items.filter(item => !item.pinned);

    const occupied = new Set<string>();

    const markOccupied = (x: number, y: number, w: number, h: number) => {
      for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
          occupied.add(`${x + dx},${y + dy}`);
        }
      }
    };

    const canPlace = (x: number, y: number, w: number, h: number) => {
      if (x + w > cols) return false;

      for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
          if (occupied.has(`${x + dx},${y + dy}`)) return false;
        }
      }
      return true;
    };

    // pinned 자리 먼저 점유
    pinned.forEach(item => {
      markOccupied(item.x, item.y, item.w, item.h);
    });

    // movable만 재배치
    const reorderedMovable = [...movable]
      .sort((a, b) => (a.y - b.y) || (a.x - b.x))
      .map(item => {
        for (let y = 0; y < 1000; y++) {
          for (let x = 0; x < cols; x++) {
            if (canPlace(x, y, item.w, item.h)) {
              const placed = { ...item, x, y };
              markOccupied(x, y, item.w, item.h);
              return placed;
            }
          }
        }
        return item;
      });

    return [...pinned, ...reorderedMovable];
  };

  const updateLayouts = (
    updater: (
      items: DashboardItem[],
      breakpoint: DashboardBreakpoint,
    ) => DashboardItem[],
  ) => {
    setResponsiveLayouts((prev) => {
      const base = getBaseLayout(prev, initialLayouts);
      const next: DashboardLayouts = {};

      DASHBOARD_BREAKPOINT_KEYS.forEach((breakpoint) => {
        next[breakpoint] = updater(prev[breakpoint] ?? base, breakpoint);
      });

      return next;
    });
  };

  const setLayouts = (
    value: DashboardItem[] | ((previous: DashboardItem[]) => DashboardItem[]),
  ) => {
    setResponsiveLayouts((prev) => {
      const previous = getBaseLayout(prev, initialLayouts);
      const nextLg = typeof value === "function" ? value(previous) : value;
      return { ...prev, lg: nextLg };
    });
  };

  const removeWidget = (widgetId: string) => {
    updateLayouts((items, breakpoint) => {
      const next = items.filter((item) => item.i !== widgetId);
      return autoArrange ? compactWidgets(next, DASHBOARD_COLS[breakpoint]) : next;
    });
  };
  
  const applyLayout = (
    currentLayout: Layout,
    shouldCompact = false,
    breakpoint: DashboardBreakpoint = currentBreakpoint,
  ) => {
    setResponsiveLayouts((prev) => {
      const base = getBaseLayout(prev, initialLayouts);
      const source = prev[breakpoint] ?? base;
      const updated = mergeLayoutMetadata(source, currentLayout);

      return {
        ...prev,
        [breakpoint]: shouldCompact
          ? compactWidgets(updated, DASHBOARD_COLS[breakpoint])
          : updated,
      };
    });
  };

  // 대시보드 레이아웃 변경 핸들러
  const handleLayoutChange = (
    currentLayout: Layout,
    allLayouts?: ResponsiveLayouts<DashboardBreakpoint>,
  ) => {
    if (skipNextLayoutChange.current) {
      skipNextLayoutChange.current = false;
      return;
    }

    if (allLayouts) {
      setResponsiveLayouts((prev) => {
        const base = getBaseLayout(prev, initialLayouts);
        const next: DashboardLayouts = { ...prev };

        DASHBOARD_BREAKPOINT_KEYS.forEach((breakpoint) => {
          const layout = allLayouts[breakpoint];
          if (!layout) return;
          next[breakpoint] = mergeLayoutMetadata(prev[breakpoint] ?? base, layout);
        });

        return next;
      });
      return;
    }

    applyLayout(currentLayout, false);
  };

  const arrangeWidgets = () => {
    updateLayouts((items, breakpoint) => compactWidgets(items, DASHBOARD_COLS[breakpoint]));
  };

  // 위젯 빌더 초기화 함수
  const resetWidgetBuilder = () => {
    setIsModalOpen(false);
    setBuilderStep(1);
    setSelectedDataCart([]);
    setTempSelection({ eqId: "", sensorId: "" });
    setSearchTerm("");
  };

  // 선택된 센서를 장바구니에 추가하는 함수
  const addSelectedSensorToCart = () => {
    if (!tempSelection.eqId || !tempSelection.sensorId) {
      alert("장비와 센서를 모두 선택해주세요!");
      return;
    }

    const eqName = allEquipments.find((e) => e.id === tempSelection.eqId)?.name || "";

    const isExist = selectedDataCart.some(
      (item) =>
        item.eqId === tempSelection.eqId && item.sensorId === tempSelection.sensorId
    );

    if (isExist) {
      alert("이미 장바구니에 담긴 데이터입니다!");
      return;
    }

    setSelectedDataCart((prev) => [...prev, { ...tempSelection, eqName }]);
  };

  const removeSelectedSensorFromCart = (index: number) => {
    setSelectedDataCart((prev) => prev.filter((_, i) => i !== index));
  };

  const goToBuilderStep2 = () => {
    if (selectedDataCart.length === 0) {
      alert("최소 1개의 데이터를 담아주세요!");
      return;
    }
    setBuilderStep(2);
  };

  const addWidgetToDashboard = () => {
    if (selectedDataCart.length === 0) return;

    const newId = `widget-${Date.now()}`;
    const keysToSave =
      selectedDataCart.length > 1
        ? selectedDataCart.map((item) => item.sensorId)
        : selectedDataCart[0].sensorId;

    const newItem: DashboardItem = {
      i: newId,
      type: newWidgetConfig.type,
      dataKey: keysToSave,
      title:
        selectedDataCart.length > 1
          ? `다중 비교 (${selectedDataCart.length}개)`
          : `${selectedDataCart[0].sensorId} ${newWidgetConfig.type}`,
      color: "bg-indigo-500",
      x: (layouts.length * 4) % 12,
      y: Infinity,
      w: newWidgetConfig.type === "TREND" ? 8 : 4,
      h: 2,
    };

    updateLayouts((items) => [...items, newItem]);
    resetWidgetBuilder();
  };

  const generateMassiveMockData = (): EquipmentMaster[] => {
    const massiveData: EquipmentMaster[] = [];
    const types = ["CVD", "ETCH", "PVD", "DIFFUSION", "CLEANING"];

    for (let i = 1; i <= 100; i++) {
      const type = types[i % types.length];
      massiveData.push({
        id: `EQ-${String(i).padStart(3, "0")}`,
        name: `${type} System-${String(i).padStart(3, "0")}`,
        type,
        sensors: Array.from({ length: 50 }, (_, j) => {
          const dataType =
            j % 3 === 0 ? "FLOAT" : j % 3 === 1 ? "BOOLEAN" : "INTEGER";

          let label = "";
          let unit = "";

          if (dataType === "FLOAT") {
            label = `Temp_Sensor_${j}`;
            unit = "°C";
          } else if (dataType === "BOOLEAN") {
            label = `Power_Status_${j}`;
            unit = "BOOL";
          } else {
            label = `Cycle_Count_${j}`;
            unit = "cnt";
          }

          return {
            id: `sns-${i}-${j}`,
            label,
            unit,
            dataType,
          };
        }),
      });
    }

    return massiveData;
  };

  const startNetworkScan = () => {
    setAllEquipments(generateMassiveMockData());
  };

  const closeEquipmentModal = () => {
    setIsEqModalOpen(false);
  };

  const applyEquipmentRegistration = () => {
    setIsEqModalOpen(false);
    alert("선택된 모든 자산과 태그가 성공적으로 동기화되었습니다.");
  };

  // 위젯 고정/고정 해제 함수
  const togglePinWidget = (widgetId: string) => {
    skipNextLayoutChange.current = true; // 다음 레이아웃 변경 이벤트를 무시하도록 설정

    updateLayouts((items) =>
      items.map((widget) =>
        widget.i === widgetId
          ? {
            ...widget,
            pinned: !widget.pinned,
            static: !widget.pinned,
          } : widget
      )
    );
  };

  return {
    allEquipments,
    alerts,
    autoArrange,
    time,
    equipment,
    layouts,
    responsiveLayouts,
    currentBreakpoint,
    isModalOpen,
    isEqModalOpen,
    newWidgetConfig,
    builderStep,
    selectedDataCart,
    tempSelection,
    searchTerm,

    setEquipment,
    setAutoArrange,
    setIsModalOpen,
    setIsEqModalOpen,
    setNewWidgetConfig,
    setBuilderStep,
    setTempSelection,
    setSearchTerm,
    setLayouts,
    setResponsiveLayouts,
    setCurrentBreakpoint,

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
    togglePinWidget,
    arrangeWidgets,
    compactWidgets,
    applyLayout,
  };
}

export type DashboardState = ReturnType<typeof useDashboardState>;
