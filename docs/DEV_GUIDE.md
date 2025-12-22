# Development Guide

## Workflow
- Use feature branches named `feature/<topic>` or `fix/<issue>`.
- Keep commits small and descriptive; include context on affected module (e.g., `front: add projectile effects`).
- Open PRs with a concise summary and testing notes. Reuse prior PR body when doing follow-ups.

## Code Locations
- **Backend**: `back/cmd/main.go` contains HTTP handlers for `/api/hello` and `/api/greet`.
- **Frontend entry**: `front/src/App.js` wires the greeting form, 2048, and tower defense sections.
- **Tower Defense logic**: `front/src/components/gameEngine.js` (pure functions) plus UI in `RandomTowerDefense.js` and balance in `rt_d_rules.js`.
- **2048**: `front/src/components/Game2048.js`.

## Conventions
- Prefer pure functions for game logic (already applied in `gameEngine.js`).
- Avoid introducing new dependencies unless necessary.
- Keep CSS scoped to the component folder (e.g., `RandomTowerDefense.css`).
- Do not commit build artifacts (`node_modules`, `dist`, `build`).

## Running & Testing
- Dev both stacks together: `npm run dev` at repo root.
- Backend only: `cd back && go run ./cmd/...`.
- Frontend only: `cd front && npm start`.
- Add automated tests where practical; current Go handlers can be tested with `go test ./...` from `back/`.

## Environment & Config
- Frontend API target can be overridden via `REACT_APP_API_BASE`.
- Dev proxy is defined in `front/vite.config.js` for `/api` → `http://localhost:8080`.

## Review Checklist
- No lint/build errors (run frontend build/tests or Go tests as applicable).
- Ports 3000/8080 documented for dev; avoid hardcoding new ports.
- Preserve existing features: greeting form, 2048, tower defense interactions.
