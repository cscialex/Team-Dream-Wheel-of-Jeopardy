import { createServer } from "node:http";
import express from "express";
import { Server } from "socket.io";
import cors from "cors";
const APP_ORIGIN = "http://localhost:5173";
const PORT = 4000;
const app = express();
app.use(cors({
    origin: APP_ORIGIN
}));
app.use(express.json());
const httpServer = createServer(app);
const gameServer = new Server(httpServer, {
    cors: {
        origin: APP_ORIGIN,
        methods: ["GET", "POST"]
    }
});
gameServer.on("connection", (socket) => {
    console.log("Client connected with socket.id: ", socket.id);
    socket.on("disconnect", () => {
        console.log("Client disconnected with socket.id: ", socket.id);
    });
});
httpServer.listen(PORT, () => {
    console.log(`Backend server listening on localhost at port: ${PORT}`);
});
