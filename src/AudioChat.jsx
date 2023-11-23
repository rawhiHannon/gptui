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
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import AudioRecorder from './AudioRecorder';
import SpeechRecognition from './SpeechRecognition'
import AudioStreamer from "./AudioStreamer";

const AudioChat = () => {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState(() => {
    const storedMessages = localStorage.getItem('messages');
    return storedMessages ? JSON.parse(storedMessages) : [];
  });
  const audioQueue = useRef([]);
  const chatMessagesRef = useRef(null);
  const currentMessageAudioChunks = useRef([]);
  const historyMessageAudioChunks = useRef([]);
  const isProcessingAudio = useRef(false);
  const [isGptSpeaking, setIsGptSpeaking] = useState(false);
  const [play] = useSound(boopSfx);
  const [isOnline, setIsOnline] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isOnCall, setOnCall] = useState(false);
  const menuRef = useRef(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  let isAudioStreaming = false;  
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

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

  let isPlaying = false;

  useEffect(() => {
    if (!isPlaying) {
      setIsGptSpeaking(false);
    }
  }, [isPlaying]);

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

  const processAudioQueue = () => {
    if (audioQueue.current.length > 0 && !isProcessingAudio.current) {
      isProcessingAudio.current = true;
      const currentMessageChunks = audioQueue.current.shift();
      const combinedBlob = new Blob(currentMessageChunks, { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(combinedBlob);
      setMessages(messages => [...messages, { id: messages.length + 1, audioUrl, user: { name: "GPT", avatar: "gpt", color: "maroon" } }]);
      isProcessingAudio.current = false;
      if (audioQueue.current.length > 0) {
        processAudioQueue();
      }
    }
  };
  
  function playNextAudioChunk() {
    if (isPlaying || currentMessageAudioChunks.current.length === 0 || !isAudioEnabled) {
      // Already playing or no chunks to play
      return;
    }
  
    setIsGptSpeaking(true);
    isPlaying = true;
  
    const hasStreamComplete = currentMessageAudioChunks.current[currentMessageAudioChunks.current.length - 1] === "StreamComplete";
    const audioBlobs = hasStreamComplete ? currentMessageAudioChunks.current.slice(0, -1) : [...currentMessageAudioChunks.current];
    currentMessageAudioChunks.current = hasStreamComplete ? ["StreamComplete"] : [];
  
    if (audioBlobs.length === 0) {
      setIsGptSpeaking(false);
      isPlaying = false;
      return;
    }
  
    const combinedBlob = new Blob(audioBlobs, { type: 'audio/mpeg' });
    const reader = new FileReader();
    reader.onload = function() {
      const arrayBuffer = this.result;
      audioContext.decodeAudioData(arrayBuffer, playBuffer, errorHandler);
    };
    reader.readAsArrayBuffer(combinedBlob);
  }
  
  
  function playBuffer(audioBuffer) {
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
  
    source.onended = () => {
      isPlaying = false;
      setIsGptSpeaking(false);
      playNextAudioChunk(); // Play the next chunk if available
    };
  }
  
  function errorHandler(e) {
    console.error("Error decoding audio data: " + e.err);
    isPlaying = false;
    setIsGptSpeaking(false);
  }

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
      if (message.stream === "StreamComplete") {
        isAudioStreaming = false;
        audioQueue.current.push([...historyMessageAudioChunks.current]);
        historyMessageAudioChunks.current = [];
        historyMessageAudioChunks.current.push(message.stream);
        if (!isProcessingAudio.current) {
          // processAudioQueue();
        }
      } else {
        if (!isAudioStreaming) {
          isAudioStreaming = true;
          historyMessageAudioChunks.current = [];
        }

        const audioBlob = base64ToBlob(message.stream, 'audio/mpeg');
        currentMessageAudioChunks.current.push(audioBlob);
        historyMessageAudioChunks.current.push(audioBlob);

        if (isPlaying == false) {
          playNextAudioChunk();
        }
      }
    }
  };
  
  const base64ToBlob = (base64, contentType) => {
    const binaryString = window.atob(base64);
    const byteNumbers = new Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      byteNumbers[i] = binaryString.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
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
      <div className="search-ph">
      <TextField
      className="search-box"
      variant="standard" 
      placeholder="Search..."
      InputProps={{
        disableUnderline: true,
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        ),
      }}
    />

  </div>
  {/* Scrollable Assistant List */}
  <div className="assistant-list">
    <div className="assistant-tab active">
    <div className="avatar"></div>
      <div>
        <span className="assistant-name">Pizzaa</span>
        <div className="last-message">Last message...</div>
      </div>
    </div>
    <div className="assistant-tab">
    <div className="avatar"></div>
      <div>
        <span className="assistant-name">Bezeq Support</span>
        <div className="last-message">Last message...</div>
      </div>
    </div>
    <div className="assistant-tab">
    <div className="avatar"></div>
      <div>
        <span className="assistant-name">Panda Support</span>
        <div className="last-message">Last message...</div>
      </div>
    </div>
    
    {/* ... more assistant tabs ... */}
  </div>
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
      {message.user.name === "GPT" && message.id === messages.length && isGptSpeaking && !isOnCall && (
        <div className="head">
        <div className="eyebrow-container">
          <div className="eyebrow">
          </div>
          <div className="eyebrow">
          </div>
        </div>
        <div className="eyes-container">
          <div className="eye">
            <div className="pupil"></div>
          </div>
          <div className="eye">
            <div className="pupil"></div>
          </div>
        </div>
        <div className="nose"></div>
        {isGptSpeaking ? <div className="mouth"></div> : <div className="nospeak-mouth"></div>}
      </div>
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
