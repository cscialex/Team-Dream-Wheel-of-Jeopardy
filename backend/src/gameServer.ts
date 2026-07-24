import { createServer, ServerOptions } from "node:http";
import express from "express";
import { Server } from "socket.io";
import cors from "cors";
import { gameState, registerPlayer, selectCategory, selectCell, startSpin, finishSpin, startGame, endGame } from "./gameState";

const APP_ORIGIN = "http://localhost:5173";
const PORT = 4000;
const SPIN_DURATION_MS = 4000;

const app = express();

app.use(
    cors({
        origin: APP_ORIGIN
    })
)

app.use(express.json());

const httpServer = createServer(app);

const gameServer = new Server(httpServer, {
    cors: {
        origin: APP_ORIGIN,
        methods: ["GET", "POST"]
    }
});

const handleJoin = ({ name }: { name: string}) => {
    registerPlayer(name);
    gameServer.emit("state", gameState);
};

const handleSelectCategory = ({ category }: { category: number} ) => {
    selectCategory(category);
    gameServer.emit("state", gameState);
};

const handleSelectCell = ({ category, row}: { category: number, row: number} ) => {
    selectCell(category, row);
    gameServer.emit("state", gameState);
}

const handleSpin = () => {
    // Nothing to do if we're already spinning
    if (gameState.isSpinning) {
        return;
    };

    //otherwise let's spin, and then wait for the same amount of time as the frontend
    startSpin();
    gameServer.emit("state", gameState);

    setTimeout(() => {
        finishSpin();
        gameServer.emit("state", gameState);
    }, SPIN_DURATION_MS);
};

const handleStartGame = () => {
    startGame();
    gameServer.emit("state", gameState);
}

const handleEndGame = () => {
    endGame();
    gameServer.emit("state", gameState);
}

gameServer.on("connection", (socket) => {
    console.log("Client connected with socket.id: ", socket.id);

    socket.emit("state", gameState); // sends game state automatically

    socket.on("join", handleJoin);

    socket.on("selectCategory", handleSelectCategory);

    socket.on("selectCell", handleSelectCell);

    socket.on("spin", handleSpin);

    socket.on("startGame", handleStartGame);

    socket.on("endGame", handleEndGame);

    socket.on("disconnect", () => {
        console.log("Client disconnected with socket.id: ", socket.id)
    })
})

httpServer.listen(PORT, () => {
    console.log(`Backend server listening on localhost at port: ${PORT}`);
});