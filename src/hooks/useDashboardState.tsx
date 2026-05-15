import { useCallback, useEffect, useState, useRef, type Dispatch, type SetStateAction } from "react";
import {
  applyEquipmentDiscovery,
  createDashboardWidget,
  deleteDashboardWidget,
  getDashboardEquipment,
  getEquipmentCurrent,
  getMyDashboards,
  getMyEquipmentCurrent,
  getMyWidgets,
  searchEquipmentSensors,
  searchMyEquipment,
  updateWidgetLayouts,
  type AppliedEquipment,
  type WidgetRequestDto,
  type WidgetResponseDto,
} from "../api/client";
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

const DASHBOARD_AUTOSAVE_INTERVAL_MS = 30000;
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
  alertsData: AlertItem[];
};

const EMPTY_EQUIPMENT: UniversalEquipment = {
  id: "",
  name: "No equipment",
  type: "",
  status: "IDLE",
  lastUpdate: "",
  metrics: {
    oee: 0,
    availability: 0,
    performance: 0,
    quality: 0,
  },
  sensors: [],
};

const getBaseLayout = (layouts: DashboardLayouts) => {
  return layouts.lg ?? [];
};

const getServerWidgetId = (widget: DashboardItem) => {
  if (typeof widget.serverWidgetId === "number") return widget.serverWidgetId;

  const numericId = Number(widget.i);
  return Number.isInteger(numericId) && numericId > 0 ? numericId : null;
};

const isDashboardWidgetType = (value: string): value is DashboardWidgetType => {
  return [
    "OEE",
    "SENSORS",
    "TREND",
    "ALERTS",
    "GAUGE",
    "DONUT",
    "STATUS",
    "LOG",
    "BAR_V",
    "BAR_H",
  ].includes(value);
};

const parseWidgetConfig = (configJson?: string) => {
  if (!configJson) return {};

  try {
    const parsed = JSON.parse(configJson);
    return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
};

const mapWidgetResponseToDashboardItem = (widget: WidgetResponseDto): DashboardItem => {
  const config = parseWidgetConfig(widget.configJson);
  const type = isDashboardWidgetType(widget.widgetType) ? widget.widgetType : "GAUGE";
  const configDataKey = config.dataKey;
  const serverDataKey = widget.equipmentEntityId && widget.sensorEntityId
    ? buildSensorDataKey(String(widget.equipmentEntityId), String(widget.sensorEntityId))
    : undefined;
  const dataKey =
    serverDataKey
      ? serverDataKey
      : Array.isArray(configDataKey)
      ? configDataKey.map(String)
      : typeof configDataKey === "string"
        ? configDataKey
        : widget.sensorId ?? widget.sensorName ?? widget.widgetType;

  return {
    i: String(widget.id),
    serverWidgetId: widget.id,
    equipmentEntityId: widget.equipmentEntityId,
    equipmentName: widget.equipmentName,
    sensorEntityId: widget.sensorEntityId,
    sensorId: widget.sensorId,
    sensorName: widget.sensorName,
    type,
    title: widget.title,
    dataKey,
    color: typeof config.color === "string" ? config.color : "bg-indigo-500",
    pinned: typeof config.pinned === "boolean" ? config.pinned : false,
    static: typeof config.pinned === "boolean" ? config.pinned : false,
    x: widget.posX,
    y: widget.posY,
    w: widget.width,
    h: widget.height,
  };
};

const toNumberId = (value: string) => {
  const numericId = Number(value);
  return Number.isInteger(numericId) && numericId > 0 ? numericId : undefined;
};

const getChartType = (type: DashboardWidgetType) => {
  switch (type) {
    case "TREND":
      return "line";
    case "BAR_V":
    case "BAR_H":
      return "bar";
    case "DONUT":
      return "donut";
    case "GAUGE":
      return "gauge";
    default:
      return type.toLowerCase();
  }
};

const buildWidgetCreateRequest = (
  dashboardId: number,
  item: DashboardItem,
  selectedData: SelectedData[],
): WidgetRequestDto => {
  const primaryData = selectedData[0];
  const equipmentEntityId = primaryData ? toNumberId(primaryData.eqId) : undefined;
  const sensorEntityId = primaryData ? toNumberId(primaryData.sensorId) : undefined;

  if (!equipmentEntityId || !sensorEntityId) {
    throw new Error("장비/센서 엔티티 ID를 확인할 수 없습니다.");
  }

  return {
    dashboardId,
    equipmentEntityId,
    widgetType: item.type,
    title: item.title,
    sensorEntityId,
    chartType: getChartType(item.type),
    dataType: primaryData?.dataType,
    posX: item.x,
    posY: Number.isFinite(item.y) ? item.y : 0,
    width: item.w,
    height: item.h,
    configJson: JSON.stringify({
      dataKey: item.dataKey,
      color: item.color,
      pinned: item.pinned ?? false,
      selectedData,
    }),
  };
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

const mapAppliedEquipmentToMaster = (item: AppliedEquipment): EquipmentMaster => ({
  ...mapEquipmentResponseToMaster(item.equipment),
  sensors: item.sensors.map(mapSensorResponseToMeta),
  sensorsLoaded: true,
});

const buildSensorDataKey = (equipmentId: string, sensorId: string) => `${equipmentId}::${sensorId}`;

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

const getSensorMergeKey = (sensor: { sensorId?: string; label: string }) => sensor.sensorId ?? sensor.label;

const mergeSensorData = (
  previousSensors: UniversalEquipment["sensors"],
  nextSensors: UniversalEquipment["sensors"],
) => {
  const sensorByKey = new Map(previousSensors.map((sensor) => [getSensorMergeKey(sensor), sensor]));

  nextSensors.forEach((sensor) => {
    sensorByKey.set(getSensorMergeKey(sensor), sensor);
  });

  return Array.from(sensorByKey.values());
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
  } else {
    console.debug("[Equipment Current] Sensor payload received", {
      equipmentId: response.equipmentId,
      sensorCount: sensors.length,
      sensorIds: sensors.map((sensor) => sensor.sensorId ?? sensor.label),
    });
  }

  return {
    ...fallback,
    id: String(response.equipmentId),
    name: response.equipmentName,
    type: response.field ?? fallback.type,
    status: getEquipmentStatus(response.current?.status),
    lastUpdate: response.current?.timestamp ?? new Date().toISOString(),
    sensors: mergeSensorData(fallback.sensors, sensors),
  };
};

// useDashboardState 훅 정의
export function useDashboardState({
  alertsData,
}: UseDashboardStateParams) {
  const [allEquipments, setAllEquipments] = useState<EquipmentMaster[]>([]);

  const [isEqModalOpen, setIsEqModalOpen] = useState(false);
  const [equipment, setEquipmentState] = useState<UniversalEquipment>(EMPTY_EQUIPMENT);
  const [equipmentById, setEquipmentById] = useState<Record<string, UniversalEquipment>>({});
  const [alerts] = useState(alertsData);
  const [time, setTime] = useState(new Date());
  const [dashboardId, setDashboardId] = useState<number | null>(null);
  const [isLoadingDashboardWidgets, setIsLoadingDashboardWidgets] = useState(false);

  const [responsiveLayouts, setResponsiveLayouts] = useState<DashboardLayouts>({ lg: [] });
  const [currentBreakpoint, setCurrentBreakpoint] = useState<DashboardBreakpoint>("lg");
  const layouts = getBaseLayout(responsiveLayouts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWidgetConfig, setNewWidgetConfig] = useState<WidgetConfig>({
    type: "GAUGE",
    dataKey: "",
    title: "New Widget",
  });

  const [builderStep, setBuilderStep] = useState<1 | 2>(1);
  const [selectedDataCart, setSelectedDataCart] = useState<SelectedData[]>([]);
  const [tempSelection, setTempSelection] = useState({ eqId: "", sensorId: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [isNetworkScanning, setIsNetworkScanning] = useState(false);
  const [loadingSensorEquipmentId, setLoadingSensorEquipmentId] = useState<string | null>(null);

  const [autoArrange, setAutoArrange] = useState(true);
  const [isDashboardDirty, setIsDashboardDirty] = useState(false);
  const [isSavingDashboard, setIsSavingDashboard] = useState(false);
  const [lastDashboardSavedAt, setLastDashboardSavedAt] = useState<Date | null>(null);
  const [dashboardSaveError, setDashboardSaveError] = useState<string | null>(null);
  const skipNextLayoutChange = useRef(false);
  const pendingDeletedWidgetIds = useRef<Set<number>>(new Set());

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
      setEquipmentById((previous) => ({
        ...previous,
        [nextEquipment.id]: nextEquipment,
      }));
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
      const equipments = response.data ?? [];

      if (equipments.length > 0) {
        equipments.forEach(applyCurrentEquipment);
      }
    } catch (error) {
      console.error("[Equipment Current] Failed to load current sensor values", error);
    }
  }, [applyCurrentEquipment]);

  const loadDashboardWidgets = useCallback(async () => {
    setIsLoadingDashboardWidgets(true);
    setDashboardSaveError(null);

    try {
      const dashboardsResponse = await getMyDashboards();
      const dashboard = dashboardsResponse.data?.[0];

      if (!dashboard) {
        return;
      }

      setDashboardId(dashboard.dashboardId);

      const widgetsResponse = await getMyWidgets();
      const widgets = widgetsResponse.data ?? [];

      const serverLayout = widgets.map(mapWidgetResponseToDashboardItem);
      setResponsiveLayouts({ lg: serverLayout });
      setIsDashboardDirty(false);
      pendingDeletedWidgetIds.current.clear();
    } catch (error) {
      console.error("[Dashboard Load] Failed to load dashboard widgets", error);
      setDashboardSaveError(error instanceof Error ? error.message : "대시보드 위젯을 불러오지 못했습니다.");
    } finally {
      setIsLoadingDashboardWidgets(false);
    }
  }, []);

  // 헤더 시계를 최신 상태로 유지
  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    void loadDashboardWidgets();
  }, [loadDashboardWidgets]);

  useEffect(() => {
    void loadInitialEquipmentCurrent();

    const timer = window.setInterval(() => {
      void loadInitialEquipmentCurrent();
    }, 5000);

    return () => window.clearInterval(timer);
  }, [loadInitialEquipmentCurrent]);

  const saveDashboardState = useCallback(async () => {
    setIsSavingDashboard(true);
    setDashboardSaveError(null);

    try {
      const deletedWidgetIds = Array.from(pendingDeletedWidgetIds.current);

      for (const widgetId of deletedWidgetIds) {
        await deleteDashboardWidget(widgetId);
      }

      const layoutsForSave = getBaseLayout(responsiveLayouts);

      const layoutItems = layoutsForSave
        .map((widget) => {
          const widgetId = getServerWidgetId(widget);

          if (!widgetId) return null;

          return {
            widgetId,
            posX: widget.x,
            posY: Number.isFinite(widget.y) ? widget.y : 0,
            width: widget.w,
            height: widget.h,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      console.info("[Dashboard Save] Saving widget layouts", {
        layoutCount: layoutItems.length,
        skippedLocalWidgetCount: layoutsForSave.length - layoutItems.length,
        deletedWidgetCount: deletedWidgetIds.length,
      });

      if (layoutItems.length === 0) {
        deletedWidgetIds.forEach((widgetId) => pendingDeletedWidgetIds.current.delete(widgetId));
        setIsDashboardDirty(false);
        setLastDashboardSavedAt(new Date());
        return true;
      }

      await updateWidgetLayouts({ layouts: layoutItems });
      deletedWidgetIds.forEach((widgetId) => pendingDeletedWidgetIds.current.delete(widgetId));
      setIsDashboardDirty(false);
      setLastDashboardSavedAt(new Date());
      return true;
    } catch (error) {
      console.error("[Dashboard Save] Failed to save widget layout", error);
      setDashboardSaveError(error instanceof Error ? error.message : "대시보드 저장에 실패했습니다.");
      return false;
    } finally {
      setIsSavingDashboard(false);
    }
  }, [responsiveLayouts]);

  useEffect(() => {
    if (!isDashboardDirty || isSavingDashboard) return;

    const timer = window.setTimeout(() => {
      void saveDashboardState();
    }, DASHBOARD_AUTOSAVE_INTERVAL_MS);

    return () => window.clearTimeout(timer);
  }, [isDashboardDirty, isSavingDashboard, saveDashboardState]);

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
    setIsDashboardDirty(true);
    setResponsiveLayouts((prev) => {
      const base = getBaseLayout(prev);
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
    setIsDashboardDirty(true);
    setResponsiveLayouts((prev) => {
      const previous = getBaseLayout(prev);
      const nextLg = typeof value === "function" ? value(previous) : value;
      return { ...prev, lg: nextLg };
    });
  };

  const removeWidget = (widgetId: string) => {
    const widget = layouts.find((item) => item.i === widgetId);
    const serverWidgetId = widget ? getServerWidgetId(widget) : null;

    if (serverWidgetId) {
      pendingDeletedWidgetIds.current.add(serverWidgetId);
    }

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
    setIsDashboardDirty(true);
    setResponsiveLayouts((prev) => {
      const base = getBaseLayout(prev);
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
      setIsDashboardDirty(true);
      setResponsiveLayouts((prev) => {
        const base = getBaseLayout(prev);
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
    const sensor = equipment?.sensors.find((item) => item.id === tempSelection.sensorId);
    const sensorKey = buildSensorDataKey(tempSelection.eqId, tempSelection.sensorId);

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
      {
        ...tempSelection,
        eqName,
        sensorLabel: sensor?.label ?? tempSelection.sensorId,
        sensorKey,
        dataType: sensor?.dataType,
      },
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
    const numericTypes = new Set(["FLOAT", "DOUBLE", "INTEGER", "INT"]);
    const isNumericOnly = [...dataTypes].every((dataType) => numericTypes.has(dataType));

    if (isMulti && isNumericOnly) {
      setNewWidgetConfig((prev) => ({ ...prev, type: "TREND" }));
    } else if (isMulti && isBooleanOnly) {
      setNewWidgetConfig((prev) => ({ ...prev, type: "DONUT" }));
    } else if (isBooleanOnly) {
      setNewWidgetConfig((prev) => ({ ...prev, type: "STATUS" }));
    } else if (isNumericOnly) {
      setNewWidgetConfig((prev) => ({ ...prev, type: "GAUGE" }));
    } else {
      setNewWidgetConfig((prev) => ({ ...prev, type: "LOG" }));
    }
    setBuilderStep(2);
  };

  const ensureSelectedDataEntityIds = async (items: SelectedData[]) => {
    const hasEntityIds = items.every((item) => toNumberId(item.eqId) && toNumberId(item.sensorId));

    if (hasEntityIds) {
      return items;
    }

    if (!dashboardId) {
      throw new Error("대시보드를 불러온 뒤 위젯을 추가할 수 있습니다.");
    }

    const assets = Array.from(
      items.reduce((map, item) => {
        const equipment = allEquipments.find((candidate) => candidate.id === item.eqId);
        const current = map.get(item.eqName) ?? {
          equipmentName: item.eqName,
          field: equipment?.type,
          tags: [] as { sensorName: string }[],
        };
        const sensorName = item.sensorLabel ?? item.sensorId;

        if (!current.tags.some((tag) => tag.sensorName === sensorName)) {
          current.tags.push({ sensorName });
        }

        map.set(item.eqName, current);
        return map;
      }, new Map<string, { equipmentName: string; field?: string; tags: { sensorName: string }[] }>()),
      ([, asset]) => asset,
    );

    const response = await applyEquipmentDiscovery({
      dashboardId,
      assets,
    });
    const appliedEquipment = response.data?.equipment ?? [];
    const nextEquipments = appliedEquipment.map(mapAppliedEquipmentToMaster);

    if (nextEquipments.length > 0) {
      setAllEquipments((prev) => {
        const byId = new Map(prev.map((equipment) => [equipment.id, equipment]));
        nextEquipments.forEach((equipment) => byId.set(equipment.id, equipment));
        return Array.from(byId.values());
      });
    }

    return items.map((item) => {
      const applied = appliedEquipment.find(
        (candidate) => candidate.equipment.equipmentName === item.eqName,
      );
      const sensor = applied?.sensors.find(
        (candidate) => candidate.sensorName === (item.sensorLabel ?? item.sensorId),
      );

      if (!applied || !sensor) {
        throw new Error(`"${item.eqName} - ${item.sensorLabel ?? item.sensorId}" 엔티티 ID를 확인할 수 없습니다.`);
      }

      const eqId = String(applied.equipment.equipmentId);
      const sensorId = String(sensor.sensorId);

      return {
        ...item,
        eqId,
        sensorId,
        sensorKey: buildSensorDataKey(eqId, sensorId),
      };
    });
  };

  const addWidgetToDashboard = async () => {
    if (selectedDataCart.length === 0) return;
    if (!dashboardId) {
      setDashboardSaveError("대시보드를 불러온 뒤 위젯을 추가할 수 있습니다.");
      return;
    }

    const newId = `widget-${Date.now()}`;
    let selectedDataForCreate = selectedDataCart;

    try {
      selectedDataForCreate = await ensureSelectedDataEntityIds(selectedDataCart);
      setSelectedDataCart(selectedDataForCreate);
    } catch (error) {
      console.error("[Dashboard Widget] Failed to resolve entity ids", error);
      setDashboardSaveError(error instanceof Error ? error.message : "장비/센서 엔티티 ID를 확인할 수 없습니다.");
      return;
    }

    const keysToSave =
      selectedDataForCreate.length > 1
        ? selectedDataForCreate.map((item) => item.sensorKey ?? buildSensorDataKey(item.eqId, item.sensorId))
        : selectedDataForCreate[0].sensorKey ?? buildSensorDataKey(selectedDataForCreate[0].eqId, selectedDataForCreate[0].sensorId);

    const newItem: DashboardItem = {
      i: newId,
      type: newWidgetConfig.type,
      dataKey: keysToSave,
      title:
        selectedDataForCreate.length > 1
          ? `다중 비교 (${selectedDataForCreate.length}개)`
          : `${selectedDataForCreate[0].eqName} - ${selectedDataForCreate[0].sensorLabel ?? selectedDataForCreate[0].sensorId}`,
      color: "bg-indigo-500",
      x: (layouts.length * 4) % 12,
      y: Infinity,
      w: newWidgetConfig.type === "TREND" ? 8 : 4,
      h: 2,
    };

    setIsSavingDashboard(true);
    setDashboardSaveError(null);

    try {
      const createRequest = buildWidgetCreateRequest(dashboardId, newItem, selectedDataForCreate);
      console.info("[Dashboard Widget] Creating widget", createRequest);

      const response = await createDashboardWidget(
        dashboardId,
        createRequest,
      );

      if (!response.data) {
        throw new Error("위젯 생성 응답이 비어 있습니다.");
      }

      const createdItem = mapWidgetResponseToDashboardItem(response.data);
      updateLayouts((items) => [...items, createdItem]);
      setLastDashboardSavedAt(new Date());
      setIsDashboardDirty(false);
      resetWidgetBuilder();
    } catch (error) {
      console.error("[Dashboard Widget] Failed to create widget", error);
      setDashboardSaveError(error instanceof Error ? error.message : "위젯 생성에 실패했습니다.");
    } finally {
      setIsSavingDashboard(false);
    }
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
      const dashboardEquipmentResponse = dashboardId
        ? await getDashboardEquipment(dashboardId)
        : undefined;
      const dashboardEquipments = dashboardEquipmentResponse?.data ?? [];
      const equipmentResponse = dashboardEquipments.length > 0
        ? dashboardEquipmentResponse
        : await searchMyEquipment();
      const equipments = equipmentResponse?.data ?? [];
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

  const applyEquipmentRegistration = async () => {
    if (!dashboardId) {
      alert("대시보드를 불러온 뒤 장비를 등록할 수 있습니다.");
      return;
    }

    const assets = allEquipments.map((equipment) => ({
      equipmentName: equipment.name,
      field: equipment.type,
      tags: equipment.sensors.map((sensor) => ({
        sensorName: sensor.label || sensor.id,
      })),
    }));

    if (assets.length === 0) {
      alert("등록할 장비가 없습니다.");
      return;
    }

    setIsNetworkScanning(true);

    try {
      const response = await applyEquipmentDiscovery({
        dashboardId,
        assets,
      });
      const appliedEquipment = response.data?.equipment ?? [];
      const nextEquipments = appliedEquipment.map(mapAppliedEquipmentToMaster);

      if (nextEquipments.length > 0) {
        setAllEquipments(nextEquipments);
        setTempSelection((prev) => {
          if (!prev.eqId || nextEquipments.some((item) => item.id === prev.eqId)) {
            return prev;
          }

          return { eqId: "", sensorId: "" };
        });
      }

      setIsEqModalOpen(false);
      alert("선택된 모든 자산과 태그가 성공적으로 동기화되었습니다.");
    } catch (error) {
      console.error("[Equipment Discovery] Failed to apply equipment discovery", error);
      alert(error instanceof Error ? error.message : "장비 등록에 실패했습니다.");
    } finally {
      setIsNetworkScanning(false);
    }
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
    dashboardId,
    equipment,
    equipmentById,
    layouts,
    responsiveLayouts,
    currentBreakpoint,
    isModalOpen,
    isEqModalOpen,
    isNetworkScanning,
    isDashboardDirty,
    isSavingDashboard,
    isLoadingDashboardWidgets,
    loadingSensorEquipmentId,
    lastDashboardSavedAt,
    dashboardSaveError,
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
    saveDashboardState,
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
