const WebSocket = require("ws");

class WebSocketClient {
  constructor(url) {
    this.url = url;
    this.socket = null;
  }

  connect() {
    this.socket = new WebSocket(this.url);

    this.socket.on("open", () => {
      //   console.log("Connected to WebSocket server");
      this.onOpen();
    });

    this.socket.on("message", (data) => {
      //   console.log(`Received message: ${data}`);
      this.onMessage(data);
    });

    this.socket.on("close", () => {
      //   console.log("Disconnected from WebSocket server");
      this.onClose();
    });

    this.socket.on("error", (error) => {
      console.error("WebSocket error:", error);
      this.onError(error);
    });
  }

  send(message) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(message);
    } else {
      console.error("WebSocket is not open. Unable to send message.");
    }
  }

  close() {
    if (this.socket) {
      this.socket.close();
    }
  }

  // Override these methods in subclasses or instances
  onOpen() {
    console.log("Default onOpen handler.");
  }

  onMessage(data) {
    console.log("Default onMessage handler:", data);
  }

  onClose() {
    console.log("Default onClose handler.");
  }

  onError(error) {
    console.error("Default onError handler:", error);
  }

  getConnectionStatus() {
    if (!this.socket) {
      return "DISCONNECTED";
    }

    switch (this.socket.readyState) {
      case WebSocket.CONNECTING:
        return "CONNECTING";
      case WebSocket.OPEN:
        return "OPEN";
      case WebSocket.CLOSING:
        return "CLOSING";
      case WebSocket.CLOSED:
        return "CLOSED";
      default:
        return "UNKNOWN";
    }
  }
}

module.exports = WebSocketClient;
