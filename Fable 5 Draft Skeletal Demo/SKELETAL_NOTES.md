# SKELETAL_NOTES — Rubric Verification & Scope Notes

Verified on 2026-07-06 against the skeletal rubric (subsystems present per SRS,
messaging per SRS §6, working-architecture demo). Verification method: both drivers run,
all HTTP endpoints exercised, and the demo page driven in a real browser (message send,
chat round trip, SQLite round trip) with zero console errors.

## 1. All three subsystems exist and run — YES

| Subsystem | Location | How to run/see it |
|---|---|---|
| SS-01 UI | `ui/` | open <http://localhost:3000> after starting the server |
| SS-02 Game Logic | `game-logic/server.js` | `node game-logic/server.js` |
| SS-03 Repository | `repository/repository.js` | imported by SS-02; standalone via `node drivers/drive-repository.js` |

## 2. Every SRS §6 message is implemented — YES

All names and payload shapes are defined once in `shared/messages.js` and match the SRS
verbatim. No missing or misnamed messages/fields found.

**§6.1 UI→GL (13/13)** — each received by the stub handler in `game-logic/server.js`
(`handleUiMessage`), logged, and answered with a canned §6.2 reply:
GAME_SETUP, SPIN_WHEEL, SELECT_QUESTION, SUBMIT_ANSWER, REDEEM_TOKEN, DECLINE_TOKEN,
OPPONENTS_CHOICE_MADE, ADMIN_CREATE_CATEGORY, ADMIN_UPDATE_CATEGORY,
ADMIN_DELETE_CATEGORY, ADMIN_CREATE_QUESTION, ADMIN_UPDATE_QUESTION,
ADMIN_DELETE_QUESTION.

**§6.2 GL→UI (11/11)** — all defined in `shared/messages.js` with canned example
payloads; sent to the UI over the SSE stream by `pushToUI`:
GAME_STATE_UPDATE, SPIN_RESULT, PROMPT_CATEGORY_SELECT, SHOW_QUESTION, ANSWER_RESULT,
PROMPT_TOKEN_REDEMPTION, TURN_CHANGED, ROUND_END, GAME_OVER, ERROR, ADMIN_OP_RESULT.
Seven are exercised live as canned replies (see REPLY_MAP; ERROR fires on unknown
message types). PROMPT_CATEGORY_SELECT, PROMPT_TOKEN_REDEMPTION, ROUND_END, and
GAME_OVER are defined with canned instances but have no §6.1 trigger in the demo,
because pairing them with a trigger would require rule logic (out of scope).

**§6.3 GL→Repo (10/10)** — all ten call signatures exposed by
`repository/repository.js`: getAllCategories, getQuestionsByCategory, getQuestionById,
validateRepository, createCategory, updateCategory, deleteCategory, createQuestion,
updateQuestion, deleteQuestion. `getAllCategories()` performs a REAL read from
`repository/questions.sqlite` (full UI→GL→Repo→SQLite→back round trip); the other nine
return hardcoded data in the SRS return shapes.

## 3. Demo capabilities — YES (all verified working)

- Free-text chat between subsystems: UI→GL→UI round trip via the chat panel.
- Each §6.1 message type round-trips via the dropdown + payload editor, with a
  timestamped, direction-labeled live log; the server console prints both sides.
- One real read from the SQLite file: "Read categories" button shows the 3 seed rows
  read from `repository/questions.sqlite`.
- Each §6.3 repository call is selectable in the demo (dropdown + editable JSON
  arguments); GL invokes it and the GL→Repo / Repo→GL sides appear in the log.
  Reminder for demo viewers: create/update/delete calls are stubs — e.g.
  `createCategory` returns the canned `{categoryId: 999, success: true, error: null}`
  without writing to SQLite, so a subsequent `getAllCategories` still shows the 3 seed
  rows. This is intentional (working CRUD is out of scope for skeletal).
- Drivers: `drivers/drive-game-logic.js` (GL without UI) and
  `drivers/drive-repository.js` (Repo without GL) both run clean.

## 4. Out-of-scope logic check — CLEAN

Grepped all `.js` files for scoring/token/round/bankrupt/winner logic. Every match is a
message-name constant or a canned payload literal in `shared/messages.js` — there are no
conditionals or computations on game state anywhere. No spin resolution, wheel events,
scoring, tokens, turn/round management, winner calculation, real SRS §7 screens, real
question data, repository validation logic, or working CRUD.

## Deferred to later increments (stubbed here)

- **Canned reply pairing**: REPLY_MAP in `shared/messages.js` maps each §6.1 message to
  a fixed §6.2 reply purely so the demo has something to show. The pairing is NOT rule
  evaluation (e.g., REDEEM_TOKEN → canned GAME_STATE_UPDATE) and will be replaced by the
  real state machine in the minimal increment.
- **boardState shape**: SRS §6.2 GAME_STATE_UPDATE lists `boardState` without defining
  its structure; the canned example uses a placeholder object.
- **Database schema**: only the `categories` table (SRS §4.3 columns) with 3 seed rows —
  the bare minimum to prove the GL→SQLite connection. Question/Answer tables arrive with
  the minimal increment.
- **Transport choice**: HTTP POST (UI→GL) + Server-Sent Events (GL→UI), chosen over
  WebSocket to keep the increment zero-dependency (built-in Node modules only).
- **CHAT_TEXT / REPO_READ_RESULT / REPO_ROUNDTRIP_DEMO**: demo-harness-only message
  types, clearly not part of the SRS §6 contract.
- **Question-getter echo**: `getQuestionsByCategory` and `getQuestionById` echo the
  requested id into their canned payload so demo responses stay coherent with requests.
  Still stubs — there is no question table, no query, and no lookup; every other field
  is the same hardcoded CANNED_QUESTION.
