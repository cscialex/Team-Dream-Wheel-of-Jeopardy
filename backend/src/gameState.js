import { makeBoard, valuesForRound } from "./wheelOfJeopardy";
export const gameState = {
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
};
export function registerPlayer(name) {
    const newPlayer = {
        id: gameState.players.length,
        name,
        score: 0,
        tokens: 0
    };
    gameState.players.push(newPlayer);
    return newPlayer;
}
export function selectCategory(category) {
    gameState.activeCategory = category;
}
export function selectCell(category, row) {
    gameState.board[category][row] = { ...gameState.board[category][row], answered: true };
}
