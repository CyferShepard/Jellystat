import React, { useEffect, useState, useRef } from 'react';
import '../../css/websocket/websocket.css';

const TerminalComponent = () => {
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // create a new WebSocket connection
    const socket = new WebSocket('ws://10.0.0.20:8080');

    // handle incoming messages
    socket.addEventListener('message', (event) => {
        let message = JSON.parse(event.data);
      setMessages(prevMessages => [...prevMessages, message]);
    });

    // cleanup function to close the WebSocket connection when the component unmounts
    return () => {
      socket.close();
    }
  }, []);

  // function to handle scrolling to the last message
  const scrollToBottom = () => {
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }

  // scroll to the last message whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div>
      <h1>Terminal</h1>
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
