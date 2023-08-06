import express, { Express, Response, Request } from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import config from 'dotenv'


const port = 3000;
const app: Express = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(cors());

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
  
  socket.on("leaveRoom", (roomName)=>{
    console.log(`User: ${socket.id} leave this room: ${roomName}`)
    socket.leave(roomName)
  })
});

server.listen(port, () => {
  console.info(`Server runnig at http://localhost:${port}`);
});
