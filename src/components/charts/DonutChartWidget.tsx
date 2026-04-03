import ReactECharts from 'echarts-for-react';

export function DonutChartWidget({ 
  data, 
  title 
}: { 
  data: { name: string, value: number, color: string }[], 
  title?: string 
}) {
  const option = {
    tooltip: { trigger: 'item', backgroundColor: '#1e293b', borderColor: '#334155', textStyle: { color: '#f8fafc', fontSize: 11 } },
    legend: { orient: 'vertical', left: 'left', textStyle: { color: '#64748b', fontSize: 10 }, itemWidth: 8, itemHeight: 8 },
    series: [
      {
        name: title || 'Status Ratio',
        type: 'pie',
        radius: ['50%', '80%'], // 도넛 모양을 만드는 핵심 (안쪽 반지름, 바깥쪽 반지름)
        center: ['60%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 6, borderColor: '#161B26', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold', color: '#f8fafc' } },
        labelLine: { show: false },
        data: data.map(d => ({ value: d.value, name: d.name, itemStyle: { color: d.color } }))
      }
    ]
  };

  return (
    <div className="h-full w-full py-2">
      <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
    </div>
  );
}

export default DonutChartWidget;