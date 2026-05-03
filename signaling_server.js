const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  allowEIO3: true // Compatibility with older Java clients
});

const PORT = process.env.PORT || 3000;
const rooms = {};

app.get("/", (req, res) => {
  res.send("Signaling server is running!");
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
    socket.emit("joined", roomId); // Confirm join to sender
    socket.to(roomId).emit("user_joined");
  });

  socket.on("set_pin", (data) => {
    const { roomId, pin } = data;
    rooms[roomId] = pin;
    console.log(`PIN set for room ${roomId}: ${pin}`);
  });

  socket.on("verify_pin", (data) => {
    const { roomId, pin } = data;
    const storedPin = rooms[roomId];
    const isValid = storedPin === pin;
    console.log(`PIN verification for room ${roomId}: input=${pin}, stored=${storedPin} -> ${isValid}`);
    socket.emit("pin_validation", isValid);
  });

  socket.on("ready_for_offer", (roomId) => {
    console.log(`Remote ready for offer in room ${roomId}`);
    socket.to(roomId).emit("ready_for_offer");
  });

  socket.on("offer", (data) => {
    socket.to(data.roomId).emit("offer", data);
  });

  socket.on("answer", (data) => {
    socket.to(data.roomId).emit("answer", data);
  });

  socket.on("ice_candidate", (data) => {
    socket.to(data.roomId).emit("ice_candidate", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});
