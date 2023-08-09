const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { config } = require("dotenv");

config();

const port = process.env.PORT;
const app = express();
const server = http.createServer(app.use(cors()));
const io = new Server(server, {
  allowEIO3: true,
  cors: {
    origin: [process.env.ORIGIN, process.env.ORIGIN2, process.env.ORIGIN3],
    methods: ["GET", "POST"],
  },
});

let rooms = new Set();
let userCounter = new Map();

// function clearEvery24h(setToClear) {
//   setToClear.clear();
//   console.log("Data cleared successfully.");
// }

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
    io.emit("roomList", [...rooms]); //Estamos emitiendo el event "roomCreated" para poder listar las rooms creada el front
  });

  socket.on("getRooms", () => {
    socket.emit("roomList", [...rooms]); // Enviar la lista de rooms al cliente que lo solicitó
  });

  const userCount = (roomName) => {
    if (!userCounter.has(roomName)) {
      userCounter.set(roomName, 1);
    } else {
      userCounter.set(roomName, userCounter.get(roomName) + 1);
    }
    io.emit("userCount", {
      room: roomName,
      count: userCounter.get(roomName),
    });
    console.log(userCounter);
  };

  socket.on("joinRoom", (roomName) => {
    if (rooms.has(roomName)) {
      socket.join(roomName); // Unirse a la room especificada
      userCount(roomName);
      console.log(`User:${socket.id} join in: ${roomName}`); // Aquí puedes enviar mensajes o realizar alguna acción adicional después de unirte a la room
    }
  });

  socket.on("leave", (roomName) => {
    socket.leave(roomName);
    if (userCounter.has(roomName)) {
      userCounter.set(roomName, userCounter.get(roomName) - 1);
      // Emitir el evento userCount a todos los sockets en la sala
      io.emit("userCount", {
        room: roomName,
        count: userCounter.get(roomName),
      });
    }
    console.log(userCounter);
  });
});

server.listen(port, () => {
  console.info(`Server runnig at port: ${port}`);
});

// // Set the timer to execute the function every 24 hours
// function setClearInterval() {
//   const now = new Date();
//   const timeElapsed = now % (24 * 60 * 60 * 1000); // Calculate time elapsed since the last midnight
//   const timeRemaining = (24 * 60 * 60 * 1000) - timeElapsed; // Calculate time remaining until the next midnight

//   setTimeout(function () {
//     clearEvery24h(rooms);
//     setClearInterval();
//   }, timeRemaining);
// }

// // Start the periodic clearing
// setClearInterval();
