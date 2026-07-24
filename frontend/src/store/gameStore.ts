import { create } from "zustand";
import {
  type Player,
  type Cell,
  type Sector,
  makeBoard,
  valuesForRound,
} from "../types/wheelGame";

type GameStore = {
  players: Player[];
  currentPlayerIndex: number;
  round: 1 | 2;
  spinsRemaining: number;
  board: Cell[][];
  activeCategory: number | null;
  announcer: string;

  // Wheel states
  isSpinning: boolean;
  spinResult: Sector | null;

  initGame: (playerCount: number, spinsPerRound: number) => void;
  setSpinning: (spinning: boolean) => void;
  setSpinResult: (sector: Sector | null) => void;
  selectCategory: (category: number) => void;
  selectCell: (category: number, row: number) => void;
};

const useGameStore = create<GameStore>()((set) => ({
  players: [
    { id: 0, name: "Player 1", score: 0, tokens: 0 },
    { id: 1, name: "Player 2", score: 0, tokens: 0 },
  ],
  currentPlayerIndex: 0,
  round: 1,
  spinsRemaining: 30,
  board: makeBoard(valuesForRound(1)),
  activeCategory: null,
  announcer: "",

  isSpinning: false,
  spinResult: null,

  initGame: (playerCount, spinsPerRound) =>
    set(() => ({
      players: Array.from({ length: playerCount }, (_, idx) => ({
        id: idx,
        name: `Player ${idx + 1}`,
        score: 0,
        tokens: 0,
      })),

      round: 1,
      spinsRemaining: spinsPerRound,
      board: makeBoard(valuesForRound(1)),
    })),

  setSpinning: (spinning) => set(() => ({ isSpinning: spinning })),

  setSpinResult: (sector) => set(() => ({ spinResult: sector })),

  selectCategory: (category) => set(() => ({ activeCategory: category })),

  selectCell: (category, row) =>
    set((state) => {
      const board = state.board.map((col, idx) =>
        idx === category
          ? col.map((cell, j) =>
              j === row ? { ...cell, answered: true } : cell,
            )
          : col,
      );

      return { board };
    }),
}));

export default useGameStore;