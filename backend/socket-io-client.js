const io = require("socket.io-client");

class SocketIoClient {
  constructor(serverUrl) {
    this.serverUrl = serverUrl;
    this.client = null;
  }

  connect() {
    this.client = io(this.serverUrl);
  }

  waitForConnection() {
    return new Promise((resolve) => {
      if (this.client && this.client.connected) {
        resolve();
      } else {
        this.client.on("connect", resolve);
      }
    });
  }

  getClient() {
    return this.client;
  }

  sendMessage(message) {
    if (this.client && this.client.connected) {
      this.client.emit("message", JSON.stringify(message));
    }
  }
}

module.exports = SocketIoClient;
