import type { UniversalEquipment } from "../../types/equipment";

export const MOCK_DATA: UniversalEquipment = {
  id: "EQ-001",
  name: "CVD Chamber-04",
  type: "CVD",
  status: "RUNNING",
  metrics: { oee: 85.2, availability: 91.4, performance: 88.2, quality: 99.7 },
  sensors: [
    { label: "Temperature", value: 973, unit: "°C", status: "NORMAL" },
    { label: "Pressure", value: 2.8, unit: "mT", status: "CAUTION" },
    { label: "Gas Flow", value: 18.2, unit: "slm", status: "NORMAL" },
    { label: "Power Load", value: 45.5, unit: "kW", status: "NORMAL" }
  ],
  lastUpdate: new Date().toISOString()
};

export const ALERTS_DATA = [
  { id: 1, time: "14:32:07", sev: "critical", eq: "CVD-Chamber-04", msg: "Temperature exceeded threshold: 1087°C", status: "ACTIVE" },
  { id: 2, time: "14:29:51", sev: "critical", eq: "IMP-Line-02", msg: "Ion beam current unstable — variance ±18%", status: "ACTIVE" },
  { id: 3, time: "14:18:22", sev: "warning", eq: "ETCH-Bay-07", msg: "Chamber pressure deviation: 2.3 mTorr", status: "ACK" },
  { id: 4, time: "14:11:44", sev: "critical", eq: "CMP-Unit-01", msg: "Slurry flow rate critically low: 84 mL/min", status: "ACTIVE" },
  { id: 5, time: "14:05:11", sev: "warning", eq: "PVD-Cluster-03", msg: "Target material depletion at 12%", status: "ACK" },
];

export const TEMP_DATA = [
  { t: "13:00", a: 845, b: 2.1 }, { t: "13:10", a: 862, b: 2.3 },
  { t: "13:20", a: 879, b: 2.1 }, { t: "13:30", a: 891, b: 2.5 },
  { t: "13:40", a: 903, b: 2.4 }, { t: "13:50", a: 918, b: 2.7 },
  { t: "14:00", a: 932, b: 2.6 }, { t: "14:10", a: 945, b: 2.9 },
  { t: "14:20", a: 931, b: 3.1 }, { t: "14:30", a: 958, b: 2.8 },
  { t: "14:32", a: 973, b: 3.0 },
];