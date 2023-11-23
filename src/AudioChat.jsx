import React, { useState, useEffect, useRef } from "react";
import Manager from "./manager";
import Button from '@mui/material/Button';
import SendIcon from '@mui/icons-material/Send';
import Avatar from '@mui/material/Avatar';
import useSound from 'use-sound';
import boopSfx from './interface-124464.mp3';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArchiveIcon from '@mui/icons-material/Archive';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import IconButton from '@mui/material/IconButton';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import AudioRecorder from './AudioRecorder';
import SpeechRecognition from './SpeechRecognition'
import AudioStreamer from "./AudioStreamer";
import useAudioPlayer from './AudioPlayer'; // Adjust the path as per your project structure
import GptFace from "./GptFace";
import Contacts from "./Contacts";

const AudioChat = () => {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState(() => {
    const storedMessages = localStorage.getItem('messages');
    return storedMessages ? JSON.parse(storedMessages) : [];
  });
  const chatMessagesRef = useRef(null);
  const [play] = useSound(boopSfx);
  const [isOnline, setIsOnline] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isOnCall, setOnCall] = useState(false);
  const menuRef = useRef(null);
  const [isGptSpeaking, setIsGptSpeaking] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  const handleGptSpeakingChange = (isSpeaking) => {
    setIsGptSpeaking(isSpeaking);
  };

  const {
    addAudioToQueue,
  } = useAudioPlayer(handleGptSpeakingChange, isAudioEnabled);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu && menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  useEffect(() => {
    Manager.registerChatHandler(receiveChatMessage);
  }, []);

  useEffect(() => {
    setIsOnline(Manager.isWSConnected());
    Manager.setWSStatusCallback((status) => {
      setIsOnline(status);
    });    
  }, []);


  useEffect(() => {
    chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    const storedMessages = localStorage.getItem('messages');
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    }
  }, []);
  
  useEffect(() => {
    const storedMessages = localStorage.getItem('messages');
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    }
  }, []);

  const receiveChatMessage = (message) => {
    if (message.transcription) {
      setMessages(messages => [...messages, {
        id: messages.length + 1,
        text: message.transcription,
        user: { name: "rawhi" }
      }]);
    } else if (message.text) {
      setMessages(messages => [...messages, {
        id: messages.length + 1,
        text: message.text,
        user: { name: "GPT" }
      }]);
    } else if (message.stream) {
      addAudioToQueue(message);
    }
  };

  const sendMessage = () => {
    play()
    let msg = { 
      id: messages.length + 1, 
      text, 
      user: { name: "rawhi", avatar: "r", color: "green" } 
    };
    Manager.send(msg.text);
    setMessages([...messages, msg]);
    setText("");
  };

  const sendTextMessage = (textData) => {
    play()
    let newMessage = { 
      id: messages.length + 1, 
      text: textData, 
      user: { name: "rawhi", avatar: "r", color: "green" } 
    };
    Manager.send(newMessage.text);
    setMessages(messages => [...messages, newMessage]); // Update this line
    setText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && text != "") {
      sendMessage();
    }
  };

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem('messages');
    setShowMenu(false);
  };

  const toggleAudio = (event) => {
    event.stopPropagation();
    setIsAudioEnabled(!isAudioEnabled);
  };

  const handleAudioStream = (base64audio) => {
    if(base64audio === "start") {
      setOnCall(true)
    }
    if(base64audio === "CloseStream") {
      setOnCall(false)
    }
    Manager.sendStream(base64audio)
  };

  const handleAudio = (base64audio, blob) => {
    Manager.sendVoice(base64audio)
  }

  return (
    <div>

    <div className="chat-container">
  
    <div className="sidebar">
      <div className="sidebar-header">
        <Avatar sx={{ bgcolor: "gray" }} style={{ width: "40px", height: "40px", marginRight: "10px" }} />
    
        <div className="header-icons">
          <IconButton style={{ color: '#3f6eb5', outline: 'none' }}><ArchiveIcon /></IconButton>
          <IconButton style={{ color: '#3f6eb5', outline: 'none' }}><PersonAddIcon /></IconButton>
          <IconButton style={{ color: '#3f6eb5', outline: 'none' }}><SettingsIcon /></IconButton>
        </div>
      </div>

      <Contacts />
</div>


  <div className="chat">
  <div className="person-info">
  <Avatar sx={{ bgcolor: "gray" }} style={{ width: "40px", height: "40px", marginRight: "10px" }} />

    <div className="person-details">
      <h2>Pizzaa</h2>
      {/* Conditionally render the "Online" text */}
      {isOnline && <p>Online</p>}
    </div>
    <div className="icon-container">
    <AudioStreamer status={isOnline} onAudioStream={handleAudioStream} talkingStatus={isGptSpeaking} />

    <div className="speaker-icon-container">

        {isAudioEnabled ? (
          <IconButton style={{ color: '#3f6eb5', outline: 'none' }}><VolumeUpIcon onClick={toggleAudio} /></IconButton>
        ) : (
          <IconButton style={{ color: '#3f6eb5', outline: 'none' }}><VolumeOffIcon onClick={toggleAudio} /></IconButton>
        )}
      </div>

      <IconButton onClick={toggleMenu} style={{ color: '#3f6eb5', outline: 'none' }}><MoreVertIcon /></IconButton>
      {showMenu && (
        <div ref={menuRef} className="menu">
          <div className="menu-item" onClick={clearHistory}>Clear History</div>
          <div className="menu-item">Settings</div>
        </div>
      )}
    </div>
  </div>

    <div className="chat-messages" ref={chatMessagesRef}>
        {messages.map(message => (
      <div
        key={message.id}
        className={`message ${message.user.name === "rawhi" ? 'me' : 'other'}`}
      >
        {message.user.name === "GPT" && message.id === messages.length && (
          <GptFace isSpeaking={isGptSpeaking} isOnCall={isOnCall} />
        )}
        <div className="text">
          {message.text}
          <span className={`message-time ${message.user.name === "rawhi" ? 'me' : 'other'}`}>10:15</span>
        </div>
      </div>
    ))}

      </div>
      <div className="chat-input">
        {/* <IconButton style={{ outline: 'none' }}><AddIcon /></IconButton> */}
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type a message"
          onKeyDown={handleKeyDown}
        />
        {
          text
            ? <Button onClick={() => sendMessage()} variant="contained">
                <SendIcon />
              </Button>
            :  <AudioRecorder onRecordingComplete={handleAudio} status={isOnline} />
        }
      </div>
    </div>
    </div>
    </div>
  );
};

export default AudioChat;
