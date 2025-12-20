const WebSocketClient = require("./websocket-client.js");

let wsClient;

let sessionData = [];
let errorCount = 0;
const maxErrorCount = 3;
const reconnectInterval = 60000;
let reconnectNextAttempt = null;
let keepAliveInterval;

function initializeClient(websocketUrl, apiKey) {
  const options = {
    headers: {
      "Authorization": 'MediaBrowser Token="' + apiKey + '"'
    }
  };
  
  wsClient = new WebSocketClient(websocketUrl, options);
  
  wsClient.onOpen = () => {
    console.log(`[JELLYFIN-WEBSOCKET]: Connected to the server.`);
    errorCount = 0;
    reconnectNextAttempt = null;

    // Start sending ForceKeepAlive every 30 seconds
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval); // Clear any existing interval to avoid duplicates
    }
    keepAliveInterval = setInterval(() => {
      if (wsClient.getConnectionStatus() === "OPEN") {
        wsClient.send(JSON.stringify({ MessageType: "KeepAlive" }));
      } else {
        clearInterval(keepAliveInterval); // Stop sending pings if connection is not open
      }
    }, 30000); // 30 seconds interval
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
    console.log(`[JELLYFIN-WEBSOCKET]: Disconnected from the server.`);
    sessionData = [];
  };

  wsClient.onError = (error) => {
    console.error("[JELLYFIN-WEBSOCKET]: Error:", error);
    errorCount++;
    sessionData = [];
  };
}

async function connect(websocketUrl, apiKey) {
  if (wsClient == null) {
    initializeClient(websocketUrl, apiKey);
  }
  if (errorCount >= maxErrorCount) {
    const now = Date.now();

    if (reconnectNextAttempt == null) {
      reconnectNextAttempt = now + reconnectInterval;
      sessionData = null;
      console.log("[JELLYFIN-WEBSOCKET]: Too many errors. Attempting to reconnect after 60 seconds.");
      console.log("[JELLYFIN-API]: getSessions - Falling back to REST API");
      return;
    }

    if (now >= reconnectNextAttempt) {
      reconnectNextAttempt = now + reconnectInterval; // Reset the next attempt time
      await wsClient.connect();
    } else {
      return;
    }
  }
  await wsClient.connect();
}

async function getSessionData(websocketUrl, apikey) {
  if (wsClient == null || wsClient.getConnectionStatus() != "OPEN") {
    if (errorCount < maxErrorCount) {
      console.log(`[JELLYFIN-WEBSOCKET]: WebSocket not connected. Connecting... (Attempt ${errorCount + 1} of ${maxErrorCount})`);
    }

    await connect(websocketUrl, apikey);
    if (errorCount < maxErrorCount) {
      if (wsClient.getConnectionStatus() != "OPEN") {
        console.log("[JELLYFIN-WEBSOCKET]: WebSocket connection failed.");
        sessionData = [];
        return null;
      }
    }
  }
  return sessionData;
}

module.exports = { getSessionData, connect };
