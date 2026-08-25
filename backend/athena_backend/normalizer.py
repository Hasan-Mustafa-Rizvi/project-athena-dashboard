from __future__ import annotations

import math
import time
from dataclasses import dataclass
from typing import Any


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def _to_float(raw: Any, default: float = 0.0) -> float:
    try:
        value = float(raw)
        if math.isfinite(value):
            return value
    except (TypeError, ValueError):
        pass
    return default


def _normalize_heading(value: float) -> float:
    heading = value % 360.0
    return heading if heading >= 0 else heading + 360.0


@dataclass
class HardwareNormalizer:
    vehicle_id: str
    fallback_sequence: int = 0
    _last_altitude: float | None = None
    _last_altitude_at: float | None = None
    _smoothed_vertical_speed: float = 0.0

    def normalize(self, raw: dict[str, Any], serial_connected: bool, serial_error: str | None) -> dict:
        now = time.time()
        self.fallback_sequence += 1

        timestamp_ms = _to_float(raw.get("timestamp_ms"), default=now * 1000.0)
        timestamp_iso = time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime(timestamp_ms / 1000.0))
        timestamp_iso = f"{timestamp_iso}.{int(timestamp_ms % 1000):03d}Z"

        altitude = _to_float(raw.get("altitude"), default=0.0)
        vertical_speed = 0.0
        if self._last_altitude is not None and self._last_altitude_at is not None:
            dt = max(0.001, now - self._last_altitude_at)
            vertical_speed = (altitude - self._last_altitude) / dt
        self._last_altitude = altitude
        self._last_altitude_at = now
        # Heavy smoothing keeps barometric V/S readable despite BMP180 noise.
        vertical_speed_alpha = 0.12
        self._smoothed_vertical_speed = (
            vertical_speed_alpha * vertical_speed + (1.0 - vertical_speed_alpha) * self._smoothed_vertical_speed
        )

        signal_strength = _clamp(_to_float(raw.get("signal"), default=90.0), 0.0, 100.0)
        imu_quality = _clamp(_to_float(raw.get("imu_quality"), default=85.0), 0.0, 100.0)
        battery_raw = raw.get("battery")
        battery_pct = None if battery_raw is None else _clamp(_to_float(battery_raw), 0.0, 100.0)
        calibration_status = str(raw.get("calibration_status") or "ready").lower()
        if calibration_status not in {"calibrating", "ready"}:
            calibration_status = "unknown"
        calibration_samples = int(_to_float(raw.get("calibration_samples"), default=0.0))
        sensor_status = {
            "imu_ok": bool(raw.get("imu_ok", True)),
            "baro_ok": bool(raw.get("baro_ok", True)),
            "serial_connected": serial_connected,
        }

        connection_status = "connected" if serial_connected else "degraded"
        if serial_error and not serial_connected:
            connection_status = "disconnected"

        return {
            "schema_version": "1.0.0",
            "timestamp": timestamp_iso,
            "sequence": int(_to_float(raw.get("sequence"), default=self.fallback_sequence)),
            "vehicle": {
                "id": str(raw.get("vehicle_id") or self.vehicle_id),
                "connection": {
                    "status": connection_status,
                    "signal_strength_pct": signal_strength,
                },
                "flight": {
                    "mode": "STABILIZE",
                    "system_status": "nominal" if imu_quality >= 70 and calibration_status == "ready" else "caution",
                },
            },
            "attitude": {
                "roll_deg": _to_float(raw.get("roll")),
                "pitch_deg": _to_float(raw.get("pitch")),
                "heading_deg": _normalize_heading(_to_float(raw.get("yaw"))),
            },
            "altitude": {
                "relative_m": altitude,
                "vertical_speed_mps": self._smoothed_vertical_speed,
            },
            "power": {
                "battery_pct": battery_pct,
            },
            "health": {
                "temperature_c": _to_float(raw.get("temperature"), default=0.0),
                "imu_quality_pct": imu_quality,
            },
            "telemetry_source": "hardware",
            "heading_is_estimated": bool(raw.get("heading_is_estimated", True)),
            "altitude_is_relative": bool(raw.get("altitude_is_relative", True)),
            "battery_available": bool(raw.get("battery_available", battery_pct is not None)),
            "calibration_status": calibration_status,
            "calibration_samples": max(0, calibration_samples),
            "sensor_status": sensor_status,
        }

    def disconnected_payload(self, serial_error: str | None) -> dict:
        self.fallback_sequence += 1
        now = time.time()
        return {
            "schema_version": "1.0.0",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime(now)) + f".{int((now % 1) * 1000):03d}Z",
            "sequence": self.fallback_sequence,
            "vehicle": {
                "id": self.vehicle_id,
                "connection": {
                    "status": "degraded" if not serial_error else "disconnected",
                    "signal_strength_pct": 0,
                },
                "flight": {
                    "mode": "STABILIZE",
                    "system_status": "caution",
                },
            },
            "attitude": {
                "roll_deg": 0,
                "pitch_deg": 0,
                "heading_deg": 0,
            },
            "altitude": {
                "relative_m": 0,
                "vertical_speed_mps": 0,
            },
            "power": {
                "battery_pct": None,
            },
            "health": {
                "temperature_c": 0,
                "imu_quality_pct": 0,
            },
            "telemetry_source": "hardware",
            "heading_is_estimated": True,
            "altitude_is_relative": True,
            "battery_available": False,
            "calibration_status": "unknown",
            "calibration_samples": 0,
            "sensor_status": {
                "imu_ok": False,
                "baro_ok": False,
                "serial_connected": False,
            },
            "warning": serial_error or "No hardware packets received yet.",
        }
