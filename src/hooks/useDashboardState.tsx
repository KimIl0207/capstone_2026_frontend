import { useEffect, useState } from "react";
import type { UniversalEquipment } from "../types/equipment";
import type {
  DashboardItem,
  DashboardWidgetType,
  EquipmentMaster,
  SelectedData,
} from "../types/dashboard";
import type { Layout } from "react-grid-layout";

type WidgetConfig = {
  type: DashboardWidgetType;
  dataKey: string;
  title: string;
};

type UseDashboardStateParams = {
  mockData: UniversalEquipment;
  initialLayouts: Record<string, DashboardItem[]>;
  alertsData: any[];
};

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

  const [layouts, setLayouts] = useState<DashboardItem[]>(initialLayouts.lg);
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

  // useEffect(() => {
  //   const timer = setInterval(() => {
  //     setTime(new Date());
  //     setEquipment((prev) => ({
  //       ...prev,
  //       metrics: {
  //         ...prev.metrics,
  //         oee: Number((prev.metrics.oee + (Math.random() * 0.2 - 0.1)).toFixed(1)),
  //       },
  //       sensors: prev.sensors.map((s) => ({
  //         ...s,
  //         value: Number(
  //           (s.value + (Math.random() * 2 - 1)).toFixed(s.label === "Pressure" ? 2 : 0)
  //         ),
  //       })),
  //     }));
  //   }, 2000);

  //   return () => clearInterval(timer);
  // }, []);

  useEffect(() => {
    const savedLayout = localStorage.getItem("myFoundryDashboard");
    if (!savedLayout) return;

    try {
      const parsed = JSON.parse(savedLayout);
      if (parsed && parsed.length > 0) {
        setLayouts(parsed);
      }
    } catch (e) {
      console.error("Layout 로딩 실패:", e);
    }
  }, []);

  useEffect(() => {
    if (layouts.length > 0) {
      localStorage.setItem("myFoundryDashboard", JSON.stringify(layouts));
    }
  }, [layouts]);

  const handleLayoutChange = (currentLayout: Layout, _allLayouts?: Partial<Record<string, Layout>>) => {
    const updated = layouts.map((widget) => {
      const found = currentLayout.find((l) => l.i === widget.i);

      return found
        ? { ...widget, x: found.x, y: found.y, w: found.w, h: found.h }
        : widget;
    });

    setLayouts(updated);
  };

  const removeWidget = (widgetId: string) => {
    setLayouts((prev) => prev.filter((l) => l.i !== widgetId));
  };

  const resetWidgetBuilder = () => {
    setIsModalOpen(false);
    setBuilderStep(1);
    setSelectedDataCart([]);
    setTempSelection({ eqId: "", sensorId: "" });
    setSearchTerm("");
  };

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

    setLayouts((prev) => [...prev, newItem]);
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

  return {
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
  };
}