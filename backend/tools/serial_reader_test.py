from __future__ import annotations

import argparse
import json

import serial


def main() -> None:
    parser = argparse.ArgumentParser(description="Read ESP32 JSON telemetry from serial and print parsed packets.")
    parser.add_argument("--port", required=True, help="Serial port, e.g. COM3")
    parser.add_argument("--baud", type=int, default=115200, help="Serial baud rate")
    args = parser.parse_args()

    print(f"Opening {args.port} @ {args.baud}...")
    with serial.Serial(args.port, args.baud, timeout=1.0) as ser:
        while True:
            line = ser.readline().decode("utf-8", errors="replace").strip()
            if not line:
                continue
            try:
                payload = json.loads(line)
                print(json.dumps(payload, indent=2))
            except json.JSONDecodeError:
                print(f"[non-json] {line}")


if __name__ == "__main__":
    main()
