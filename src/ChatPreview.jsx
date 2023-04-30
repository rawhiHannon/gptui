import React, { useState, useEffect } from 'react';
import { FiSend } from 'react-icons/fi';
import Draggable from 'react-draggable';

const ChatPreview = ({ agent, position, onStop }) => {
  const [messages, setMessages] = useState([
    {
      type: 'response',
      text: agent.welcoming_message,
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
        text: agent.welcoming_message,
      },
      prevMessages[1],
    ]);
  }, [agent.welcoming_message]);

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

  const handleEnter = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <Draggable bounds="body" position={position} onStop={onStop} handle=".chat-preview-drag-handle">
    <div className="chat-preview" style={{ backgroundColor: agent.chat_background_color }}>
      <div className="chat-preview-header chat-preview-drag-handle">
        <div className="chatbox-flex-center" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <img src="https://agentbuddy.xseed.me/chatbox-logo.png" style={{width: '140px', height: '30px'}} />
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.17 14.83L14.83 9.17M14.83 14.83L9.17 9.17M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="#865439" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        </div>
      </div>
      <div className="chat-preview-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`chat-preview-message chat-preview-message-${message.type} chat-preview-message-${message.type === 'send' ? 'send' : 'response'}`}
            style={{
                backgroundColor:
                  message.type === 'send'
                    ? agent.chat_background_send_color
                    : agent.chat_background_response_color,
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
            placeholder={agent.input_placeholder}
            onKeyDown={handleEnter}
            style={{ backgroundColor: agent.filling_box_background_color, color: agent.filling_text_color }}
          />
          <button
           className="send-icon" 
           style={{
            backgroundColor: agent.button_background_color,
            color: agent.button_text_color,
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

