import { createServer } from "node:http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import QuestionRepository from "./questionRepository.js";

const APP_ORIGIN = process.env.APP_ORIGIN ?? "http://localhost:5173";
const PORT = Number(process.env.PORT ?? 4000);
const SPIN_DURATION_MS = 4000;
const ROUND1_VALUES = [100, 200, 300, 400, 500];
const CAT_COLORS = [
  "var(--color-blue)",
  "var(--color-red)",
  "var(--color-green)",
  "var(--color-purple)",
  "var(--color-orange)",
  "var(--color-teal)",
];

const repository = new QuestionRepository();
repository.seedIfEmpty();

const categories = repository.getAllCategories().slice(0, 6);
const categoryLabels = categories.map((category) => category.categoryName);

const SPECIAL_SECTORS = [
  { type: "loseTurn", label: "Lose Turn", color: "var(--color-dark-grey)" },
  { type: "freeSpin", label: "Free Spin", color: "var(--color-gold)" },
  { type: "bankrupt", label: "Bankrupt", color: "var(--color-dark-red)" },
  { type: "playersChoice", label: "Player's Choice", color: "#0ea5e9" },
  { type: "opponentsChoice", label: "Opponents' Choice", color: "#c026d3" },
];

const SECTORS = [
  ...categoryLabels.map((name, index) => ({
    type: "category",
    label: name,
    color: CAT_COLORS[index],
    catIndex: index,
  })),
  ...SPECIAL_SECTORS,
];

const gameState = {
  players: [],
  phase: "setup",
  currentPlayerIndex: 0,
  round: 1,
  spinsRemaining: 30,
  board: makeBoard(),
  activeCategory: null,
  announcer: "Waiting for players to join.",
  isSpinning: false,
  spinResult: null,
  currentQuestion: null,
};

const app = express();
app.use(cors({ origin: APP_ORIGIN }));
app.use(express.json());

const httpServer = createServer(app);
const gameServer = new Server(httpServer, {
  cors: {
    origin: APP_ORIGIN,
    methods: ["GET", "POST"],
  },
});

/* -------------------------------------------------------------------------- */
/* Repository HTTP API: supports terminal curl tests and backend validation.   */
/* -------------------------------------------------------------------------- */

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, subsystem: "SS-03 Question Repository", language: "JavaScript" });
});

app.get("/api/categories", (_req, res) => {
  res.json(repository.getAllCategories());
});

app.get("/api/questions/category/:categoryId", (req, res) => {
  const categoryId = Number(req.params.categoryId);
  if (!Number.isInteger(categoryId)) {
    return res.status(400).json({ error: "categoryId must be an integer." });
  }

  res.json(repository.getQuestionsByCategory(categoryId));
});

app.get("/api/questions/:questionId", (req, res) => {
  const questionId = Number(req.params.questionId);
  if (!Number.isInteger(questionId)) {
    return res.status(400).json({ error: "questionId must be an integer." });
  }

  const question = repository.getQuestionById(questionId);
  if (!question) {
    return res.status(404).json({ error: "Question not found." });
  }

  res.json(question);
});

app.get("/api/validate", (_req, res) => {
  res.json(repository.validateRepository());
});

/* -------------------------------------------------------------------------- */
/* Socket.IO API: preserves the current frontend events from gameStore.ts.     */
/* -------------------------------------------------------------------------- */

function emitState() {
  gameServer.emit("state", gameState);
}

function handleJoin({ name } = {}) {
  const cleanName = name?.trim();
  if (!cleanName) return;

  if (gameState.players.length >= 4) {
    gameState.announcer = "The game already has the maximum of 4 players.";
    emitState();
    return;
  }

  const player = {
    id: gameState.players.length,
    name: cleanName,
    score: 0,
    tokens: 0,
  };

  gameState.players.push(player);
  gameState.announcer = `${cleanName} joined the game.`;
  emitState();
}

function handleStartGame() {
  const validation = repository.validateRepository();

  if (gameState.players.length < 2) {
    gameState.announcer = "At least 2 players are required to start.";
    emitState();
    return;
  }

  if (!validation.valid) {
    gameState.announcer = `Repository validation failed: ${validation.errors.join(" ")}`;
    emitState();
    return;
  }

  gameState.phase = "playing";
  gameState.round = 1;
  gameState.spinsRemaining = 30;
  gameState.board = makeBoard();
  gameState.activeCategory = null;
  gameState.currentQuestion = null;
  gameState.announcer = "Game started. First player may spin.";
  emitState();
}

function handleEndGame() {
  gameState.phase = "gameOver";
  gameState.announcer = "Game over.";
  emitState();
}

function handleSelectCategory({ category } = {}) {
  if (!isValidCategoryIndex(category)) {
    gameState.announcer = "Invalid category selection.";
    emitState();
    return;
  }

  gameState.activeCategory = category;
  gameState.announcer = `${categoryLabels[category]} selected.`;
  emitState();
}

function handleSelectCell({ category, row } = {}) {
  if (!isValidCategoryIndex(category) || !isValidRowIndex(row)) {
    gameState.announcer = "Invalid board cell selection.";
    emitState();
    return;
  }

  const cell = gameState.board[category][row];
  if (cell.answered) {
    gameState.announcer = "That question has already been answered.";
    emitState();
    return;
  }

  const categoryId = categories[category].categoryId;
  const basePointValue = ROUND1_VALUES[row];
  const question = repository.getQuestionForCategoryAndValue(categoryId, basePointValue);

  if (!question) {
    gameState.announcer = "No question was found for that board cell.";
    emitState();
    return;
  }

  cell.answered = true;
  gameState.activeCategory = category;
  gameState.currentQuestion = toPublicQuestion(question);
  gameState.announcer = `${categoryLabels[category]} for $${valuesForRound(gameState.round)[row]}.`;
  emitState();
}

function handleSpin() {
  if (gameState.phase !== "playing" || gameState.isSpinning || gameState.spinsRemaining <= 0) {
    return;
  }

  gameState.isSpinning = true;
  gameState.spinResult = null;
  gameState.currentQuestion = null;
  gameState.announcer = "Wheel spinning...";
  emitState();

  setTimeout(() => {
    const sector = SECTORS[Math.floor(Math.random() * SECTORS.length)];

    gameState.isSpinning = false;
    gameState.spinResult = sector;
    gameState.spinsRemaining -= 1;

    resolveSector(sector);
    emitState();
  }, SPIN_DURATION_MS);
}

function resolveSector(sector) {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  if (!currentPlayer) {
    gameState.announcer = "No active player found.";
    return;
  }

  switch (sector.type) {
    case "category":
      gameState.activeCategory = sector.catIndex ?? null;
      gameState.announcer = `${currentPlayer.name} landed on ${sector.label}. Select a question.`;
      break;

    case "playersChoice":
      gameState.activeCategory = null;
      gameState.announcer = `${currentPlayer.name} landed on Player's Choice. Choose any available category.`;
      break;

    case "opponentsChoice":
      gameState.activeCategory = null;
      gameState.announcer = `${currentPlayer.name} landed on Opponents' Choice. Opponents choose the category.`;
      break;

    case "freeSpin":
      currentPlayer.tokens += 1;
      gameState.announcer = `${currentPlayer.name} earned a Free Spin token and may spin again.`;
      break;

    case "loseTurn":
      if (currentPlayer.tokens > 0) {
        gameState.announcer = `${currentPlayer.name} landed on Lose Turn and has a Free Spin token available.`;
      } else {
        gameState.announcer = `${currentPlayer.name} lost a turn.`;
        advanceTurn();
      }
      break;

    case "bankrupt":
      currentPlayer.score = 0;
      currentPlayer.tokens = 0;
      gameState.announcer = `${currentPlayer.name} landed on Bankrupt. Score and tokens reset.`;
      advanceTurn();
      break;

    default:
      gameState.announcer = "Unknown wheel result.";
      break;
  }

  if (gameState.spinsRemaining <= 0) {
    gameState.phase = "gameOver";
    gameState.announcer = "No spins remain. Game over.";
  }
}

function advanceTurn() {
  if (gameState.players.length === 0) return;
  gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
}

function makeBoard() {
  return categoryLabels.map(() => ROUND1_VALUES.map(() => ({ answered: false })));
}

function valuesForRound(round) {
  return round === 1 ? ROUND1_VALUES : ROUND1_VALUES.map((value) => value * 2);
}

function isValidCategoryIndex(category) {
  return Number.isInteger(category) && category >= 0 && category < categoryLabels.length;
}

function isValidRowIndex(row) {
  return Number.isInteger(row) && row >= 0 && row < ROUND1_VALUES.length;
}

function toPublicQuestion(question) {
  return {
    questionId: question.questionId,
    categoryId: question.categoryId,
    pointValue: question.pointValue,
    questionText: question.questionText,
    answers: question.answers.map((answer) => ({
      answerId: answer.answerId,
      answerText: answer.answerText,
    })),
  };
}

gameServer.on("connection", (socket) => {
  console.log("Client connected with socket.id:", socket.id);

  socket.emit("state", gameState);

  socket.on("join", handleJoin);
  socket.on("startGame", handleStartGame);
  socket.on("endGame", handleEndGame);
  socket.on("selectCategory", handleSelectCategory);
  socket.on("selectCell", handleSelectCell);
  socket.on("spin", handleSpin);

  socket.on("disconnect", () => {
    console.log("Client disconnected with socket.id:", socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Backend server listening on localhost at port: ${PORT}`);
  console.log("Repository validation:", repository.validateRepository());
});
