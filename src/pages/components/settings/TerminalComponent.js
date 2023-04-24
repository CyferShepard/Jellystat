import React, { useEffect, useState, useRef } from 'react';
import '../../css/websocket/websocket.css';

const TerminalComponent = () => {
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // create a new WebSocket connection
    const socket = new WebSocket(`ws://${window.location.hostname+':'+(process.env.WS_PORT || 3004)}/ws`);

    // handle incoming messages
    socket.addEventListener('message', (event) => {
        let message = JSON.parse(event.data);
      setMessages(message);
    });

    // cleanup function to close the WebSocket connection when the component unmounts
    return () => {
      socket.close();
    }
  }, []);

  return (
    <div className='my-4'>
      <div className="console-container">
        {messages.map((message, index) => (
          <div key={index} className="console-message">
            <pre style={{color: message.color || 'white'}} className="console-text">{message.Message}</pre>
          </div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>
    </div>
  );
};

export default TerminalComponent;
