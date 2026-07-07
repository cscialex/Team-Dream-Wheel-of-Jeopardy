# Wheel of Jeopardy — Skeletal Increment

Skeletal increment of the three-increment course project (skeletal → minimal → target).
It validates the architecture only: the three subsystems exist and exchange the messages
defined in SRS §6 as stubs with canned replies. **No game logic is implemented** — see
[CLAUDE.md](CLAUDE.md) for scope rules and [SKELETAL_NOTES.md](SKELETAL_NOTES.md) for the
rubric verification.

## Subsystems (per the architecture diagram)

| Subsystem | Directory | Technology |
|---|---|---|
| SS-01 UI (Presentation Tier) | `ui/` | Static HTML5/CSS3/JS in the browser, no frameworks |
| SS-02 Game Logic (Business Logic Tier) | `game-logic/` | Node.js HTTP server (built-in `node:http` only) |
| SS-03 Question Repository (Data Tier) | `repository/` | Node.js module reading a SQLite file directly via built-in `node:sqlite` (no ORM) |

Transport UI↔GL: HTTP POST for UI→GL messages, Server-Sent Events for GL→UI messages.
The shared message contract (every SRS §6.1/§6.2/§6.3 name and payload shape) lives in
one file: [shared/messages.js](shared/messages.js).

## Prerequisites

- Node.js **v22.5 or later** (v24 LTS recommended) — needed for the built-in `node:sqlite`
  module. Download from <https://nodejs.org>. There are **no npm dependencies**; nothing
  to install beyond Node itself.

## Run the demo

```sh
node game-logic/server.js
```

Then open **http://localhost:3000** in a browser.

The page is a communications console (not a game screen). It can:

1. Send any of the 13 SRS §6.1 messages (editable JSON payload pre-filled with the SRS
   example) and show the canned §6.2 reply in a timestamped, direction-labeled log.
2. Round-trip a free-text chat message UI→GL→UI.
3. Trigger the full UI→GL→Repository→SQLite→back round trip and display the category
   rows read from `repository/questions.sqlite` (created and seeded on first run).
4. Invoke any of the 10 SRS §6.3 repository calls through Game Logic (editable JSON
   arguments pre-filled with the SRS example), with the GL→Repo call and Repo→GL result
   shown in the log. Note: per the skeletal scope, only `getAllCategories` touches the
   real SQLite file — the other nine (including all create/update/delete) are stubs that
   return canned data and do **not** modify the database.

The server terminal prints a log line for every message received/sent, so both sides of
the conversation are visible during the demo.

## Test each interface independently (stubs and drivers)

With the server running:

```sh
node drivers/drive-game-logic.js    # exercises GL without the UI (all 13 §6.1 messages)
```

No server needed:

```sh
node drivers/drive-repository.js    # exercises the repository without GL (all 10 §6.3 calls)
```
