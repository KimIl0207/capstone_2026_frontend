import asyncio
import random
from pymodbus.server.sync import StartTcpServer
from pymodbus.datastore import ModbusSequentialDataBlock, ModbusSlaveContext, ModbusServerContext

# 0.1초마다 쌩(Raw) 데이터를 생성하여 Modbus 메모리에 덮어쓰는 엔진
async def generate_raw_data(context):
    print("🤖 [구형 장비] Modbus TCP 가동 시작 (포트 5020)")
    print("🤖 [구형 장비] 0.1초 주기로 원시 데이터(온도, 전원, 사이클) 발생 중...\n")
    
    register = 3  # Holding Register (데이터를 담는 방)
    slave_id = 0x00
    
    temp_raw = 9700  # 실제 970.0도 지만 소수점을 못 보내서 9700으로 보냄 (Modbus 특징)
    cycle = 0

    while True:
        # 온도 변동 (0.1초마다 미세하게 튐)
        temp_raw += random.randint(-5, 5)
        # 전원 상태 (거의 1, 가끔 0)
        power_raw = 1 if random.random() > 0.01 else 0
        # 생산량 (가끔씩 증가)
        if random.random() > 0.8: cycle += 1

        # Modbus 0번, 1번, 2번 방에 데이터 기록
        context[slave_id].setValues(register, 0, [temp_raw, power_raw, cycle])
        
        await asyncio.sleep(0.1) # 0.1초(100ms) 주기 폭격

async def run_modbus_server():
    # 빈 메모리 블록 100개 생성
    store = ModbusSlaveContext(hr=ModbusSequentialDataBlock(0, [0]*100))
    context = ModbusServerContext(slaves=store, single=True)
    
    # 서버 실행과 데이터 발생 루프를 동시에 돌림
    asyncio.create_task(generate_raw_data(context))
    await StartTcpServer(context=context, address=("127.0.0.1", 5020))

if __name__ == "__main__":
    asyncio.run(run_modbus_server())