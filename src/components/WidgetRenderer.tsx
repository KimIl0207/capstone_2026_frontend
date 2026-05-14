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

type TrendPoint = {
  t: string;
  [key: string]: string | number;
};

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
  alerts: AlertItem[];
  trendData: TrendPoint[];
};

function parseDataKey(dataKey: string) {
  const [equipmentId, sensorId] = dataKey.includes("::") ? dataKey.split("::") : ["", dataKey];
  return { equipmentId, sensorId };
}

function resolveSensor(dataKey: string, equipment: UniversalEquipment): SelectedSensor | undefined {
  const { equipmentId, sensorId } = parseDataKey(dataKey);

  if (equipmentId && equipment.id !== equipmentId) {
    return undefined;
  }

  const sensor = equipment.sensors.find(
    (item) => item.sensorId === sensorId || item.label === sensorId,
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

function resolveSensors(dataKey: string | string[], equipment: UniversalEquipment) {
  const keys = Array.isArray(dataKey) ? dataKey : [dataKey];
  return keys
    .map((key) => resolveSensor(key, equipment))
    .filter((sensor): sensor is SelectedSensor => Boolean(sensor));
}

export function WidgetRenderer({ widget, equipment, alerts, trendData }: Props) {
  const selectedSensors = resolveSensors(widget.dataKey, equipment);
  const targetSensor = selectedSensors[0];
  const fallbackSensor = equipment.sensors[0];
  const val = targetSensor?.value ?? fallbackSensor?.value ?? 0;
  const unit = targetSensor?.unit ?? fallbackSensor?.unit ?? "";
  const label = targetSensor?.label ?? widget.title;

  switch (widget.type) {
    case "OEE":
      return <OEEContent data={equipment} />;

    case "SENSORS":
      return <SensorGridContent sensors={equipment.sensors} />;

    case "TREND":
      return <TrendChartContent sensors={selectedSensors} fallbackData={trendData} />;

    case "ALERTS":
      return <AlertsContent alerts={alerts} />;

    case "GAUGE":
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
      return (
        <DonutChartWidget
          title={widget.title}
          data={[
            { name: "Normal", value: equipment.sensors.filter((sensor) => sensor.status === "NORMAL").length, color: "#10b981" },
            { name: "Caution", value: equipment.sensors.filter((sensor) => sensor.status === "CAUTION").length, color: "#f59e0b" },
            { name: "Critical", value: equipment.sensors.filter((sensor) => sensor.status === "CRITICAL").length, color: "#ef4444" },
          ]}
        />
      );

    case "STATUS":
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
      return <BarChartWidget direction="vertical" sensors={selectedSensors} />;

    case "BAR_H":
      return <BarChartWidget direction="horizontal" sensors={selectedSensors} />;

    default:
      return null;
  }
}

export default WidgetRenderer;
