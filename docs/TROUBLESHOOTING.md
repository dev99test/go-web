# Troubleshooting

## Windows PowerShell
- `npm.ps1 cannot be loaded`: ensure Node.js is installed with PATH; re-open PowerShell.
- Scripts blocked: run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` in admin PowerShell, then retry.

## React (CRA) Issues
- Port 3000 busy: set a new port before starting
  ```powershell
  $env:PORT=3001
  npm start
  ```
- Dev server fails to proxy `/api`: confirm backend is running on `http://localhost:8080`; check `front/vite.config.js`.
- Stuck cache: delete `front/node_modules` and rerun `npm install`.

## Root Dev Script (`npm run dev`)
- If one service fails, run separately to isolate:
  ```powershell
  # Backend
  cd back
  go run ./cmd/...

  # Frontend (new shell)
  cd front
  npm start
  ```
- `concurrently` not found: ensure `npm install` ran at repo root.

## Go Backend
- Port 8080 busy: set `PORT` alternative by running the server manually (edit command or export `PORT` and update proxy accordingly).
- JSON decode errors: ensure requests send `Content-Type: application/json`.

## Vite Config Presence
- The project uses CRA but keeps `front/vite.config.js` for proxy defaults. CRA ignores it; it is used only when running `npm run dev:front` with Vite fallback logic.
