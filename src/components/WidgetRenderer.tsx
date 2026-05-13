import { OEEContent } from "./widgets/OEEContent";
import { SensorGridContent } from "./widgets/SensorGridContent";
import { TrendChartContent } from "./widgets/TrendChartContent";
import { AlertsContent } from "./widgets/AlertsContent";
import { GaugeChartWidget } from "./widgets/GaugeChartWidget";
import { DonutChartWidget } from "./widgets/DonutChartWidget";
import { StatusWidget } from "./widgets/StatusWidget";
import { LogContent } from "./widgets/LogContent";
import { BarChartWidget } from "./widgets/BarChartWidget";

import type { UniversalEquipment } from "../types/equipment";
import type { AlertItem, DashboardItem } from "../types/dashboard";

type TrendPoint = {
  t: string;
  [key: string]: string | number;
};

type Props = {
  widget: DashboardItem;
  equipment: UniversalEquipment;
  alerts: AlertItem[];
  trendData: TrendPoint[];
};

export function WidgetRenderer({ widget, equipment, alerts, trendData }: Props) {
  const key = Array.isArray(widget.dataKey) ? widget.dataKey[0] : widget.dataKey;
  const targetSensor =
    equipment.sensors?.find((sensor) => sensor.label === key || sensor.sensorId === key) ??
    (widget.type === "GAUGE" || widget.type === "STATUS" ? equipment.sensors?.[0] : undefined);
  const val = targetSensor ? targetSensor.value : 0;
  const unit = targetSensor ? targetSensor.unit : "";

  switch (widget.type) {
    case "OEE":
      return <OEEContent data={equipment} />;

    case "SENSORS":
      return <SensorGridContent sensors={equipment.sensors} />;

    case "TREND":
      return <TrendChartContent dataKeys={widget.dataKey} data={trendData} />;

    case "ALERTS":
      return <AlertsContent alerts={alerts} />;

    case "GAUGE":
      return (
        <GaugeChartWidget
          value={val}
          unit={unit}
          label={String(key)}
          min={0}
          max={1200}
        />
      );

    case "DONUT":
      return (
        <DonutChartWidget
          title={widget.title}
          data={[
            { name: "Running", value: 75, color: "#10b981" },
            { name: "Idle", value: 15, color: "#f59e0b" },
            { name: "Down", value: 10, color: "#ef4444" },
          ]}
        />
      );

    case "STATUS":
      return (
        <StatusWidget
          status={key === "POWER" ? "RUNNING" : "ALARM"}
          label={widget.title}
          subText={key === "POWER" ? "Stable 220V" : "Pressure Drop"}
        />
      );

    case "LOG":
      return <LogContent type="LOG" />;

    case "BAR_V":
      return <BarChartWidget direction="vertical" dataKeys={widget.dataKey} />;

    case "BAR_H":
      return <BarChartWidget direction="horizontal" dataKeys={widget.dataKey} />;

    default:
      return null;
  }
}

export default WidgetRenderer;
