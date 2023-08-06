"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const port = process.env.PORT;
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.ORIGIN,
        methods: ["GET", "POST"],
    },
});
app.use((0, cors_1.default)());
let rooms = new Set();
io.on("connection", (socket) => {
    socket.on("message", (data, roomName) => {
        if (socket.rooms.has(roomName)) {
            socket.to(roomName).emit("message", {
                data,
                from: socket.id.slice(6),
            });
        }
    });
    socket.on("create", (roomName) => {
        rooms.add(roomName);
        socket.join(roomName);
        io.emit("roomList", Array.from(rooms)); //Estamos emitiendo el event "roomCreated" para poder listar las rooms creada el front
        console.log(roomName);
    });
    socket.on("getRooms", () => {
        socket.emit("roomList", Array.from(rooms)); // Enviar la lista de rooms al cliente que lo solicitó
    });
    socket.on("joinRoom", (roomName) => {
        if (rooms.has(roomName)) {
            socket.join(roomName); // Unirse a la room especificada
            console.log(`User:${socket.id} join in: ${roomName}`); // Aquí puedes enviar mensajes o realizar alguna acción adicional después de unirte a la room
        }
    });
    socket.on("leaveRoom", (roomName) => {
        console.log(`User: ${socket.id} leave this room: ${roomName}`);
        socket.leave(roomName);
    });
});
server.listen(port, () => {
    console.info(`Server runnig at http://localhost:${port}`);
});
