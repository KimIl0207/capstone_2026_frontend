import { OEEContent } from "./widgets/OEEContent";
import { SensorGridContent } from "./widgets/SensorGridContent";
import { TrendChartContent } from "./widgets/TrendChartContent";
import { AlertsContent } from "./widgets/AlertsContent";
import { GaugeChartWidget } from "./widgets/GaugeChartWidget";
import { DonutChartWidget } from "./widgets/DonutChartWidget";
import { StatusWidget } from "./widgets/StatusWidget";
import { LogContent } from "./widgets/LogContent";
import { BarChartWidget } from "./widgets/BarChartWidget";

import type { SensorData, UniversalEquipment } from "../types/equipment";
import type { AlertItem, DashboardItem } from "../types/dashboard";

type SelectedSensor = {
  key: string;
  equipmentId?: string;
  sensorId: string;
  label: string;
  value: number;
  unit: string;
  status: SensorData["status"];
};

type Props = {
  widget: DashboardItem;
  equipment: UniversalEquipment;
  equipmentById?: Record<string, UniversalEquipment>;
  alerts: AlertItem[];
};

function EmptyWidgetState({ message = "No live sensor data" }: { message?: string }) {
  return (
    <div className="flex h-full min-h-[120px] items-center justify-center rounded-lg border border-slate-800 bg-slate-900/40 px-4 text-center text-xs font-semibold text-slate-500">
      {message}
    </div>
  );
}

function parseDataKey(dataKey: string) {
  const [equipmentId, sensorId] = dataKey.includes("::") ? dataKey.split("::") : ["", dataKey];
  return { equipmentId, sensorId };
}

function resolveEquipment(dataKey: string, fallback: UniversalEquipment, equipmentById?: Record<string, UniversalEquipment>) {
  const { equipmentId, sensorId } = parseDataKey(dataKey);
  const equipment = equipmentId ? equipmentById?.[equipmentId] : fallback;

  return {
    equipment: equipment ?? fallback,
    equipmentId,
    sensorId,
  };
}

function resolveSensor(
  dataKey: string,
  fallbackEquipment: UniversalEquipment,
  equipmentById?: Record<string, UniversalEquipment>,
): SelectedSensor | undefined {
  const { equipment, equipmentId, sensorId } = resolveEquipment(dataKey, fallbackEquipment, equipmentById);

  if (equipmentId && equipment.id !== equipmentId && !equipmentById?.[equipmentId]) {
    return undefined;
  }

  const sensor = equipment.sensors.find(
    (item) =>
      item.sensorId === sensorId ||
      item.label === sensorId ||
      String(item.sensorId ?? "").endsWith(sensorId) ||
      sensorId.endsWith(String(item.sensorId ?? "")) ||
      String(item.label ?? "").endsWith(sensorId) ||
      sensorId.endsWith(String(item.label ?? "")),
  );

  if (!sensor) return undefined;

  return {
    key: dataKey,
    equipmentId: equipmentId || equipment.id,
    sensorId: sensor.sensorId ?? sensor.label,
    label: `${equipment.name} - ${sensor.label}`,
    value: sensor.value,
    unit: sensor.unit,
    status: sensor.status,
  };
}

function resolveSensorsForWidget(
  dataKey: string | string[],
  equipment: UniversalEquipment,
  equipmentById?: Record<string, UniversalEquipment>,
) {
  const keys = Array.isArray(dataKey) ? dataKey : [dataKey];
  return keys
    .map((key) => resolveSensor(key, equipment, equipmentById))
    .filter((sensor): sensor is SelectedSensor => Boolean(sensor));
}

function getPrimaryEquipment(widget: DashboardItem, fallback: UniversalEquipment, equipmentById?: Record<string, UniversalEquipment>) {
  const firstKey = Array.isArray(widget.dataKey) ? widget.dataKey[0] : widget.dataKey;
  const { equipmentId } = parseDataKey(firstKey);
  return (equipmentId ? equipmentById?.[equipmentId] : undefined) ?? fallback;
}

export function WidgetRenderer({ widget, equipment, equipmentById, alerts }: Props) {
  const widgetEquipment = getPrimaryEquipment(widget, equipment, equipmentById);
  const selectedSensors = resolveSensorsForWidget(widget.dataKey, widgetEquipment, equipmentById);
  const targetSensor = selectedSensors[0];
  const val = targetSensor?.value ?? 0;
  const unit = targetSensor?.unit ?? "";
  const label = targetSensor?.label ?? widget.title;

  switch (widget.type) {
    case "OEE":
      return <OEEContent data={widgetEquipment} />;

    case "SENSORS":
      if (widgetEquipment.sensors.length === 0) return <EmptyWidgetState />;
      return <SensorGridContent sensors={widgetEquipment.sensors} />;

    case "TREND":
      return <TrendChartContent sensors={selectedSensors} />;

    case "ALERTS":
      return <AlertsContent alerts={alerts} />;

    case "GAUGE":
      if (!targetSensor) return <EmptyWidgetState />;
      return (
        <GaugeChartWidget
          value={val}
          unit={unit}
          label={label}
          min={0}
          max={1200}
        />
      );

    case "DONUT":
      if (widgetEquipment.sensors.length === 0) return <EmptyWidgetState />;
      return (
        <DonutChartWidget
          title={widget.title}
          data={[
            { name: "Normal", value: widgetEquipment.sensors.filter((sensor) => sensor.status === "NORMAL").length, color: "#10b981" },
            { name: "Caution", value: widgetEquipment.sensors.filter((sensor) => sensor.status === "CAUTION").length, color: "#f59e0b" },
            { name: "Critical", value: widgetEquipment.sensors.filter((sensor) => sensor.status === "CRITICAL").length, color: "#ef4444" },
          ]}
        />
      );

    case "STATUS":
      if (!targetSensor) return <EmptyWidgetState />;
      return (
        <StatusWidget
          status={targetSensor?.status === "CRITICAL" ? "ALARM" : targetSensor?.status === "CAUTION" ? "CAUTION" : "RUNNING"}
          label={label}
          subText={targetSensor ? `${targetSensor.value}${targetSensor.unit}` : "No data"}
        />
      );

    case "LOG":
      return <LogContent />;

    case "BAR_V":
      if (selectedSensors.length === 0) return <EmptyWidgetState />;
      return <BarChartWidget direction="vertical" sensors={selectedSensors} />;

    case "BAR_H":
      if (selectedSensors.length === 0) return <EmptyWidgetState />;
      return <BarChartWidget direction="horizontal" sensors={selectedSensors} />;

    default:
      return null;
  }
}

export default WidgetRenderer;
