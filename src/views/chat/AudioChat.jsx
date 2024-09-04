import React, { useState, useEffect, useRef } from "react";
import Manager from "../../controllers/manager";
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
import AudioStreamer from "./AudioStreamer";
import useAudioPlayer from './AudioPlayer'; // Adjust the path as per your project structure
import GptFace from "./GptFace";
import Contacts from "./Contacts";
import MenuIcon from '@mui/icons-material/Menu';
import axios from 'axios';
import apiConfig from '../../controllers/variables/api';
import './jarvis.css'
import Auth from "../../controllers/auth";
import { useNavigate } from 'react-router-dom';

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
  const currentAgentIdRef = useRef(currentAgentId);
  const [currentAgentName, setCurrentAgentName] = useState("");
  const audioStreamerRef = useRef();
  const [isOtherSideTyping, setIsOtherSideTyping] = useState(false);
  const navigate = useNavigate();
  const lastUserMessageTimeRef = useRef(null);
  const TIME_THRESHOLD = 400;


  useEffect(() => {
    if (!Auth.isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [Auth.isAuthenticated]);


  const handleOtherSideTyping = () => {
    setIsOtherSideTyping(true);
    setTimeout(() => {
      setIsOtherSideTyping(false);
    }, 5000);
  };

  const handleCloseDialog = () => {
      if (audioStreamerRef.current) {
          audioStreamerRef.current.closeDialog();
      }
  };

  const fetchAgents = async () => {
    try {
      const response = await axios.get(`${apiConfig.apiHost}/agents`);
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
    currentAgentIdRef.current = currentAgentId;
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
      if(isOnCall) {
        try  {
          handleCloseDialog()
        } catch(e) {}
      }
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
    const now = new Date();
    if (message.transcription) {
      const msElapsed = now.getTime() - lastMessageTimeRef.current.getTime();
      setMessages(messages => [...messages, {
        id: messages.length + 1,
        text: message.transcription,
        user: { name: "rawhi" },
        timestamp: now,
        ms: msElapsed
      }]);
      lastUserMessageTimeRef.current = now;
    } else if (message.text) {
      const timeSinceLastUserMessage = now.getTime() - (lastUserMessageTimeRef.current?.getTime() || 0);
      
      // Ignore messages that arrive less than TIME_THRESHOLD after a user message
      if (timeSinceLastUserMessage < TIME_THRESHOLD) {
        console.log("Ignoring late message from previous request");
        return;
      }

      setIsOtherSideTyping(false);
      const msElapsed = now.getTime() - lastMessageTimeRef.current.getTime();
      
      setMessages(messages => {
        const lastMessage = messages[messages.length - 1];
        
        if (lastMessage && lastMessage.user.name === "GPT") {
          // If the last message is from GPT, concatenate
          const updatedMessages = [...messages];
          updatedMessages[updatedMessages.length - 1] = {
            ...lastMessage,
            text: lastMessage.text + " " + message.text,
            timestamp: now,
            ms: msElapsed
          };
          return updatedMessages;
        } else {
          // If it's a new response, add a new message
          return [...messages, {
            id: messages.length + 1,
            text: message.text,
            user: { name: "GPT" },
            timestamp: now,
            ms: msElapsed
          }];
        }
      });
    } else if (message.stream) {
      if(isAudioEnabledRef.current) {
        if(message.stream === "<close_stream>") {
          handleCloseDialog();
        } else {
          addAudioToQueue(message.stream);
        }
      }
    }
  };

  const sendMessage = () => {
    play();
    const timestamp = new Date();
    lastMessageTimeRef.current = timestamp;
    lastUserMessageTimeRef.current = timestamp; // Update the last user message time
    let msg = { 
      id: messages.length + 1, 
      text, 
      user: { name: "rawhi", avatar: "r", color: "green" },
      timestamp: timestamp,
      ms: 0 
    };
    pauseAudio(false);
    Manager.send(msg.text, currentAgentId);
    setMessages(prevMessages => [...prevMessages, msg]);
    setText("");
    handleOtherSideTyping();
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

  const signout = () => {
    Auth.signout()
    setShowMenu(false);
  };

  const toggleAudio = (event) => {
    event.stopPropagation();
    isAudioEnabledRef.current = !isAudioEnabledRef.current
    stop();
    setIsAudioEnabled(isAudioEnabledRef.current);
    localStorage.setItem("audio", ""+isAudioEnabledRef.current)
  };

  const closeStream = () => {
    stop()
    setOnCall(false)
    Manager.sendStream("<close_stream>", currentAgentIdRef.current)
    return
  };

  const handleAudioStream = (data) => {
    if(data === "<start_stream>") {
      pauseAudio();
      setOnCall(true)
      Manager.sendStream(data, currentAgentId)
      return
    }
    if(data === "<close_stream>") {
      stop()
      setOnCall(false)
      Manager.sendStream(data, currentAgentId)
      return
    }
    Manager.sendStreamBytes(data, currentAgentId)
  };

  const handleStreamStarted = () => {
    setTimeout(playAudio, 1300);
  }

  const handleAudio = (base64audio, blob) => {
    lastMessageTimeRef.current = new Date()
    Manager.sendVoice(base64audio, currentAgentId)
  }

  const {
    addAudioToQueue,
    stop,
    pauseAudio,
    playAudio,
  } = useAudioPlayer(handleGptSpeakingChange, isAudioEnabledRef, closeStream);

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
          <div className="menu-item" onClick={signout}>Sign out</div>
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

    {isOtherSideTyping && (
      <div className={`message other`}>
          <div className="typing">
            <div className="dot-container">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          </div>
        </div>
    )}

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
