import { useCallback, useEffect, useState, useRef, type Dispatch, type SetStateAction } from "react";
import { getEquipmentCurrent, getMyEquipmentCurrent, searchEquipmentSensors, searchMyEquipment } from "../api/client";
import type { EquipmentCurrentResponse, EquipmentResponse, SensorResponse } from "../api/client";
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

const mapEquipmentToMaster = (equipment: UniversalEquipment): EquipmentMaster => ({
  id: equipment.id,
  name: equipment.name,
  type: equipment.type,
  sensors: equipment.sensors.map((sensor, index) => ({
    id: sensor.sensorId ?? `${equipment.id}-sensor-${index}`,
    label: sensor.sensorId ?? sensor.label,
    unit: sensor.unit,
    dataType: sensor.dataType,
  })),
});

const mapEquipmentResponseToMaster = (equipment: EquipmentResponse): EquipmentMaster => ({
  id: String(equipment.equipmentId),
  name: equipment.equipmentName,
  type: equipment.field ?? "UNKNOWN",
  sensors: [],
  sensorsLoaded: false,
});

const mapSensorResponseToMeta = (sensor: SensorResponse) => ({
  id: String(sensor.sensorId),
  label: sensor.sensorName,
  unit: "",
});

const normalizeSensorValue = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (value && typeof value === "object") {
    const payload = value as Record<string, unknown>;

    return normalizeSensorValue(
      payload.value ?? payload.currentValue ?? payload.numericValue ?? payload.data,
    );
  }

  const numericText = String(value ?? "").replace(/,/g, "").match(/-?\d+(\.\d+)?/)?.[0] ?? "";
  const numericValue = Number(numericText);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const getEquipmentStatus = (status?: string): UniversalEquipment["status"] => {
  if (status === "ERROR") return "DOWN";
  if (status === "IDLE") return "IDLE";
  if (status === "MAINTENANCE") return "MAINTENANCE";
  return "RUNNING";
};

const mapCurrentResponseToEquipment = (
  response: EquipmentCurrentResponse,
  fallback: UniversalEquipment,
): UniversalEquipment => {
  const sensors = (response.current?.sensors ?? []).map((sensor, index) => {
    const sensorId = sensor.sensorId ?? sensor.sensorName ?? sensor.name ?? `sensor-${index}`;
    const rawValue = sensor.value ?? sensor.currentValue ?? sensor.numericValue;

    return {
      sensorId,
      label: sensor.sensorName ?? sensor.name ?? sensorId,
      value: normalizeSensorValue(rawValue),
      unit: sensor.unit ?? "",
      dataType: sensor.dataType,
      status: response.current?.status === "ERROR" ? "CRITICAL" as const : "NORMAL" as const,
    };
  });

  if (sensors.length === 0) {
    console.warn("[Equipment Current] Current response has no sensors", response);
  }

  return {
    ...fallback,
    id: String(response.equipmentId),
    name: response.equipmentName,
    type: response.field ?? fallback.type,
    status: getEquipmentStatus(response.current?.status),
    lastUpdate: response.current?.timestamp ?? new Date().toISOString(),
    sensors,
  };
};

// useDashboardState 훅 정의
export function useDashboardState({
  mockData,
  initialLayouts,
  alertsData,
}: UseDashboardStateParams) {
  const [allEquipments, setAllEquipments] = useState<EquipmentMaster[]>([]);

  const [isEqModalOpen, setIsEqModalOpen] = useState(false);
  const [equipment, setEquipmentState] = useState<UniversalEquipment>(mockData);
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
  const [isNetworkScanning, setIsNetworkScanning] = useState(false);
  const [loadingSensorEquipmentId, setLoadingSensorEquipmentId] = useState<string | null>(null);

  const [autoArrange, setAutoArrange] = useState(true);
  const skipNextLayoutChange = useRef(false);

  const upsertEquipmentMaster = useCallback((nextEquipment: UniversalEquipment) => {
    const nextMaster = mapEquipmentToMaster(nextEquipment);

    setAllEquipments((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === nextMaster.id);

      if (existingIndex === -1) {
        return [...prev, nextMaster];
      }

      return prev.map((item, index) => (index === existingIndex ? nextMaster : item));
    });
  }, []);

  const setEquipment: Dispatch<SetStateAction<UniversalEquipment>> = useCallback((value) => {
    setEquipmentState((prev) => {
      const nextEquipment = typeof value === "function" ? value(prev) : value;
      upsertEquipmentMaster(nextEquipment);
      return nextEquipment;
    });
  }, [upsertEquipmentMaster]);

  const applyCurrentEquipment = useCallback((response: EquipmentCurrentResponse) => {
    setEquipment((prev) => mapCurrentResponseToEquipment(response, prev));
  }, [setEquipment]);

  const loadEquipmentCurrent = useCallback(async (equipmentId: string | number) => {
    try {
      const response = await getEquipmentCurrent(equipmentId);

      if (response.data) {
        applyCurrentEquipment(response.data);
      }
    } catch (error) {
      console.error("[Equipment Current] Failed to load equipment current", error);
    }
  }, [applyCurrentEquipment]);

  const loadInitialEquipmentCurrent = useCallback(async () => {
    try {
      const response = await getMyEquipmentCurrent();
      const firstEquipment = response.data?.[0];

      if (firstEquipment) {
        applyCurrentEquipment(firstEquipment);
      }
    } catch (error) {
      console.error("[Equipment Current] Failed to load current sensor values", error);
    }
  }, [applyCurrentEquipment]);

  // 헤더 시계를 최신 상태로 유지
  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    void loadInitialEquipmentCurrent();

    const timer = window.setInterval(() => {
      void loadInitialEquipmentCurrent();
    }, 5000);

    return () => window.clearInterval(timer);
  }, [loadInitialEquipmentCurrent]);

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

    const equipment = allEquipments.find((e) => e.id === tempSelection.eqId);
    const eqName = equipment?.name || "";
    const sensor = equipment?.sensors.find((item) => item.label === tempSelection.sensorId);

    const isExist = selectedDataCart.some(
      (item) =>
        item.eqId === tempSelection.eqId && item.sensorId === tempSelection.sensorId
    );

    if (isExist) {
      alert("이미 장바구니에 담긴 데이터입니다!");
      return;
    }

    setSelectedDataCart((prev) => [
      ...prev,
      { ...tempSelection, eqName, dataType: sensor?.dataType },
    ]);
  };

  const removeSelectedSensorFromCart = (index: number) => {
    setSelectedDataCart((prev) => prev.filter((_, i) => i !== index));
  };

  const goToBuilderStep2 = () => {
    if (selectedDataCart.length === 0) {
      alert("최소 1개의 데이터를 담아주세요!");
      return;
    }
    const dataTypes = new Set(selectedDataCart.map((item) => item.dataType ?? "FLOAT"));
    const isMulti = selectedDataCart.length > 1;
    const isBooleanOnly = dataTypes.size === 1 && dataTypes.has("BOOLEAN");

    if (isMulti) {
      setNewWidgetConfig((prev) => ({ ...prev, type: "TREND" }));
    } else if (isBooleanOnly) {
      setNewWidgetConfig((prev) => ({ ...prev, type: "STATUS" }));
    } else {
      setNewWidgetConfig((prev) => ({ ...prev, type: "GAUGE" }));
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

  const loadEquipmentSensors = useCallback(async (equipmentId: string | number, keyword = "", force = false) => {
    const equipmentKey = String(equipmentId);
    const currentEquipment = allEquipments.find((item) => item.id === equipmentKey);

    if (!force && !keyword && currentEquipment?.sensorsLoaded) {
      return currentEquipment.sensors;
    }

    setLoadingSensorEquipmentId(equipmentKey);

    try {
      const sensorsResponse = await searchEquipmentSensors(equipmentId, keyword);
      const sensors = (sensorsResponse.data ?? []).map(mapSensorResponseToMeta);

      setAllEquipments((prev) =>
        prev.map((item) =>
          item.id === equipmentKey
            ? {
              ...item,
              sensors,
              sensorsLoaded: true,
            }
            : item,
        ),
      );

      return sensors;
    } catch (error) {
      console.error("[Sensors] Failed to load equipment sensors", error);
      alert(error instanceof Error ? error.message : "센서 목록을 불러오지 못했습니다.");
      return [];
    } finally {
      setLoadingSensorEquipmentId((prev) => (prev === equipmentKey ? null : prev));
    }
  }, [allEquipments]);

  const selectEquipmentForDiscovery = useCallback((equipmentId: string) => {
    setTempSelection({ eqId: equipmentId, sensorId: "" });

    if (equipmentId) {
      void loadEquipmentSensors(equipmentId);
      void loadEquipmentCurrent(equipmentId);
    }
  }, [loadEquipmentCurrent, loadEquipmentSensors]);

  const startNetworkScan = async () => {
    setIsNetworkScanning(true);

    try {
      const equipmentResponse = await searchMyEquipment();
      const equipments = equipmentResponse.data ?? [];
      const equipmentMasters = equipments.map(mapEquipmentResponseToMaster);

      setAllEquipments(equipmentMasters);
      setTempSelection((prev) => {
        if (!prev.eqId || equipmentMasters.some((item) => item.id === prev.eqId)) {
          return prev;
        }

        return { eqId: "", sensorId: "" };
      });

      if (tempSelection.eqId && equipmentMasters.some((item) => item.id === tempSelection.eqId)) {
        void loadEquipmentSensors(tempSelection.eqId, "", true);
      }
    } catch (error) {
      console.error("[Network Scan] Failed to load equipment", error);
      alert(error instanceof Error ? error.message : "장비 목록을 불러오지 못했습니다.");
    } finally {
      setIsNetworkScanning(false);
    }
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
    isNetworkScanning,
    loadingSensorEquipmentId,
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
    loadEquipmentCurrent,
    loadEquipmentSensors,
    selectEquipmentForDiscovery,
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
