# go-web

## Quick Start (Windows PowerShell)
```powershell
# 1) Install root tooling
npm install

# 2) Install frontend dependencies
npm --prefix front install

# 3) Run both frontend + backend together
npm run dev
```
- Frontend: http://localhost:3000
- Backend: http://localhost:8080

> macOS/Linux: use the same commands in your shell.

## What This Project Is
A small full-stack demo with:
- **Go API** for greeting messages
- **React (CRA) frontend** with a 2048 game and Random Tower Defense prototype

## Requirements (Windows)
- **Node.js 18+** (includes npm)
- **Go 1.20+**
- **Git**

## Run Separately
```powershell
# Backend (Go)
cd back
go run ./cmd/...

# Frontend (React, in a new terminal)
cd front
npm install
npm start
```

## Environment Variables
Frontend uses a direct API base URL (no proxy required).
```powershell
# front/.env
REACT_APP_API_BASE=http://localhost:8080/api
```

## Project Structure
```
root
├─ back/                  # Go API
├─ front/                 # React (CRA) app
│  └─ src/components/     # 2048 + Random Tower Defense
├─ package.json           # npm run dev (concurrently)
└─ docs/                  # Project docs
```

## 주요 기능
- **인사말 API**: `/api/hello`, `/api/greet`
- **2048 게임**: 키보드/버튼 조작
- **랜덤 타워 디펜스**: 타워 배치/업그레이드/합성, 웨이브 전투

## Troubleshooting (Windows)
- **npm.ps1 실행 차단**
  ```powershell
  Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
  ```
- **포트 충돌 (3000/8080)**: 다른 프로세스를 종료하거나 포트를 변경한 뒤 다시 실행하세요.

## Docs
- [Architecture](docs/ARCHITECTURE.md)
- [API Reference](docs/API.md)
- [Development Guide](docs/DEV_GUIDE.md)
