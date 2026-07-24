import { create } from "zustand";
import {
  type Player,
  type Cell,
  type Sector,
  makeBoard,
  valuesForRound,
} from "../types/wheelOfJeopardy";
import gameSocket from "../gameSocket";

type GamePhase = "setup" | "playing" | "gameOver";

type GameState = {
    players: Player[];
    isSpinning: boolean;
    spinResult: Sector | null;
    phase: GamePhase;
    currentPlayerIndex: number;
    round: 1 | 2;
    spinsRemaining: number;
    board: Cell[][];
    activeCategory: number | null;
    announcer: string;

    join: (name: string) => void;
    startGame: () => void;
    endGame: () => void;

    setPhase: (phase: GamePhase) => void;
    selectCategory: (category: number) => void;
    selectCell: (category: number, row: number) => void;
    applyServerState: (state: Partial<GameState>) => void;
};

const useGameStore = create<GameState>()((set) => ({
    players: [],
    isSpinning: false,
    spinResult: null,
    phase: "setup",
    currentPlayerIndex: 0,
    round: 1,
    spinsRemaining: 30,
    board: makeBoard(valuesForRound(1)),
    activeCategory: null,
    announcer: "",

    join: (name) => gameSocket.emit("join", { name }),

    startGame: () => gameSocket.emit("startGame", {}),

    endGame: () => gameSocket.emit("endGame", {}),

    setPhase: (phase) => set(() => ({ phase })),

    selectCategory: (category) => gameSocket.emit("selectCategory", { category }),

    selectCell: (category, row) => gameSocket.emit("selectCell", { category, row }),

    applyServerState: (state: Partial<GameState>) => set(state),
}));

gameSocket.on("state", (state) => useGameStore.getState().applyServerState(state));

export default useGameStore;