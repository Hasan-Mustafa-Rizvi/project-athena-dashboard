from __future__ import annotations

import math
import time
from dataclasses import dataclass, field


@dataclass
class MockState:
    sequence: int = 0
    # Monotonic start time so the simulated battery drain is measured from process
    # start. Deriving it from the absolute epoch clock pins the value at the floor.
    started_at: float = field(default_factory=time.monotonic)


def generate_mock_packet(state: MockState) -> dict:
    state.sequence += 1
    now = time.time()
    elapsed_s = time.monotonic() - state.started_at

    roll_deg = math.sin(now * 0.30) * 15 + math.sin(now * 0.7) * 5
    pitch_deg = math.sin(now * 0.20) * 8 + math.sin(now * 0.5) * 3
    heading_deg = (117 + now * 2) % 360
    vertical_speed_mps = math.sin(now * 0.4) * 2
    relative_m = 128 + math.sin(now * 0.15) * 30
    battery_pct = max(20.0, 99 - elapsed_s * 0.005)
    signal_strength_pct = max(0.0, min(100.0, 70 + math.sin(now * 0.8) * 15))
    temperature_c = 35 + math.sin(now * 0.35) * 6
    imu_quality_pct = 95 + math.sin(now * 0.13) * 3

    return {
        "schema_version": "1.0.0",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime()) + f".{int((now % 1) * 1000):03d}Z",
        "sequence": state.sequence,
        "vehicle": {
            "id": "ATHENA-SIM-001",
            "connection": {
                "status": "connected",
                "signal_strength_pct": signal_strength_pct,
            },
            "flight": {
                "mode": "CRUISE" if state.sequence % 600 < 400 else "LOITER",
                "system_status": "nominal",
            },
        },
        "attitude": {
            "roll_deg": roll_deg,
            "pitch_deg": pitch_deg,
            "heading_deg": heading_deg,
        },
        "altitude": {
            "relative_m": relative_m,
            "vertical_speed_mps": vertical_speed_mps,
        },
        "power": {
            "battery_pct": battery_pct,
        },
        "health": {
            "temperature_c": temperature_c,
            "imu_quality_pct": max(0.0, min(100.0, imu_quality_pct)),
        },
        "telemetry_source": "backend-mock",
        "heading_is_estimated": False,
        "altitude_is_relative": True,
        "battery_available": True,
        "calibration_status": "ready",
        "calibration_samples": 0,
        "sensor_status": {
            "imu_ok": True,
            "baro_ok": True,
            "serial_connected": True,
        },
    }
