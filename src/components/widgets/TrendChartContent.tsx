import ReactECharts from 'echarts-for-react';

type TrendPoint = {
  t: string;
  [key: string]: string | number;
};

type TrendChartContentProps = {
  dataKeys: string | string[];
  data: TrendPoint[];
};

export function TrendChartContent({ dataKeys, data }: TrendChartContentProps) {
  const CHART_COLORS = ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#f472b6'];

  const keys = Array.isArray(dataKeys) ? dataKeys : [dataKeys];

  const trendChartOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1e293b',
      borderColor: '#334155',
      textStyle: { color: '#f8fafc', fontSize: 10 }
    },
    legend: {
      show: true,
      textStyle: { color: '#64748b', fontSize: 9 },
      top: 0
    },
    grid: { top: 30, right: 10, bottom: 20, left: 35, containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map(d => d.t),
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#64748b', fontSize: 9 }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
      axisLabel: { color: '#64748b', fontSize: 9 }
    },
    series: keys.map((key, index) => ({
      name: key,
      type: 'line',
      smooth: true,
      symbol: 'none',
      data: data.map(d => Number(d[key] ?? 0)),
      itemStyle: { color: CHART_COLORS[index % CHART_COLORS.length] },
      lineStyle: { width: 2 },
      areaStyle: index === 0
        ? {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: `${CHART_COLORS[index % CHART_COLORS.length]}44` },
                { offset: 1, color: `${CHART_COLORS[index % CHART_COLORS.length]}00` }
              ]
            }
          }
        : undefined
    }))
  };

  return (
    <div className="flex-grow w-full h-full min-h-[150px] mt-2">
      <ReactECharts
        option={trendChartOption}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  );
}

export default TrendChartContent;