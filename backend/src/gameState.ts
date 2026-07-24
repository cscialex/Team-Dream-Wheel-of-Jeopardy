import { type Player, type Cell, type Sector, makeBoard, valuesForRound, SECTORS } from "./wheelOfJeopardy";

type GamePhase = "setup" | "playing" | "gameOver";

export type GameState = {
    players: Player[];
    phase: GamePhase;
    currentPlayerIndex: number;
    round: 1 | 2;
    spinsRemaining: number;
    board: Cell[][];
    activeCategory: number | null;
    announcer: string;
    isSpinning: boolean;
    spinResult: Sector | null;
}

export const gameState: GameState = {
    players: [],
    phase: "setup",
    currentPlayerIndex: 0,
    round: 1,
    spinsRemaining: 30,
    board: makeBoard(valuesForRound(1)),
    activeCategory: null,
    announcer: "",
    isSpinning: false,
    spinResult: null
}

export function registerPlayer(name: string): Player {
    const newPlayer: Player = {
        id: gameState.players.length,
        name,
        score: 0,
        tokens: 0
    }

    gameState.players.push(newPlayer);
    return newPlayer;
}

export function startGame() {
    gameState.phase = "playing";
}

export function endGame() {
    gameState.phase = "gameOver"; // no dedicated game over page yet
}

export function selectCategory(category: number) {
    gameState.activeCategory = category;
}

export function selectCell(category: number, row: number) {
    gameState.board[category][row] = { ...gameState.board[category][row], answered: true }
}

export function startSpin() {
    gameState.isSpinning = true;
    gameState.spinResult = null;
}

export function finishSpin(): Sector {
    const sector = SECTORS[Math.floor(Math.random() * SECTORS.length)];
    gameState.isSpinning = false;
    gameState.spinResult = sector;
    return sector;
}