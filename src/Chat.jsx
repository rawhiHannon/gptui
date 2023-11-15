import React, { useState, useRef, useEffect } from "react";
import Manager from "./manager"
import Button from '@mui/material/Button';
import SendIcon from '@mui/icons-material/Send';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Avatar from '@mui/material/Avatar';
import manager from "./manager";

const Chat = () => {
  const [text, setText] = useState('');
  const [selectedUser, setSelectedUser] = useState('math');
  const [messages, setMessages] = useState([]);
  const chatMessagesRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const [ongoingMessageText, setOngoingMessageText] = useState('');
  const [ongoingMessageId, setOngoingMessageId] = useState(null);

  useEffect(() => {
    chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
  }, [messages]);

  const handleChange = (event) => {
    setSelectedUser(event.target.value)
    manager.changePrompt(event.target.value)
    setMessages([]);
  };

  const receiveChatMessage = (message) => {
    if (message.text === "StreamComplete") {
      if (ongoingMessageId !== null) {
        const completedMessage = {
          id: ongoingMessageId,
          text: ongoingMessageText,
          user: { name: "GPT", avatar: "gpt", color: "maroon" }
        };
        setMessages(messages => [...messages, completedMessage]);
        setOngoingMessageText('');
        setOngoingMessageId(null);
      }
      setIsTyping(false);
      return;
    }

    // Update the ongoing message text
    setOngoingMessageText(currentText => currentText + message.text);

    // Set the message ID if it's the start of a new message
    if (ongoingMessageId === null) {
      setOngoingMessageId(messages.length + 1);
    }
  };

  manager.registerChatHandler(receiveChatMessage)

  const sendMessage = () => {
    let msg = { 
      id: messages.length + 1, 
      text, 
      user: { name: "rawhi", avatar: "r", color: "green" } 
    }
    setIsTyping(true);
    Manager.send(msg.text)
    setMessages([...messages, msg]);
    setText("");
  };


  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="chat">
      <div className="chat-header">
      {isTyping && (
        <div className="typing-indicator">
          <p>gpt is typing...</p>
        </div>
      )}
      </div>
      <div className="chat-messages" ref={chatMessagesRef}>
        {messages.map(message => (
          <div
            key={message.id}
            className={`message ${message.user.name === "rawhi" ? 'me' : 'other'}`}
            style={{ display: "flex", marginBottom: "10px" }}
          >
            {message.user.name === "rawhi" ? (
              <>
                <div className="text" style={{ alignSelf: "center" }}>{message.text}</div>
                <Avatar sx={{ bgcolor: message.user.color }} style={{ width: "40px", height: "40px", marginLeft: "10px" }}>{message.user.avatar}</Avatar>
              </>
            ) : (
              <>
                <Avatar sx={{ bgcolor: message.user.color }} style={{ width: "40px", height: "40px", marginRight: "10px" }}>{message.user.avatar}</Avatar>
                <div className="text" style={{ alignSelf: "center" }}>{message.text}</div>
              </>
            )}
          </div>
        ))}
      {ongoingMessageId !== null && (
        <div className="message other">
          <Avatar sx={{ bgcolor: "maroon" }} style={{ width: "40px", height: "40px", marginRight: "10px" }}>gpt</Avatar>
          <div className="text" style={{ alignSelf: "center" }}>{ongoingMessageText}</div>
        </div>
      )}
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button disabled={!text} onClick={sendMessage} variant="contained" endIcon={<SendIcon />}>
        Send
      </Button>

      </div>
    </div>
  );
};

export default Chat;