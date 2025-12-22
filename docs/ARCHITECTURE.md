# Architecture

## Overview
- **Frontend**: React (CRA) app in `front/` running on port **3000**.
- **Backend**: Go HTTP server in `back/cmd/main.go` running on port **8080**.
- **Dev Orchestration**: Root `npm run dev` starts both via `concurrently`.

## Request Flow
1. Browser loads the React app from `http://localhost:3000`.
2. Frontend calls the Go API directly using `REACT_APP_API_BASE` (default: `http://localhost:8080/api`).
3. Go server responds with JSON; the UI renders greeting text or updates game state.

## Data Flow (Key Screens)
- **Greeting UI**: `front/src/App.js` calls `/api/hello` on load and `/api/greet` on submit.
- **2048**: `front/src/components/Game2048.js` manages local state.
- **Random Tower Defense**: logic in `front/src/components/gameEngine.js`, UI in `RandomTowerDefense.js`, balance data in `rt_d_rules.js`.
