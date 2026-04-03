export type DashboardWidgetType =
  | 'OEE'
  | 'SENSORS'
  | 'TREND'
  | 'ALERTS'
  | 'GAUGE'
  | 'DONUT'
  | 'STATUS'
  | 'LOG'
  | 'BAR_V'
  | 'BAR_H';

export interface DashboardItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  type: DashboardWidgetType;
  dataKey: string | string[];
  title: string;
  color: string;
}

export interface SensorMeta {
  id: string;
  label: string;
  unit: string;
  dataType?: 'FLOAT' | 'BOOLEAN' | 'INTEGER';
}

export interface EquipmentMaster {
  id: string;
  name: string;
  type: string;
  sensors: SensorMeta[];
}

export interface SelectedData {
  eqId: string;
  eqName: string;
  sensorId: string;
}