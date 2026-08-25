from __future__ import annotations

import json
import logging
import threading
import time
from dataclasses import dataclass, field
from typing import Any

import serial
from serial import SerialException

logger = logging.getLogger(__name__)


@dataclass
class SerialState:
    latest_packet: dict[str, Any] | None = None
    latest_error: str | None = None
    connected: bool = False
    updated_at: float = 0.0
    lock: threading.Lock = field(default_factory=threading.Lock)


class SerialTelemetryReader:
    def __init__(self, port: str, baud: int) -> None:
        self._port = port
        self._baud = baud
        self._state = SerialState()
        self._stop_event = threading.Event()
        self._thread: threading.Thread | None = None

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        self._thread = threading.Thread(target=self._run, name="athena-serial-reader", daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=2.0)

    def snapshot(self) -> SerialState:
        with self._state.lock:
            return SerialState(
                latest_packet=self._state.latest_packet,
                latest_error=self._state.latest_error,
                connected=self._state.connected,
                updated_at=self._state.updated_at,
            )

    def _set_error(self, message: str) -> None:
        with self._state.lock:
            self._state.latest_error = message
            self._state.connected = False
        logger.error(message)

    def _set_packet(self, packet: dict[str, Any]) -> None:
        with self._state.lock:
            self._state.latest_packet = packet
            self._state.latest_error = None
            self._state.connected = True
            self._state.updated_at = time.time()

    def _run(self) -> None:
        if not self._port:
            self._set_error(
                "ATHENA_TELEMETRY_MODE=hardware but ATHENA_SERIAL_PORT is empty. "
                "Set ATHENA_SERIAL_PORT (example: COM3)."
            )
            return

        while not self._stop_event.is_set():
            try:
                logger.info("Opening serial port %s at %s baud...", self._port, self._baud)
                with serial.Serial(self._port, self._baud, timeout=1.0) as ser:
                    with self._state.lock:
                        self._state.connected = True
                        self._state.latest_error = None
                    logger.info("Serial port connected: %s", self._port)

                    while not self._stop_event.is_set():
                        raw_line = ser.readline()
                        if not raw_line:
                            continue
                        try:
                            line = raw_line.decode("utf-8", errors="replace").strip()
                            if not line:
                                continue
                            packet = json.loads(line)
                            if isinstance(packet, dict):
                                self._set_packet(packet)
                        except json.JSONDecodeError:
                            # Ignore malformed lines and continue streaming.
                            continue
                        except Exception as exc:  # noqa: BLE001
                            self._set_error(f"Serial decode error: {exc}")
            except SerialException as exc:
                self._set_error(f"Serial connection failed on {self._port}: {exc}")
            except Exception as exc:  # noqa: BLE001
                self._set_error(f"Unexpected serial reader error: {exc}")

            if self._stop_event.is_set():
                break
            time.sleep(2.0)
