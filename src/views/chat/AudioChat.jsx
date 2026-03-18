import React, { useState, useEffect, useRef } from "react";
import Manager from "../../controllers/manager";
import useSound from 'use-sound';
import boopSfx from './interface-124464.mp3';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import PhoneIcon from '@mui/icons-material/LocalPhone';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import AudioEngine from "./AudioEngine";
import useAudioPlayer from './AudioPlayerPCM';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import axios from 'axios';
import apiConfig from '../../controllers/variables/api';
import './jarvis.css';
import logo from '../../assets/logo.png';

const AudioChat = () => {
  const [messages, setMessages] = useState([]);
  const chatMessagesRef = useRef(null);
  const [play] = useSound(boopSfx);
  const [isOnline, setIsOnline] = useState(false);
  const [isOnCall, setOnCall] = useState(false);
  const [isGptSpeaking, setIsGptSpeaking] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const isAudioEnabledRef = useRef(false);
  const lastMessageTimeRef = useRef(new Date());
  const [agents, setAgents] = useState([]);
  const [currentAgentId, setCurrentAgentId] = useState(null);
  const currentAgentIdRef = useRef(currentAgentId);
  const [currentAgentName, setCurrentAgentName] = useState("");
  const audioEngineRef = useRef();
  const [isOtherSideTyping, setIsOtherSideTyping] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const lastUserMessageTimeRef = useRef(null);
  const TIME_THRESHOLD = 400;

  // Call state from AudioEngine
  const [callStatus, setCallStatus] = useState({
    isStreaming: false,
    isDialing: false,
    isMicOn: true,
    callTime: 0,
  });

  const handleEndCall = () => {
    if (audioEngineRef.current) {
      audioEngineRef.current.endCall();
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await axios.get(`${apiConfig.apiHost}/demoAssistants`);
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
    if (!currentAgentId) return;

    const agentSpecificKey = `messages_${currentAgentId}`;
    const storedMessages = localStorage.getItem(agentSpecificKey);
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    } else {
      setMessages([]);
    }
    localStorage.setItem('currentAgentId', currentAgentId);
    for (let i in agents) {
      if (agents[i].id == currentAgentId) {
        setCurrentAgentName(agents[i].name);
      }
    }
  }, [currentAgentId]);

  useEffect(() => { fetchAgents(); }, []);

  useEffect(() => {
    if (!isOnline) {
      if (isOnCall) {
        try { handleEndCall(); } catch (e) {}
      }
      return;
    }
    fetchAgents();
  }, [isOnline]);

  const handleGptSpeakingChange = (isSpeaking) => setIsGptSpeaking(isSpeaking);

  useEffect(() => {
    const audioSetting = localStorage.getItem("audio") === "true";
    isAudioEnabledRef.current = audioSetting;
    setIsAudioEnabled(audioSetting);
  }, []);

  useEffect(() => {
    Manager.registerChatHandler(receiveChatMessage);
    setIsOnline(Manager.isWSConnected());
    Manager.setWSStatusCallback((status) => setIsOnline(status));
  }, []);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
    if (!currentAgentId) return;
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
      if (timeSinceLastUserMessage < TIME_THRESHOLD) return;

      setIsOtherSideTyping(false);
      const msElapsed = now.getTime() - lastMessageTimeRef.current.getTime();

      setMessages(messages => {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.user.name === "GPT") {
          const updatedMessages = [...messages];
          updatedMessages[updatedMessages.length - 1] = {
            ...lastMessage,
            text: lastMessage.text + " " + message.text,
            timestamp: now,
            ms: msElapsed
          };
          return updatedMessages;
        } else {
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
      if (isAudioEnabledRef.current) {
        if (message.stream === "<close_stream>") {
          handleEndCall();
        } else {
          addAudioToQueue(message.stream);
        }
      }
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatCallTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const clearHistory = () => {
    setMessages([]);
    const agentSpecificKey = `messages_${currentAgentId}`;
    localStorage.removeItem(agentSpecificKey);
    lastMessageTimeRef.current = new Date();
  };

  const toggleAudio = (event) => {
    if (event) event.stopPropagation();
    isAudioEnabledRef.current = !isAudioEnabledRef.current;
    stop();
    setIsAudioEnabled(isAudioEnabledRef.current);
    localStorage.setItem("audio", "" + isAudioEnabledRef.current);
  };

  const closeStream = () => {
    stop();
    setOnCall(false);
    Manager.sendStream("<close_stream>", currentAgentIdRef.current);
  };

  const handleAudioStream = (data) => {
    if (data === "<start_stream>") {
      pauseAudio();
      setOnCall(true);
      Manager.sendStream(data, currentAgentId);
      return;
    }
    if (data === "<close_stream>") {
      stop();
      setOnCall(false);
      Manager.sendStream(data, currentAgentId);
      return;
    }
    Manager.sendStreamBytes(data, currentAgentId);
  };

  const handleStreamStarted = () => {
    setTimeout(playAudio, 1300);
  };

  const {
    addAudioToQueue,
    stop,
    pauseAudio,
    playAudio,
  } = useAudioPlayer(handleGptSpeakingChange, isAudioEnabledRef, closeStream);

  const getAgentInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : "A";
  };

  const getCurrentAgent = () => {
    return agents.find(a => a.id == currentAgentId);
  };

  const handleStartCall = () => {
    if (isOnline && currentAgentId && audioEngineRef.current) {
      audioEngineRef.current.startCall();
    }
  };

  const handleToggleMic = () => {
    if (audioEngineRef.current) {
      audioEngineRef.current.toggleMic();
    }
  };

  const isActive = callStatus.isStreaming || callStatus.isDialing;

  return (
    <div className="landing-page">
      {/* Headless audio engine */}
      <AudioEngine
        ref={audioEngineRef}
        onAudioStream={handleAudioStream}
        onStreamStarted={handleStreamStarted}
        onStatusChange={setCallStatus}
      />

      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">
          <IconButton onClick={() => setShowMobileSidebar(!showMobileSidebar)} className="mobile-menu-btn" size="small">
            {showMobileSidebar ? <CloseIcon fontSize="small" /> : <MenuIcon fontSize="small" />}
          </IconButton>
          <img src={logo} alt="Logo" className="navbar-logo" />
          <span className="navbar-title">VoiceAI</span>
        </div>
      </nav>

      {/* Main two-column layout */}
      <div className="main-layout">
        {/* Mobile overlay */}
        {showMobileSidebar && <div className="mobile-overlay" onClick={() => setShowMobileSidebar(false)} />}

        {/* Left: Agent list */}
        <div className={`agents-panel ${showMobileSidebar ? 'open' : ''}`}>
          <div className="agents-panel-header">
            <div className="agents-panel-title">Agents</div>
            <div className="agents-panel-count">{agents.length} available</div>
          </div>
          <div className="agents-list">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className={`agent-item ${currentAgentId == agent.id ? 'active' : ''}`}
                onClick={() => { setCurrentAgentId(agent.id); setShowMobileSidebar(false); }}
              >
                {agent.profile_pic ? (
                  <img src={agent.profile_pic} alt={agent.name} className="agent-avatar" />
                ) : (
                  <div className="agent-avatar-placeholder">
                    {getAgentInitial(agent.name)}
                  </div>
                )}
                <div className="agent-item-info">
                  <div className="agent-item-name">{agent.name}</div>
                  {agent.message && <div className="agent-item-desc">{agent.message}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Call bar + Transcript */}
        <div className="call-transcript-panel">
          {currentAgentId ? (
            <>
              {/* Top bar with agent info and call controls */}
              <div className={`call-bar ${isActive ? 'active' : ''}`}>
                <div className="call-bar-left">
                  {getCurrentAgent()?.profile_pic ? (
                    <img src={getCurrentAgent().profile_pic} alt="" className="call-bar-avatar" />
                  ) : (
                    <div className="agent-avatar-placeholder" style={{ width: 36, height: 36, fontSize: '0.9rem', borderRadius: 8 }}>
                      {getAgentInitial(currentAgentName)}
                    </div>
                  )}
                  <div>
                    <div className="call-bar-name">{currentAgentName}</div>
                    <div className={`call-bar-status ${isActive ? 'on-call' : ''}`}>
                      {callStatus.isDialing ? 'Connecting...' : callStatus.isStreaming ? 'On call' : 'Ready'}
                    </div>
                  </div>
                </div>
                <div className="call-bar-right">
                  {callStatus.isStreaming && (
                    <>
                      <div className="call-bar-timer">
                        {formatCallTime(callStatus.callTime)}
                      </div>
                      <button
                        onClick={toggleAudio}
                        className={`call-ctrl-btn ${!isAudioEnabled ? 'off' : ''}`}
                        title={isAudioEnabled ? 'Mute Audio' : 'Unmute Audio'}
                      >
                        {isAudioEnabled ? <VolumeUpIcon fontSize="small" /> : <VolumeOffIcon fontSize="small" />}
                      </button>
                      <button
                        onClick={handleToggleMic}
                        className={`call-ctrl-btn ${!callStatus.isMicOn ? 'off' : ''}`}
                        title={callStatus.isMicOn ? 'Mute Mic' : 'Unmute Mic'}
                      >
                        {callStatus.isMicOn ? <MicIcon fontSize="small" /> : <MicOffIcon fontSize="small" />}
                      </button>
                      <button onClick={handleEndCall} className="call-ctrl-btn end" title="End Call">
                        <CallEndIcon fontSize="small" />
                      </button>
                    </>
                  )}
                  {callStatus.isDialing && (
                    <>
                      <div className="call-bar-dialing">
                        <span className="dialing-dot"></span>
                        <span className="dialing-dot"></span>
                        <span className="dialing-dot"></span>
                      </div>
                      <button onClick={handleEndCall} className="call-ctrl-btn end" title="Cancel">
                        <CallEndIcon fontSize="small" />
                      </button>
                    </>
                  )}
                  {!isActive && (
                    <>
                      <button
                        onClick={handleStartCall}
                        className={`call-start-btn ${!(isOnline && currentAgentId) ? 'disabled' : ''}`}
                        disabled={!(isOnline && currentAgentId)}
                      >
                        <PhoneIcon fontSize="small" />
                      </button>
                      <button
                        onClick={clearHistory}
                        className="call-ctrl-btn"
                        title="Clear conversation"
                      >
                        <CloseIcon fontSize="small" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Transcript */}
              <div className="transcript-area" ref={chatMessagesRef}>
                {messages.length === 0 ? (
                  <div className="transcript-empty">
                    <div className="transcript-empty-icon">
                      <GraphicEqIcon />
                    </div>
                    <h3>Start a conversation</h3>
                    <p>Hit the call button to begin a voice conversation with {currentAgentName}.</p>
                  </div>
                ) : (
                  <>
                    {messages.map(message => {
                      const isUser = message.user.name === "rawhi";
                      return (
                        <div
                          key={message.id}
                          className={`message ${isUser ? 'me' : 'other'}`}
                        >
                          <div className="text">
                            {message.text}
                            <span className="message-time">
                              {formatTime(new Date(message.timestamp))}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {isOtherSideTyping && (
                      <div className="message other">
                        <div className="typing">
                          <div className="dot-container">
                            <div className="dot"></div>
                            <div className="dot"></div>
                            <div className="dot"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="transcript-area">
              <div className="transcript-empty">
                <div className="transcript-empty-icon">
                  <GraphicEqIcon />
                </div>
                <h3>Select an agent</h3>
                <p>Choose an agent from the list to get started.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioChat;
