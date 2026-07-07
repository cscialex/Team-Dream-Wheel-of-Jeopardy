# Project Rules — Wheel of Jeopardy, SKELETAL Increment

This is the SKELETAL increment of a three-increment course project (skeletal → minimal → target). The skeletal increment ONLY validates the architecture: all subsystems exist and can exchange the messages defined in the SRS. Nothing more.

## IN SCOPE

- Three subsystems per the architecture diagram: SS-01 UI (HTML5/CSS3/JS in browser), SS-02 Game Logic (Node.js), SS-03 Question Repository (module that reads/writes a SQLite file directly, no ORM).
- Every message name and payload shape from SRS §6.1 (UI→GL), §6.2 (GL→UI), and §6.3 (GL→Repo call signatures) — as stub handlers that log the message and return hardcoded/canned responses.
- A simple demo harness UI to send each message and display responses (a "chat between subsystems" demo).
- Stubs and drivers to test each interface independently.

## OUT OF SCOPE — do NOT implement, even partially, even if it seems easy

- Any game rules or logic: spin resolution, wheel events (Bankrupt, Lose Turn, Free Spin, Player's/Opponents' Choice), scoring, tokens, turn/round management, winner calculation.
- Any real UI screens from SRS §7 (game board, wheel animation, question modal, scoreboard, admin panel).
- Real question data, repository validation logic, or working CRUD — repository functions return hardcoded sample data or `{success: true}` stubs only.
- Database schema beyond the bare minimum needed to prove the GL→SQLite connection works.

If a task appears to require any out-of-scope item, stub it and note it in SKELETAL_NOTES.md instead of implementing it. When in doubt, do less.
