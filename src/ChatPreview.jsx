import React, { useState, useEffect } from 'react';
import { FiSend } from 'react-icons/fi';
import Draggable from 'react-draggable';

const ChatPreview = ({ agent, position, onStop }) => {
  const [messages, setMessages] = useState([
    {
      type: 'response',
      text: agent.WelcomingMessage,
    },
    {
        type: 'send',
        text: "hi",
    },
  ]);

  useEffect(() => {
    setMessages((prevMessages) => [
      {
        type: 'response',
        text: agent.WelcomingMessage,
      },
      prevMessages[1],
    ]);
  }, [agent.WelcomingMessage]);

  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSendMessage = () => {
    if (inputValue.trim() !== '') {
      setMessages([
        ...messages,
        {
          type: 'send',
          text: inputValue,
        },
      ]);
      setInputValue('');
    }
  };

  return (
    <Draggable bounds="body" position={position} onStop={onStop} handle=".chat-preview-drag-handle">
    <div className="chat-preview" style={{ backgroundColor: agent.ChatBackgroundColor }}>
      <div className="chat-preview-header chat-preview-drag-handle">
        Agent Buddy
      </div>
      <div className="chat-preview-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`chat-preview-message chat-preview-message-${message.type} chat-preview-message-${message.type === 'send' ? 'send' : 'response'}`}
            style={{
                backgroundColor:
                  message.type === 'send'
                    ? agent.ChatBackgroundSendColor
                    : agent.ChatBackgroundResponseColor,
                color:
                  message.type === 'send'
                    ? agent.ChatTextSendColor
                    : agent.ChatTextResponseColor,
              }}
          >
            {message.text}
          </div>
        ))}
      </div>
      <div className="chat-preview-input">
        <div className="input-container">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={agent.InputPlaceholder}
            style={{ backgroundColor: agent.FillingBoxBackgroundColor, color: agent.FillingTextColor }}
          />
          <button
           className="send-icon" 
           style={{
            backgroundColor: agent.ButtonBackgroundColor,
            color: agent.ButtonTextColor,
          }}
           onClick={handleSendMessage}>
            <FiSend />
          </button>
        </div>
      </div>
    </div>
    </Draggable>
  );
};

export default ChatPreview;

