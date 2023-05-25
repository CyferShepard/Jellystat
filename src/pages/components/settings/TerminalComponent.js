import React, {  useState } from 'react';
import '../../css/websocket/websocket.css';

function TerminalComponent(props){
  const [messages] = useState(props.data);


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
