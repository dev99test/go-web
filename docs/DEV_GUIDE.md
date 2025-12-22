# Development Guide

## One-Command Dev (PowerShell)
```powershell
npm install
npm --prefix front install
npm run dev
```

## Run Separately
```powershell
# Backend
cd back
go run ./cmd/...

# Frontend (new terminal)
cd front
npm install
npm start
```

## Code Locations
- API handlers: `back/cmd/main.go`
- Frontend entry: `front/src/App.js`
- 2048: `front/src/components/Game2048.js`
- Tower Defense UI: `front/src/components/RandomTowerDefense.js`
- Tower Defense logic: `front/src/components/gameEngine.js`
- Balance/path data: `front/src/components/rt_d_rules.js`

## Commit & PR Rules
- Keep commits small and focused.
- Do not commit build artifacts (`node_modules`, `dist`, `build`).
- Include testing notes in PRs (or state “Not run”).
