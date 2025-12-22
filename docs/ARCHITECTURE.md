# Architecture

## Overview
- **Frontend**: React (CRA) app in `front/`. Dev server runs on port 3000 and proxies `/api` to the backend.
- **Backend**: Go HTTP server in `back/cmd/main.go` exposing `/api/hello` and `/api/greet` on port 8080.
- **Dev Orchestration**: `npm run dev` (root) runs both servers via `concurrently`.

## Request Flow
1. Browser hits the CRA dev server at `http://localhost:3000`.
2. Frontend API calls use `/api/...`:
   - Dev server proxy (see `front/vite.config.js`) forwards to `http://localhost:8080`.
   - In production you can serve the built frontend from any host and point `REACT_APP_API_BASE` to the Go API.
3. The Go server responds with JSON; the frontend renders greeting text or updates game state accordingly.

## Data Flow Examples
- **Hello/Greet**: `App.js` calls `/api/hello` on load, and `/api/greet` on form submit; responses populate UI strings.
- **Tower Defense**: Core logic lives in `front/src/components/gameEngine.js` (pure functions). UI state in `RandomTowerDefense.js` dispatches actions and renders overlays.
- **2048**: `Game2048.js` manages its own state locally without backend calls.

## Build/Run Targets
- **Frontend**: `npm start` (CRA) in `front/`; uses `react-scripts`.
- **Backend**: `go run ./cmd/...` in `back/`.
- **Root Dev**: `npm run dev` to run both simultaneously during development.

## Proxy & Ports
- Frontend dev: port **3000**.
- Backend dev: port **8080**.
- Proxy: `/api` forwarded from 3000 → 8080 (configured in `front/vite.config.js`).
