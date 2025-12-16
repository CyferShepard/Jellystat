// ws.js
const socketIO = require("socket.io");
const webSocketServerSingleton = require("./ws-server-singleton.js");
const SocketIoClient = require("./socket-io-client.js");
const jwt = require("jsonwebtoken");

const token = jwt.sign({ user: "internal" }, process.env.JWT_SECRET);
const socketClient = new SocketIoClient("http://127.0.0.1:3000", { auth: { token } });
let io; // Store the socket.io server instance
const JWT_SECRET = process.env.JWT_SECRET;

const setupWebSocketServer = (server, namespacePath) => {
  io = socketIO(server, { path: namespacePath + "/socket.io" });

  socketClient.connect();

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded.user;
      return next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    // console.log("Client connected to namespace:", namespacePath);

    socket.on("message", (message) => {
      try {
        const payload = JSON.parse(message);
        if (typeof payload === "object" && payload !== null) {
          if (payload.tag && payload.message) {
            sendUpdate(payload.tag, payload.message);
          }
        }
      } catch (error) {}
    });
  });

  webSocketServerSingleton.setInstance(io);
};

const sendToAllClients = (message) => {
  const ioInstance = webSocketServerSingleton.getInstance();
  if (ioInstance) {
    ioInstance.emit("message", message);
  }
};

const sendUpdate = async (tag, message) => {
  // const ignoredTags = ["task-list", "sessions"];
  // if (!ignoredTags.includes(tag)) {
  //   console.log(`Sending update - Tag: ${tag}, Message: ${JSON.stringify(message)}`);
  // }
  const ioInstance = webSocketServerSingleton.getInstance();
  if (ioInstance) {
    ioInstance.emit(tag, message);
  } else {
    if (socketClient.client == null || socketClient.client.connected == false) {
      socketClient.connect();
      await socketClient.waitForConnection();
    }

    socketClient.sendMessage({ tag: tag, message: message });
  }
};

module.exports = { setupWebSocketServer, sendToAllClients, sendUpdate };
