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
    awaiting: "spin" | "categorySelect" | "questionSelect" | "answerSelect" | null;
    currentQuestion: {
      questionText: string;
      answers: { answerId: number; answerText: string }[];
    } | null;
    


    join: (name: string) => void;
    startGame: () => void;
    endGame: () => void;

    setPhase: (phase: GamePhase) => void;
    selectCategory: (category: number) => void;
    selectCell: (category: number, row: number) => void;
    selectAnswer: (answerId: number) => void;
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
    awaiting: null,
    currentQuestion: null,

    join: (name) => gameSocket.emit("join", { name }),

    startGame: () => gameSocket.emit("startGame", {}),

    endGame: () => gameSocket.emit("endGame", {}),

    setPhase: (phase) => set(() => ({ phase })),

    selectCategory: (category) => gameSocket.emit("selectCategory", { category }),

    selectCell: (category, row) => gameSocket.emit("selectCell", { category, row }),

    selectAnswer: (answerId) => gameSocket.emit("selectAnswer", { answerId }),

    applyServerState: (state: Partial<GameState>) => set(state),
}));

gameSocket.on("state", (state) => useGameStore.getState().applyServerState(state));

export default useGameStore;