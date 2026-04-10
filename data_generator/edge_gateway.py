import asyncio
import json
import websockets
from datetime import datetime, timezone
from pymodbus.client.sync import ModbusTcpClient

# 글로벌 버퍼 (0.1초마다 들어오는 데이터를 잠시 담아둠)
buffer = {"temp": [], "power": []}
current_cycle = 0

async def poll_modbus_data():
    """1. 장비에서 0.1초마다 데이터를 긁어오는(Polling) 수집기"""
    global current_cycle
    client = ModbusTcpClient('127.0.0.1', port=5020)
    client.connect()
    
    print("📡 [게이트웨이] 구형 장비와 Modbus 연결 성공. 수집 시작...")
    
    while True:
        try:
            # 장비의 0번 방부터 3개의 데이터를 읽어옴
            result = client.read_holding_registers(address=0, count=3, slave=0)
            if not result.isError():
                raw_temp, raw_power, raw_cycle = result.registers
                
                # 소수점 복원 (9705 -> 970.5) 및 버퍼에 저장
                buffer["temp"].append(raw_temp / 10.0)
                buffer["power"].append(raw_power)
                current_cycle = raw_cycle
                
        except Exception as e:
            print(f"통신 에러: {e}")
            
        await asyncio.sleep(0.1) # 0.1초마다 무한 반복

async def websocket_handler(websocket):
    """2. 모아둔 데이터를 1초마다 다운샘플링하여 웹으로 쏘는 분배기"""
    print("💻 [대시보드] 프론트엔드 브라우저 접속됨! (JSON 스트리밍 시작)")
    
    while True:
        await asyncio.sleep(1.0) # 1초(1000ms) 대기 (여기가 다운샘플링 주기)
        
        # 데이터가 없으면 패스
        if not buffer["temp"]: continue
        
        # 👉 핵심: 필터링 및 다운샘플링 (10개의 데이터를 평균 냄)
        avg_temp = round(sum(buffer["temp"]) / len(buffer["temp"]), 1)
        # 전원은 한 번이라도 0이 섞였으면 0(에러)으로 처리
        is_power_on = 0 if 0 in buffer["power"] else 1
        status = "RUN" if is_power_on == 1 else "ERROR"
        
        # 기획서 3항목에 정의된 [Standard JSON Payload] 조립
        payload = {
            "equipmentId": "CVD-CHAMBER-04",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": status,
            "sensors": [
                {"sensorId": "Temp_Sensor_0", "dataType": "FLOAT", "value": avg_temp, "unit": "°C"},
                {"sensorId": "Power_Status_1", "dataType": "BOOLEAN", "value": is_power_on, "unit": "BOOL"},
                {"sensorId": "Cycle_Count_2", "dataType": "INTEGER", "value": current_cycle, "unit": "cnt"}
            ]
        }

        print(f"📊 [게이트웨이] 1초간 수집된 데이터 10건 -> 평균 온도: {avg_temp}°C, 전원 상태: {'ON' if is_power_on == 1 else 'OFF'}, 사이클: {current_cycle}  ")
        
        # 프론트엔드로 전송
        try:
            await websocket.send(json.dumps(payload, indent=2))
            print(f"🚀 [웹소켓 송신] 데이터 10건 압축 -> 1건 전송 완료 (Temp Avg: {avg_temp})")
        except websockets.exceptions.ConnectionClosed:
            print("💻 [대시보드] 접속 종료됨.")
            break
            
        # 버퍼 비우기 (다음 1초를 위해)
        buffer["temp"].clear()
        buffer["power"].clear()

async def main():
    # 1. Modbus 폴링 엔진 백그라운드 실행
    asyncio.create_task(poll_modbus_data())
    
    # 2. 웹소켓 서버 오픈 (프론트엔드는 ws://localhost:8765 로 접속)
    print("🌐 [게이트웨이] 웹소켓 서버 오픈 (포트 8765). 대시보드 접속 대기 중...")
    async with websockets.serve(websocket_handler, "localhost", 8765):
        await asyncio.Future()  # 영원히 실행

if __name__ == "__main__":
    asyncio.run(main())