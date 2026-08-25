from __future__ import annotations

import asyncio
import json
import logging

from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from athena_backend.config import load_settings
from athena_backend.mock_source import MockState, generate_mock_packet
from athena_backend.normalizer import HardwareNormalizer
from athena_backend.serial_source import SerialTelemetryReader

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger("athena-backend")

settings = load_settings()

mock_state = MockState()
hardware_normalizer = HardwareNormalizer(vehicle_id=settings.vehicle_id)
serial_reader = SerialTelemetryReader(settings.serial_port, settings.serial_baud)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Start the serial reader thread on boot and shut it down cleanly on exit."""
    logger.info("Athena backend starting in mode=%s", settings.telemetry_mode)
    if settings.telemetry_mode == "hardware":
        serial_reader.start()
    try:
        yield
    finally:
        serial_reader.stop()


app = FastAPI(title="Project Athena Telemetry Backend", lifespan=lifespan)


@app.get("/health")
async def health() -> dict:
    snapshot = serial_reader.snapshot()
    return {
        "ok": True,
        "mode": settings.telemetry_mode,
        "serial_connected": snapshot.connected,
        "serial_error": snapshot.latest_error,
    }


@app.websocket("/ws/telemetry")
async def telemetry_ws(websocket: WebSocket) -> None:
    await websocket.accept()
    hz = max(1.0, settings.ws_hz)
    interval = 1.0 / hz
    logger.info("WebSocket telemetry client connected")

    try:
        while True:
            packet: dict
            if settings.telemetry_mode == "hardware":
                snapshot = serial_reader.snapshot()
                if snapshot.latest_packet is not None:
                    packet = hardware_normalizer.normalize(
                        snapshot.latest_packet,
                        serial_connected=snapshot.connected,
                        serial_error=snapshot.latest_error,
                    )
                else:
                    packet = hardware_normalizer.disconnected_payload(snapshot.latest_error)
            else:
                packet = generate_mock_packet(mock_state)

            await websocket.send_text(json.dumps(packet))
            await asyncio.sleep(interval)
    except WebSocketDisconnect:
        logger.info("WebSocket telemetry client disconnected")
