# Project Athena Frontend

React + Vite + TypeScript telemetry dashboard for Project Athena.

The frontend supports:

- `live` mode: real telemetry from FastAPI WebSocket
- `mock` mode: frontend-generated telemetry fallback
- `simulation` mode: same data source as mock, different mode label for demos

## Environment Variables

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Variables:

- `VITE_WS_URL` - backend WebSocket endpoint
  - default: `ws://127.0.0.1:8000/ws/telemetry`
- `VITE_TELEMETRY_MODE` - startup behavior
  - allowed: `auto`, `live`, `mock`, `simulation`
  - `auto` starts with mock visuals immediately, then attempts live connection

## Local Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
npm run preview
```

## Backend Contract Reference

Live mode expects the backend payload contract grouped by:

- `vehicle`
- `attitude`
- `altitude`
- `power`
- `health`

With the following key enums:

- `vehicle.connection.status`: `connected | degraded | disconnected`
- `vehicle.flight.mode`: `STABILIZE | AUTO_LEVEL | CRUISE | LOITER | RTL`
- `vehicle.flight.system_status`: `nominal | caution | warning`

## Netlify Notes

- This frontend remains static-hosting compatible.
- Set `VITE_WS_URL` in Netlify environment settings to your deployed backend WebSocket URL (typically `wss://...`).
- `vite.config.ts` already uses `base: './'` for static hosting compatibility.
