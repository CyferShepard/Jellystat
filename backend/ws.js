// ws.js
const socketIO = require('socket.io');

let io; // Store the socket.io server instance

const setupWebSocketServer = (server) => {
  io = socketIO(server);

  io.on('connection', (socket) => {
    // console.log('Client connected');

    socket.on('message', (message) => {
      // console.log(`Received: ${message}`);

    });
  });
};

const sendToAllClients = (message) => {
  io.emit('message', message);
};

const sendUpdate = (tag,message) => {
  io.emit(tag, message);
};

module.exports = { setupWebSocketServer, sendToAllClients, sendUpdate };
