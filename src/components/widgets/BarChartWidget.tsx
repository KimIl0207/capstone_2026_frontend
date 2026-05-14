import ReactECharts from "echarts-for-react";

type SelectedSensor = {
  label: string;
  value: number;
};

export function BarChartWidget({
  direction = "vertical",
  sensors,
}: {
  direction: "vertical" | "horizontal";
  sensors: SelectedSensor[];
}) {
  const chartColors = ["#818cf8", "#34d399", "#fbbf24", "#f87171", "#a78bfa", "#f472b6"];
  const data = sensors.length > 0
    ? sensors
    : [{ label: "No data", value: 0 }];
  const categoryData = data.map((sensor) => sensor.label);
  const values = data.map((sensor) => sensor.value);

  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "#1e293b",
      borderColor: "#334155",
      textStyle: { color: "#f8fafc", fontSize: 11 },
    },
    grid: { top: 20, right: 20, bottom: 30, left: 45, containLabel: true },
    xAxis: direction === "vertical"
      ? {
        type: "category",
        data: categoryData,
        axisTick: { alignWithLabel: true },
        axisLabel: { color: "#64748b", fontSize: 10 },
      }
      : {
        type: "value",
        axisLabel: { color: "#64748b", fontSize: 10 },
        splitLine: { lineStyle: { color: "#1e293b", type: "dashed" } },
      },
    yAxis: direction === "vertical"
      ? {
        type: "value",
        axisLabel: { color: "#64748b", fontSize: 10 },
        splitLine: { lineStyle: { color: "#1e293b", type: "dashed" } },
      }
      : {
        type: "category",
        data: categoryData,
        axisTick: { alignWithLabel: true },
        axisLabel: { color: "#64748b", fontSize: 10 },
      },
    series: [
      {
        name: "Current",
        type: "bar",
        barWidth: data.length > 2 ? "45%" : "30%",
        itemStyle: {
          color: (params: { dataIndex: number }) => chartColors[params.dataIndex % chartColors.length],
          borderRadius: direction === "vertical" ? [3, 3, 0, 0] : [0, 3, 3, 0],
        },
        data: values,
      },
    ],
  };

  return (
    <div className="h-full w-full pt-2">
      <ReactECharts option={option} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}

export default BarChartWidget;
