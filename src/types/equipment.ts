/**
 * 1. 장비 가동 상태 타입
 */
export type EquipmentStatus = 'RUNNING' | 'IDLE' | 'DOWN' | 'MAINTENANCE';

/**
 * 2. 개별 센서 데이터 구조 (범용성 핵심)
 * 어떤 장비가 오더라도 label, value, unit 구조로 데이터를 담습니다.
 */
export interface SensorData {
  sensorId?: string; // 원시 데이터 식별자 (예: "Temp_Sensor_0"), 필요에 따라 사용
  label: string;  // 예: "Temperature", "Pressure"
  value: number;  // 예: 973, 2.8
  unit: string;   // 예: "°C", "mT"
  status: 'NORMAL' | 'CAUTION' | 'CRITICAL'; // 상태에 따른 색상 제어용
}

/**
 * 3. 모든 장비가 공통으로 가지는 기본 정보
 */
export interface BaseEquipment {
  id: string;
  name: string;
  type: 'CVD' | 'ETCH' | 'CNC' | 'ROBOT'; // 장비 유형 확장 가능
  status: EquipmentStatus;
  lastUpdate: string; // ISO 타임스탬프 (new Date().toISOString())
}

/**
 * 4. 최종 범용 장비 데이터 타입 (Universal Schema)
 * Dashboard.tsx에서 이 타입을 사용하여 모든 데이터를 렌더링합니다.
 */
export interface UniversalEquipment extends BaseEquipment {
  metrics: {
    oee: number;
    availability: number;
    performance: number;
    quality: number;
  };
  // 핵심: 장비마다 다른 센서 리스트를 배열로 관리하여 유연성 확보
  sensors: SensorData[]; 
}

export interface SensorMeta {
  id: string;      // 데이터 식별자 (예: temp_01)
  label: string;   // 화면 표시 이름 (예: 온도)
  unit: string;    // 단위 (예: °C)
}

export interface EquipmentMaster {
  id: string;      // 장비 고유 ID
  name: string;    // 장비 이름
  type: string;    // 장비 유형 (CVD, Etch 등)
  sensors: SensorMeta[]; // 이 장비가 가진 센서들
}