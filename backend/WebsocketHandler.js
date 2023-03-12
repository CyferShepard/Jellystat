const WebSocket = require('ws');

function createWebSocketServer(port) {
  const wss = new WebSocket.Server({ port });
  let connected = false;

  // function to handle WebSocket connections

  function handleConnection(ws) {
    if (!connected) {
    console.log('Client connected');
    connected = true;

    // listen for messages from the client
    ws.on('message', (message) => {
      console.log(`Received message: ${message}`);
    });

    // listen for close events
    ws.on('close', () => {
      console.log('Client disconnected');
      connected = false;
    });}
    else
    {
        console.log('WebSocket connection already established');
    }
  }


  // call the handleConnection function for each new WebSocket connection
  wss.on('connection', handleConnection);

  // define a separate method that sends a message to all connected clients
  function sendMessageToClients(message) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        let parsedMessage = JSON.stringify(message);
        console.log(parsedMessage);
        client.send(parsedMessage);
      }
    });
  }

  return sendMessageToClients;
}

module.exports = createWebSocketServer;
