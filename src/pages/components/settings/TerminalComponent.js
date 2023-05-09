import React, { useEffect, useState } from 'react';
import '../../css/websocket/websocket.css';

const TerminalComponent = () => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    try{

    const socket = new WebSocket(`ws://127.0.0.1:${process.env.WS_PORT || 3004}`);

    // handle incoming messages
    socket.addEventListener('message', (event) => {
        let message = JSON.parse(event.data);
        setMessages(message);
    });

    return () => {
      socket.close();
    }

    }catch(error)
    {
      // console.log(error);
    }

  }, []);

  return (
    <div className='my-4'>
      <div className="console-container">
        {messages && messages.map((message, index) => (
          <div key={index} className="console-message">
            <pre style={{color: message.color || 'white'}} className="console-text">{message.Message}</pre>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TerminalComponent;
