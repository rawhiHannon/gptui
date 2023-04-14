import React, { useState } from 'react';
import { FiSend } from 'react-icons/fi';

const ChatPreview = ({ agent }) => {
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
    <div className="chat-preview" style={{ backgroundColor: agent.ChatBackgroundColor }}>
      <div className="chat-preview-header">
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
  );
};

export default ChatPreview;

