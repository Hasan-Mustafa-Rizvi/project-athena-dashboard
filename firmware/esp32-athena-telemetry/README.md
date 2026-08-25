# ESP32 Athena Telemetry Firmware

This firmware reads `MPU6050` + `BMP180` over I2C and emits one JSON line per sample on USB serial.
It performs startup calibration so attitude/altitude are reported relative to the startup resting pose.

## Wiring

- `SDA` = GPIO `21`
- `SCL` = GPIO `22`
- `VCC` = `3V3`
- `GND` = `GND`

Expected I2C addresses:

- `BMP180` => `0x77`
- `MPU6050` => `0x68`

## Required Arduino libraries

- `Adafruit MPU6050`
- `Adafruit Unified Sensor`
- `Adafruit BMP085 Library` (BMP180 compatible)
- `ArduinoJson`

## Output format

Serial baud: `115200`

Output rate: ~`10 Hz`

On boot, the sketch calibrates for ~3.5 seconds. Keep the module flat and still during this phase.

Calibration behavior:

- captures roll/pitch zero offsets
- captures home altitude baseline
- zeros yaw baseline to `0°`
- publishes `calibration_status: "calibrating"` until ready

Each line is JSON, for example:

```json
{
  "source": "esp32",
  "vehicle_id": "ATHENA-HW-001",
  "sequence": 123,
  "timestamp_ms": 91234,
  "roll": 1.2,
  "pitch": -3.4,
  "yaw": 57.8,
  "yaw_rate": 0.7,
  "gyro_x": 0.01,
  "gyro_y": -0.02,
  "gyro_z": 0.03,
  "accel_x": 0.1,
  "accel_y": -0.2,
  "accel_z": 9.7,
  "temperature": 28.9,
  "pressure": 100982.0,
  "altitude": 0.3,
  "imu_quality": 94.0,
  "signal": 100,
  "battery": null,
  "heading_is_estimated": true,
  "altitude_is_relative": true,
  "battery_available": false,
  "calibration_status": "ready",
  "calibration_samples": 140
}
```

## Yaw limitation

`MPU6050` has no magnetometer. `yaw` is integrated from gyro-Z only and will drift over time. It is useful for motion visualization/demo, not true compass heading.

## Altitude limitation

`BMP180` altitude is pressure-derived and sensitive to weather/sea-level assumptions. This firmware reports **relative altitude delta** from startup baseline to avoid implying precise absolute indoor altitude.

## Bring-up flow

1. Upload `tools/i2c_scanner/i2c_scanner.ino`
2. Open Serial Monitor @ `115200`
3. Confirm `0x68` and `0x77` are visible
4. Upload `esp32-athena-telemetry.ino`
5. Confirm steady JSON lines in Serial Monitor
6. Place module still during the initial calibration period (`calibrating` -> `ready`)

If device detection is intermittent, check physical contact first (unsoldered headers can cause intermittent I2C contact).
