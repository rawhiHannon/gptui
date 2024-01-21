import React, { useState, useEffect, useRef } from "react";
import Manager from "./manager";
import Button from '@mui/material/Button';
import SendIcon from '@mui/icons-material/Send';
import Avatar from '@mui/material/Avatar';
import useSound from 'use-sound';
import boopSfx from './interface-124464.mp3';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import IconButton from '@mui/material/IconButton';
import AudioRecorder from './AudioRecorder';
import SpeechRecognition from './SpeechRecognition'
import AudioStreamer from "./PCMAudioStreamer";
import useAudioPlayer from './AudioPlayer'; // Adjust the path as per your project structure
import GptFace from "./GptFace";
import Contacts from "./Contacts";
import MenuIcon from '@mui/icons-material/Menu';
import axios from 'axios';
import './jarvis.css'

const AudioChat = (handleDrawerOpen) => {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);
  const chatMessagesRef = useRef(null);
  const [play] = useSound(boopSfx);
  const [isOnline, setIsOnline] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isOnCall, setOnCall] = useState(false);
  const menuRef = useRef(null);
  const [isGptSpeaking, setIsGptSpeaking] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const isAudioEnabledRef = useRef(false);
  const lastMessageTimeRef = useRef(new Date());
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [agents, setAgents] = useState([]);
  const [currentAgentId, setCurrentAgentId] = useState(null);
  const [currentAgentName, setCurrentAgentName] = useState("");
  const audioStreamerRef = useRef();

  const handleCloseDialog = () => {
      if (audioStreamerRef.current) {
          audioStreamerRef.current.closeDialog();
      } else {
        alert("nil!!!")
      }
  };

  const fetchAgents = async () => {
    try {
      // const response = await axios.get('https://www.metesapi.com/api/agents');
      const response = await axios.get('http://localhost:7879/api/agents');
      const fetchedAgents = response.data;

      setAgents(fetchedAgents);

      const storedAgentId = localStorage.getItem('currentAgentId');
      if (storedAgentId && storedAgentId != "null" && storedAgentId != "undefined") {
        setCurrentAgentId(storedAgentId);
      } else if (fetchedAgents.length > 0) {
        setCurrentAgentId(fetchedAgents[0].id);
        localStorage.setItem('currentAgentId', fetchedAgents[0].id);
      }
    } catch (error) {
      console.error("Error fetching agents:", error);
    }
  };


  useEffect(() => {
    if(!currentAgentId) {
      return;
    }
    const agentSpecificKey = `messages_${currentAgentId}`;
    const storedMessages = localStorage.getItem(agentSpecificKey);
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    } else {
      setMessages([]);
    }
    localStorage.setItem('currentAgentId', currentAgentId);
    for(let i in agents) {
      if(agents[i].id == currentAgentId) {
        setCurrentAgentName(agents[i].name)
      }
    }
    setSidebarVisible(false)
  }, [currentAgentId]);

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    if(!isOnline) {
      return;
    }
    fetchAgents();
  }, [isOnline]);


  const toggleSidebar = () => {
    setSidebarVisible(true);
  };

  const handleGptSpeakingChange = (isSpeaking) => {
    setIsGptSpeaking(isSpeaking);
  };

  const {
    addAudioToQueue,
    stop,
    pauseAudio,
    playAudio,
  } = useAudioPlayer(handleGptSpeakingChange, isAudioEnabledRef);

  useEffect(() => {
    const audioSetting = localStorage.getItem("audio") === "true";
    isAudioEnabledRef.current = audioSetting
    setIsAudioEnabled(audioSetting);
  }, []);

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
    setIsOnline(Manager.isWSConnected());
    Manager.setWSStatusCallback((status) => {
      setIsOnline(status);
    });
  }, []);


  useEffect(() => {
    chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    if(!currentAgentId) {
      return;
    }
    const agentSpecificKey = `messages_${currentAgentId}`;
    localStorage.setItem(agentSpecificKey, JSON.stringify(messages));
  }, [messages]);


  const receiveChatMessage = (message) => {
    if (message.transcription) {
      const now = new Date();
      const msElapsed = now.getTime() - lastMessageTimeRef.current.getTime();
      setMessages(messages => [...messages, {
        id: messages.length + 1,
        text: message.transcription,
        user: { name: "rawhi" },
        timestamp: now,
        ms: msElapsed
      }]);
    } else if (message.text) {
      const now = new Date();
      const msElapsed = now.getTime() - lastMessageTimeRef.current.getTime();
      setMessages(messages => [...messages, {
        id: messages.length + 1,
        text: message.text,
        user: { name: "GPT" },
        timestamp: now,
        ms: msElapsed
      }]);
    } else if (message.stream) {
      if(isAudioEnabledRef.current) {
        if(message.stream === "<close_stream>") {
          handleCloseDialog();
        }
        addAudioToQueue(message.stream);
      }
    }
  };

  const sendMessage = () => {
    play();
    const timestamp = new Date(); // Get the current timestamp
    lastMessageTimeRef.current = timestamp
    let msg = { 
      id: messages.length + 1, 
      text, 
      user: { name: "rawhi", avatar: "r", color: "green" },
      timestamp: timestamp,
      ms: 0 
    };
    Manager.send(msg.text, currentAgentId);
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

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
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
    const agentSpecificKey = `messages_${currentAgentId}`;
    localStorage.removeItem(agentSpecificKey);
    setShowMenu(false);
    lastMessageTimeRef.current = new Date()
  };

  const toggleAudio = (event) => {
    event.stopPropagation();
    isAudioEnabledRef.current = !isAudioEnabledRef.current
    stop();
    setIsAudioEnabled(isAudioEnabledRef.current);
    localStorage.setItem("audio", ""+isAudioEnabledRef.current)
  };

  const handleAudioStream = (base64audio) => {
    if(base64audio === "start") {
      pauseAudio();
      setOnCall(true)
    }
    if(base64audio === "CloseStream") {
      stop()
      setOnCall(false)
    }
    Manager.sendStream(base64audio, currentAgentId)
  };

  const handleStreamStarted = () => {
    setTimeout(() => {
      playAudio();
    }, 1300);
  }

  const handleAudio = (base64audio, blob) => {
    lastMessageTimeRef.current = new Date()
    Manager.sendVoice(base64audio, currentAgentId)
  }

  return (
    <>
    <div>
      {sidebarVisible && 
        <div className="sidebar">
          <Contacts
            open={sidebarVisible}
            setOpen={setSidebarVisible}
            agents={agents}
            currentAgentId={currentAgentId}
            setCurrentAgentId={setCurrentAgentId}
          />
        </div>
      }
      <div className="chat-container">


      <div className="chat">
      <div className="person-info">
      <IconButton onClick={toggleSidebar} style={{color: '#3f6eb5', outline: 'none', marginRight: "10px" }} disabled={!isOnline}><MenuIcon /></IconButton>
      <Avatar sx={{ bgcolor: "gray" }} style={{ width: "40px", height: "40px", marginRight: "10px" }} />

    <div className="person-details">
      <h2>{currentAgentName}</h2>
      {/* Conditionally render the "Online" text */}
      {isOnline && <p>Online</p>}
    </div>
    <div className="icon-container">
    <AudioStreamer 
      status={isOnline && currentAgentId} 
      onAudioStream={handleAudioStream} 
      onStreamStarted={handleStreamStarted}
      toggleAudio={toggleAudio} 
      talkingStatus={isGptSpeaking} 
      isAudioEnabled={isAudioEnabled} 
      ref={audioStreamerRef}
    />

    <div className="speaker-icon-container">

        {isAudioEnabled ? (
          <IconButton style={{ color: '#3f6eb5', outline: 'none' }}><VolumeUpIcon onClick={toggleAudio} /></IconButton>
        ) : (
          <IconButton style={{ color: '#3f6eb5', outline: 'none' }}><VolumeOffIcon onClick={toggleAudio} /></IconButton>
        )}
      </div>

      <IconButton onClick={toggleMenu} style={{ color: '#3f6eb5', outline: 'none', marginRight: '15px' }}><MoreVertIcon /></IconButton>
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
          <GptFace isSpeaking={isGptSpeaking && isAudioEnabled} isOnCall={isOnCall} />
        )}
        {message.user.name === "GPT" && message.id === messages.length && !isGptSpeaking && !isOnCall && (
          <Avatar sx={{ bgcolor: "gray" }} style={{ width: "20px", height: "20px", marginRight: "10px" }} />
        )}
        <div className="text">
          {message.text}
          <span className={`message-time ${message.user.name === "rawhi" ? 'me' : 'other'}`}>
            {formatTime(new Date(message.timestamp))} ({message.ms} MS)
          </span>
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
          disabled={!isOnline || !currentAgentId}
        />
        {
          text
            ? <Button onClick={() => sendMessage()} disabled={!isOnline || !currentAgentId} variant="contained">
                <SendIcon />
              </Button>
            :  <AudioRecorder onRecordingComplete={handleAudio} status={isOnline && currentAgentId} />
        }
      </div>
    </div>
    </div>
    </div>
    </>
  );
};

export default AudioChat;
