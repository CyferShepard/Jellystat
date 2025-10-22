const WebSocket = require("ws");

class WebSocketClient {
  constructor(url) {
    this.url = url;
    this.socket = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(this.url, {
        rejectUnauthorized: (process.env.REJECT_SELF_SIGNED_CERTIFICATES || "true").toLowerCase() === "true",
      });

      this.socket.on("open", () => {
        // console.log("Connected to WebSocket server");
        this.onOpen();
        resolve(); // Resolve the promise when the connection is established
      });

      this.socket.on("error", (error) => {
        // console.error("WebSocket error:", error);
        this.onError(error);
        reject(error); // Reject the promise if an error occurs
      });

      this.socket.on("message", (data) => {
        this.onMessage(data);
      });

      this.socket.on("close", () => {
        this.onClose();
      });
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
