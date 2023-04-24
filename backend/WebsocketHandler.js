const WebSocket = require('ws');

function createWebSocketServer() {
  var messages=[];
  const port=process.env.WS_PORT || 3004 ;
  const wss = new WebSocket.Server({port});

  // function to handle WebSocket connections
  function handleConnection(ws) {
    console.log('Client connected');

    // listen for messages from the client
    ws.on('message', (message) => {
      console.log(`Received message: ${message}`);
    });

    // listen for close events
    ws.on('close', () => {
      console.log('Client disconnected');
    });

    ws.send(JSON.stringify(messages));
  }

  // call the handleConnection function for each new WebSocket connection
  wss.on('connection', handleConnection);

  // define a separate method that sends a message to all connected clients
  function sendMessageToClients(message) {

    if(message.key)
    {

      const findMessage = messages.filter(item => item.hasOwnProperty('key')).find(item => item.key === message.key);
      if(findMessage)
      {
        messages.filter(item => item.hasOwnProperty('key')).forEach(item => {

          if (item.key === message.key) {
            item.Message = message.Message;
          }
        });
      }else{
        messages.push(message);
      }

      
    }else{
      messages.push(message);
    }
   
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(messages));
      }
    });
  }

  function clearMessages() {
    messages=[];
  }

  return {sendMessageToClients, clearMessages, wss};
}

const wsServer = createWebSocketServer();

module.exports = wsServer;
