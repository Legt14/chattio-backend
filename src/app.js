const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { config } = require("dotenv");

config();

const port = process.env.PORT;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  origins:[process.env.ORIGIN],
  handlePreflightRequest: (req, res) => {
    res.writeHead(200, {
      "Access-Control-Allow-Origin": process.env.ORIGIN,
      "Access-Control-Allow-Methods": "GET,POST",
      "Access-Control-Allow-Headers": "connection",
      "Access-Control-Allow-Credentials": true
    });
    res.end();
  }
});


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
  console.info(`Server runnig at :${port}`);
});
