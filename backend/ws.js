// ws.js
const socketIO = require("socket.io");

let io; // Store the socket.io server instance

const setupWebSocketServer = (server, namespacePath) => {
  io = socketIO(server, { path: namespacePath + "/socket.io" }); // Create the socket.io server

  io.on("connection", (socket) => {
    // console.log("Client connected to namespace:", namespacePath);

    socket.on("message", (message) => {
      console.log(`Received: ${message}`);
    });
  });
};

const sendToAllClients = (message) => {
  if (io) {
    io.emit("message", message);
  }
};

const sendUpdate = (tag, message) => {
  if (io) {
    io.emit(tag, message);
  }
};

module.exports = { setupWebSocketServer, sendToAllClients, sendUpdate };
