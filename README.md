# go-web

## Quick Start (Windows PowerShell)
1. Install prerequisites: Node.js (>=18), npm, Go (>=1.20). Java is only needed if you plan to replace the Go backend with Spring.
2. From the repo root:
   ```powershell
   npm install
   npm run dev
   ```
   This runs the React frontend and Go API together. The frontend is available at http://localhost:3000 and proxies `/api` to the backend at http://localhost:8080.

> macOS/Linux: use the same commands in your shell (e.g., `bash`).

## About This Project
A small full-stack demo that pairs a Go API with a React (CRA) frontend. The page showcases three features:
- **Hello & Personal Greeting**: call the Go API for messages.
- **2048 Puzzle**: playable 4x4 puzzle implemented in React state.
- **Random Tower Defense**: prototype tower-defense game with tower rolls, upgrades/merges, and effects rendered in the browser.

## Requirements
- Node.js 18+ and npm
- Go 1.20+ (installed and on PATH)
- Java 17+ and Gradle wrapper only if swapping to a Spring backend (not required for the current Go API)
- Git for version control

## Installation & Run
### Combined (recommended during development)
```powershell
npm install
npm run dev
```
- Runs `front/` via CRA/Vite dev command fallback.
- Runs `back/` via `go run ./cmd/...`.
- Proxies `/api` calls from the frontend to `http://localhost:8080`.

### Run individually
```powershell
# Backend
cd back
go run ./cmd/...

# Frontend (in new terminal)
cd front
npm install
npm start
```

## Project Structure
```
root
├─ back/                  # Go API (hello + greeting endpoints)
│  └─ cmd/                # main.go entrypoint
├─ front/                 # React app (CRA), games, and API UI
│  ├─ src/
│  │  ├─ App.js           # Page layout wiring the sections together
│  │  ├─ components/
│  │  │  ├─ Game2048.js
│  │  │  ├─ RandomTowerDefense.js
│  │  │  ├─ gameEngine.js # Tower-defense core logic (pure)
│  │  │  └─ rt_d_rules.js # Shared constants/balance/path
│  └─ vite.config.js      # Dev proxy config for `/api`
├─ package.json           # Root scripts for concurrent dev
└─ docs/                  # Additional developer docs
```

## Environment Variables
Frontend recognizes an override for the API base:
```powershell
# front/.env (or system env)
REACT_APP_API_BASE=http://localhost:8080/api
```
If unset, the frontend defaults to `http://localhost:8080/api`.

## Key Features
- **Go Greeting API**: GET `/api/hello`, POST `/api/greet` with `{ "name": "..." }`.
- **2048 Game**: Classic swipe/arrow controls, score tracking, game-over detection.
- **Random Tower Defense**: Fixed-path enemies, tower rolls/upgrades/merges, range rings, projectiles, and wave management.

## Troubleshooting
- **PowerShell scripts blocked**: run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` (admin PowerShell) to allow npm scripts.
- **npm.ps1 cannot be loaded**: ensure Node.js added itself to PATH; restart the shell after install.
- **`npm run dev` issues**: check Go is on PATH and ports 3000/8080 are free; run backend/frontend separately to isolate problems.
- **CRA port conflict**: set `PORT=3001` (PowerShell: `$env:PORT=3001`) before `npm start`.
- **Proxy failures**: confirm backend runs on 8080; Vite/CRA proxy sends `/api` to that port.

## License
MIT (unless otherwise noted in subdirectories).
