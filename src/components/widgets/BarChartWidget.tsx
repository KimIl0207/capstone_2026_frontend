import ReactECharts from 'echarts-for-react';

export function BarChartWidget({ 
  direction = 'vertical', 
  dataKeys 
}: { 
  direction: 'vertical' | 'horizontal', 
  dataKeys: string | string[] 
}) {
  const CHART_COLORS = ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#f472b6'];
  
  const keys = Array.isArray(dataKeys) ? dataKeys : [dataKeys];
  const categoryData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const sampleValues = [120, 200, 150, 80, 70, 110, 130];

  const option = {
    tooltip: { 
      trigger: 'axis', 
      axisPointer: { type: 'shadow' },
      backgroundColor: '#1e293b',
      borderColor: '#334155',
      textStyle: { color: '#f8fafc', fontSize: 11 }
    },
    legend: {
      show: true,
      top: 0,
      textStyle: { color: '#64748b', fontSize: 10 },
      itemWidth: 10,
      itemHeight: 10
    },
    // ✅ Grid: 상단 범례 공간을 충분히 확보 (40 -> 45)
    grid: { top: 45, right: 20, bottom: 30, left: 45, containLabel: true },
    
    xAxis: direction === 'vertical' 
      ? { 
          type: 'category', 
          data: categoryData, 
          // ✅ 라벨과 막대 뭉치의 중앙을 맞춤
          axisTick: { alignWithLabel: true },
          axisLabel: { color: '#64748b', fontSize: 10 } 
        }
      : { 
          type: 'value', 
          axisLabel: { color: '#64748b', fontSize: 10 }, 
          splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } } 
        },
    
    yAxis: direction === 'vertical'
      ? { 
          type: 'value', 
          axisLabel: { color: '#64748b', fontSize: 10 }, 
          splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } } 
        }
      : { 
          type: 'category', 
          data: categoryData, 
          axisTick: { alignWithLabel: true },
          axisLabel: { color: '#64748b', fontSize: 10 } 
        },
    
    series: keys.map((key, idx) => ({
      name: key,
      type: 'bar',
      // ✅ 막대 너비 최적화: 데이터가 많을수록 슬림하게 (20~30%가 적당함)
      barWidth: keys.length > 2 ? '20%' : '30%',
      // ✅ 핵심 수정사항: 막대 사이의 간격 추가 (0%는 딱 붙음, 10%~20% 권장)
      barGap: '20%', 
      itemStyle: { 
        color: CHART_COLORS[idx % CHART_COLORS.length],
        // ✅ 모서리 곡률을 살짝 줄여서 정갈하게 표현
        borderRadius: direction === 'vertical' ? [3, 3, 0, 0] : [0, 3, 3, 0] 
      },
      data: sampleValues.map(v => v + (idx * 25)) 
    }))
  };

  return (
    <div className="h-full w-full pt-2">
      <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
    </div>
  );
}

export default BarChartWidget;