# Team-Dream-Wheel-of-Jeopardy Skeletal Increment

## Overview
This project demonstrates system architecture with subsystem communication using a lightweight backend and SQLite database.

## Branch Structure

- main: Stable skeletal increment baseline
- backend-stubs: Core backend logic and subsystem stubs
- frontend: UI prototype (if applicable)
- db-setup: SQLite setup and schema initialization
- feature/demo-flow: Terminal-based subsystem communication demo

### Frontend
- React, TypeScript, Vite, and MUI for the UI
- Using a Zustand store in gameStore.ts. This is pretty much duplicated from the backend gameState.ts. It just helps us keep things consistent between the frontend and backend. If you add a state in one, add it in the other.
- The board does not have any clicking at the moment. You may need to add a css line as well so the pointer shows a clicker instead of the default pointer
- Wheel will spin, but likely out of sync with the spin function in the backend. Backend spin chooses a random sector but it isnt reflected in the wheel. I'll have to figure this out.

### Backend
- Express and Socket.IO to do the shared game. Socket helps us connect multiple users.
- I only configured this for one game. For multiple games, like with a session key, you probably need to just add a dictionary mapping a key to a specific game state/session
- Database not touched at all, no connection layer established either

### How it connects
- The client will emit a socket event when the user interacts with the UI.
- Server will mutate the game state according to the socket event.
- Server continuously emits the new game state after every event!! which is how we keep things in sync
- Rely on the backend as the source of truth! frontend just displays the updates and backend state.

### What we have
- Join, start game phase transition (you guys may need to add more for the game flow, or another phase var)
- Category selection emit
- Spin emit

### How to run it
You'll need two terminals.
- **Backend Server:** cd backend && npm install && npm run dev
- **Frontend :** cd frontend && npm install && npm run dev

Open one regular browser and one incognito browser. You should be able to "play" back and forth with two users when everything gets set up. URL is: <localhost:5173>