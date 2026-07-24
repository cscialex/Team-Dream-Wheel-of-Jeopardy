import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:4000";

const gameSocket = io(SOCKET_URL);

export default gameSocket;