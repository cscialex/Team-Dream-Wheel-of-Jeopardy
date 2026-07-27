# Wheel of Jeopardy — Minimal Increment

Integrated build of the Team Dream Wheel of Jeopardy game for the minimal increment.
Monique's React/Socket.IO frontend is wired to Noah's Express/Socket.IO backend and
SQLite question repository. The backend is the single source of truth for game state;
the frontend renders whatever the backend broadcasts.

## Architecture

```
Browser (React + zustand)  ──socket.io──►  Node backend (Express + Socket.IO)
   frontend/  :5173                             backend/  :4000
                                                   │
                                                   └── SQLite (better-sqlite3)
                                                        backend/database/woj_questions.db
```

- **frontend/** — React + TypeScript + Vite + MUI, zustand store, `socket.io-client`.
- **backend/** — Express + Socket.IO server and the SS-03 Question Repository
  (`better-sqlite3`). Seeds the database on first run.

The client emits socket events (`join`, `startGame`, `spin`, `selectCategory`,
`selectCell`, `selectAnswer`); the server mutates state and re-broadcasts the full
game state after every event.

## Prerequisites

- **Node.js 20 LTS or 22 LTS.** Avoid Node 24 — `better-sqlite3` may not have a
  prebuilt binary for it and will try (and often fail) to compile from source.
  Check with `node -v`; use `nvm` to switch if needed.
- npm (bundled with Node).

## Setup & run (two terminals)

Start the **backend first** so the socket server is listening before the UI connects.

**Terminal 1 — backend (port 4000):**
```bash
cd backend
npm install
npm run dev        # node --watch; auto-restarts on save
```
Wait for:
```
Backend server listening on localhost at port: 4000
Repository validation: { valid: true, errors: [] }
```
The database is created and seeded automatically on first start.

**Terminal 2 — frontend (port 5173):**
```bash
cd frontend
npm install        # if it errors on peer deps, use: npm install --legacy-peer-deps
npm run dev
```
Open the URL Vite prints (http://localhost:5173). For a 2-player test, open a second
window in incognito.

> **Ports are hardcoded.** The frontend connects to `http://localhost:4000` and the
> backend allows CORS only from `http://localhost:5173`. If 5173 is taken, Vite will
> start on 5174 and CORS will block the socket — free up 5173 or update both constants
> (`frontend/src/gameSocket.ts` and `APP_ORIGIN` in `backend/src/gameServer.js`).

## What works / known gaps

Working: join, start, wheel spin (with sector effects — Free Spin tokens, Bankrupt),
category/value selection, question display, and answer scoring.

Not yet implemented (in progress):
- Free Spin **token redemption** (Lose Turn / incorrect-answer exchange).
- Some rule checks (round transitions/doubling edge cases, co-winner tie handling,
  full turn-flow enforcement).
- `npm run build` currently fails on strict TypeScript lint errors — **use
  `npm run dev`**; a `tsconfig`/cleanup pass is pending.

## Troubleshooting

- **`ERR_CONNECTION_REFUSED` on `localhost:4000`** — the backend isn't running.
  Start it (Terminal 1) and confirm the "listening" line. An unhandled error in a
  socket handler will crash the Node process, so also check that terminal for a stack
  trace.
- **`gyp` / build errors during `npm install` (backend)** — Node version mismatch for
  `better-sqlite3`. Switch to Node 20/22 LTS and reinstall, or run
  `xcode-select --install` and retry.
- **Blank frontend screen** — check the browser console. A bad/deep import or a
  reference to a store field that doesn't exist will halt rendering. Clearing the Vite
  cache can help: `rm -rf frontend/node_modules/.vite`.
- **State looks out of sync after restarting the backend** — game state is in memory,
  so a backend restart resets to the setup phase. Refresh the browser and replay.

## Repository hygiene

`node_modules/`, `dist/`, `database/*.db`, and editor/OS junk are gitignored and must
not be committed. `package-lock.json` **is** committed for reproducible installs.
