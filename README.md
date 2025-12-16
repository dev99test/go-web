# go-web

## Development

Install the root toolchain dependencies:

```bash
npm install
```

Then start both the React frontend and Go API together:

```bash
npm run dev
```

- Frontend runs from `front/` (falls back to `npm start` if no `dev` script is available).
- Backend runs from `back/` with `go run ./cmd/...`.

The frontend dev server proxies `/api` requests to the Go backend on `http://localhost:8080` via the Vite dev server configuration (`front/vite.config.js`).
