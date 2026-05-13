import type { DashboardItem } from "../types/dashboard";

export const initialLayouts: Record<string, DashboardItem[]> = {
  lg: [
    // 1. OEE (KPI)
    { i: "oee", type: "OEE", title: "Overall Efficiency", dataKey: "OEE", color: "bg-indigo-500", x: 0, y: 0, w: 4, h: 2 },
    
    // 2. 온도 게이지 (GAUGE)
    { i: "temp-gauge", type: "GAUGE", title: "Chamber Temperature", dataKey: "Temperature", color: "bg-orange-500", x: 4, y: 0, w: 4, h: 2 },
    
    // 3. 센서 그리드 (SENSORS)
    { i: "sensors", type: "SENSORS", title: "All Sensors Status", dataKey: "ALL", color: "bg-indigo-500", x: 8, y: 0, w: 4, h: 6 },
    
    // 4. 트렌드 분석 (TREND)
    { i: "trend", type: "TREND", title: "Environment Analysis", dataKey: "Temperature", color: "bg-indigo-500", x: 0, y: 2, w: 8, h: 4 },

    // 🆕 5. 가동 상태 비율 (DONUT) - 이 부분이 새로 추가된 것입니다!
    { 
      i: "status-donut", 
      type: "DONUT", 
      title: "Operation Ratio", 
      dataKey: "STATUS_RATIO", 
      color: "bg-emerald-500", 
      x: 8, y: 6, w: 4, h: 2 
    },
    { 
  i: "pwr-status", 
  type: "STATUS", 
  title: "Main Power", 
  dataKey: "POWER", 
  color: "bg-emerald-500", 
  x: 4, y: 2, w: 2, h: 2 
},
{ 
  i: "vlv-status", 
  type: "STATUS", 
  title: "Emergency Valve", 
  dataKey: "VALVE", 
  color: "bg-rose-500", 
  x: 6, y: 2, w: 2, h: 2 
},
  ] as DashboardItem[]
};

export default initialLayouts;
