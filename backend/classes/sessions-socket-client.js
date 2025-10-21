const WebSocketClient = require("./websocket-client.js");

let wsClient;

let sessionData = [];

function initializeClient(websocketUrl) {
  wsClient = new WebSocketClient(websocketUrl);
  wsClient.onOpen = () => {
    console.log("[JELLYFIN-WEBSOCKET]: Connected to the server.");
  };

  wsClient.onMessage = (data) => {
    try {
      const message = JSON.parse(data);
      if (message.MessageType === "Sessions") {
        let result = message.Data && Array.isArray(message.Data) ? message.Data : [];

        if (result.length > 0) {
          result = result.filter(
            (session) =>
              session.NowPlayingItem !== undefined &&
              session.NowPlayingItem.Type != "Trailer" &&
              session.NowPlayingItem.ProviderIds["prerolls.video"] == undefined
          );
        }
        sessionData = result;
      } else if (message.MessageType === "ForceKeepAlive") {
        wsClient.send(JSON.stringify({ MessageType: "SessionsStart", Data: "0,1500" }));
      }
    } catch (error) {
      console.error("[JELLYFIN-WEBSOCKET]: Error parsing message:");
    }
  };

  wsClient.onClose = () => {
    console.log("[JELLYFIN-WEBSOCKET]: Disconnected from the server.");
    sessionData = [];
  };

  wsClient.onError = (error) => {
    console.error("[JELLYFIN-WEBSOCKET]: Error:", error);
    sessionData = [];
  };
}

function connect(websocketUrl) {
  if (wsClient == null) {
    initializeClient(websocketUrl);
  }
  wsClient.connect();
}

async function getSessionData(websocketUrl) {
  if (wsClient == null || wsClient.getConnectionStatus() != "OPEN") {
    console.log("[JELLYFIN-WEBSOCKET]: WebSocket not connected. Connecting...");
    await connect(websocketUrl);
    if (wsClient.getConnectionStatus() != "OPEN") {
      console.log("[JELLYFIN-WEBSOCKET]: WebSocket connection failed.");
      sessionData = [];
      return null;
    } else {
      console.log("[JELLYFIN-WEBSOCKET]: WebSocket connected.");
    }
  }
  return sessionData;
}

module.exports = { getSessionData, connect };
