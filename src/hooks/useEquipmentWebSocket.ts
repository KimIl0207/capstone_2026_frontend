import { useEffect } from "react";
import type { UniversalEquipment } from "../types/equipment";
import type { SensorData } from "../types/equipment";

type GatewaySensor = {
    sensorId: string;
    dataType: "FLOAT" | "BOOLEAN" | "INTEGER";
    value: number;
    unit: string;
};

type GatewayPayload = {
    equipmentId: string;
    timestamp: string;
    status: "RUN" | "ERROR";
    sensors: GatewaySensor[];
};

function getSensorStatus(payloadStatus: "RUN" | "ERROR"): SensorData["status"] {
    return payloadStatus === "ERROR" ? "CRITICAL" : "NORMAL";
}

function mapGatewayToDashboard(prev: UniversalEquipment, payload: GatewayPayload): UniversalEquipment {
    const mappedSensors: SensorData[] = payload.sensors.map((sensor) => ({
        label: sensor.sensorId,
        value: sensor.value,
        unit: sensor.unit,
        status: getSensorStatus(payload.status),
    }));

    return {
        ...prev,
        id: payload.equipmentId,
        name: payload.equipmentId,
        status: payload.status === "RUN" ? "RUNNING" : "IDLE",
        lastUpdate: payload.timestamp,
        sensors: mappedSensors,
        metrics: {
            ...prev.metrics,
            // 일단 임시값
            oee: prev.metrics.oee,
            availability: prev.metrics.availability,
            performance: prev.metrics.performance,
            quality: prev.metrics.quality,
        },
    };
}

export function useEquipmentWebSocket(
    setEquipment: React.Dispatch<React.SetStateAction<UniversalEquipment>>
) {
    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8765");

        ws.onopen = () => {
            console.log("웹소켓 연결 성공");
        };

        ws.onmessage = (event) => {
            try {
                const payload: GatewayPayload = JSON.parse(event.data);
                console.log("웹소켓으로부터 데이터 수신:", payload);
                setEquipment((prev) => mapGatewayToDashboard(prev, payload));
            } catch (error) {
                console.error("웹소켓 데이터 파싱 실패:", error);
            }
        };

        ws.onerror = (error) => {
            console.error("웹소켓 에러:", error);
        };

        ws.onclose = () => {
            console.log("웹소켓 연결 종료");
        };

        return () => {
            ws.close();
        };
    }, [setEquipment]);
}