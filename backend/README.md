# Project Athena Backend

FastAPI telemetry backend for Project Athena. It supports two runtime modes:

- `mock` - backend-generated telemetry stream
- `hardware` - reads JSON lines from ESP32 over USB serial and normalizes them for the frontend

## Environment variables

- `ATHENA_TELEMETRY_MODE` = `mock` or `hardware`
- `ATHENA_SERIAL_PORT` = Windows serial port (example: `COM3`, `COM6`, etc.)
- `ATHENA_SERIAL_BAUD` = serial baud (default `115200`)
- `ATHENA_VEHICLE_ID` = fallback vehicle ID
- `ATHENA_WS_HZ` = WebSocket publish frequency (default `10`)

## Run backend

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

Example for blocked `8000/8001` environments:

```powershell
$env:ATHENA_TELEMETRY_MODE="hardware"
$env:ATHENA_SERIAL_PORT="COM6"
$env:ATHENA_SERIAL_BAUD="115200"
uvicorn main:app --host 127.0.0.1 --port 8765 --reload
```

WebSocket endpoint:

- `ws://127.0.0.1:8000/ws/telemetry`

Health endpoint:

- `http://127.0.0.1:8000/health`

## Notes

- If hardware mode is selected and the serial port is wrong/unavailable, the backend logs a clear error and continues serving WebSocket packets in degraded/disconnected state instead of crashing.
- Hardware heading is gyro-based (`MPU6050` yaw integration) and should be treated as estimated/drifting, not true compass heading.
- Hardware altitude should be interpreted as relative altitude from startup baseline (`altitude_is_relative=true`).
- Calibration metadata (`calibration_status`, `calibration_samples`, `sensor_status`) is passed through for UI status and troubleshooting.
