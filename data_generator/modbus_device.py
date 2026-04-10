import time
import random
import threading
from pymodbus.server.sync import StartTcpServer
from pymodbus.datastore import ModbusSequentialDataBlock, ModbusSlaveContext, ModbusServerContext


def generate_raw_data(context):
    print("🤖 [구형 장비] Modbus TCP 가동 시작 (포트 5020)")
    print("🤖 [구형 장비] 0.1초 주기로 원시 데이터(온도, 전원, 사이클) 발생 중...\n")

    register = 3   # holding register
    slave_id = 0x00

    temp_raw = 9700
    cycle = 0

    print("📊 [구형 장비] 온도: 970.0°C, 전원: ON, 사이클: 0 (초기값)")

    while True:
        temp_raw += random.randint(-5, 5)
        power_raw = 1 if random.random() > 0.01 else 0
        if random.random() > 0.8:
            cycle += 1

        # holding register 0,1,2에 기록
        context[slave_id].setValues(register, 0, [temp_raw, power_raw, cycle])

        print(
            f"📊 [구형 장비] 온도: {temp_raw / 10.0}°C, "
            f"전원: {'ON' if power_raw == 1 else 'OFF'}, "
            f"사이클: {cycle}"
        )

        time.sleep(0.1)


def run_modbus_server():
    store = ModbusSlaveContext(hr=ModbusSequentialDataBlock(0, [0] * 100))
    context = ModbusServerContext(slaves=store, single=True)

    data_thread = threading.Thread(target=generate_raw_data, args=(context,), daemon=True)
    data_thread.start()

    print("🌐 [구형 장비] Modbus TCP 서버 오픈: 127.0.0.1:5020")
    StartTcpServer(context, address=("127.0.0.1", 5020))


if __name__ == "__main__":
    run_modbus_server()