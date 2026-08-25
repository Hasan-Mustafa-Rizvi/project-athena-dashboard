from __future__ import annotations

import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


TelemetryMode = str


@dataclass(frozen=True)
class Settings:
    telemetry_mode: TelemetryMode
    serial_port: str
    serial_baud: int
    vehicle_id: str
    ws_hz: float


def _get_mode() -> TelemetryMode:
    raw = os.getenv("ATHENA_TELEMETRY_MODE", "mock").strip().lower()
    if raw not in {"mock", "hardware"}:
        return "mock"
    return raw


def load_settings() -> Settings:
    return Settings(
        telemetry_mode=_get_mode(),
        serial_port=os.getenv("ATHENA_SERIAL_PORT", "").strip(),
        serial_baud=int(os.getenv("ATHENA_SERIAL_BAUD", "115200")),
        vehicle_id=os.getenv("ATHENA_VEHICLE_ID", "ATHENA-HW-001").strip() or "ATHENA-HW-001",
        ws_hz=float(os.getenv("ATHENA_WS_HZ", "10")),
    )
