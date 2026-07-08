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
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import IconButton from '@mui/material/IconButton';
import AudioEngine from "./AudioEngine";
import useAudioPlayer from './AudioPlayerPCM';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import PersonIcon from '@mui/icons-material/Person';
import AiAvatar from './AiAvatar';
import axios from 'axios';
import apiConfig from '../../controllers/variables/api';
import { LiveAvatarSession } from '@heygen/liveavatar-web-sdk';
import './jarvis.css';
import logo from '../../assets/logo.png';

const AudioChat = () => {
  const [messages, setMessages] = useState([]);
  const chatMessagesRef = useRef(null);
  const [play] = useSound(boopSfx);
  const [isOnline, setIsOnline] = useState(false);
  const [isOnCall, setOnCall] = useState(false);
  const isOnCallRef = useRef(false);
  const isStreamingRef = useRef(false);
  const pendingMessagesRef = useRef([]);
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

  // Avatar state
  const avatarSessionRef = useRef(null);
  const avatarVideoRef = useRef(null);
  const [avatarReady, setAvatarReady] = useState(false);
  const [avatarSupported, setAvatarSupported] = useState(true); // assume supported until proven otherwise

  // Call state from AudioEngine
  const [callStatus, setCallStatus] = useState({
    isStreaming: false,
    isDialing: false,
    isMicOn: true,
    callTime: 0,
  });
  const isExternalAgent = () => {
    const agent = getCurrentAgent();
    return agent?.conversation_type === 'external';
  };

  const handleEndCall = () => {
    isStreamingRef.current = false;
    pendingMessagesRef.current = [];
    if (audioEngineRef.current) {
      audioEngineRef.current.endCall();
    }
    stopAvatarSession();
  };

  const startAvatarSession = async () => {
    if (!avatarSupported) return;
    try {
      const res = await axios.post(`${apiConfig.apiHost}/demoAvatar/token`);
      const { session_token } = res.data;
      if (!session_token) {
        setAvatarSupported(false);
        return;
      }

      const session = new LiveAvatarSession(session_token, {
        voiceChat: false,
      });

      session.on("session.state_changed", (state) => {
        if (state === "CONNECTED") {
          setAvatarReady(true);
        } else if (state === "DISCONNECTED") {
          // Clear ref so audio falls back to PCM player
          avatarSessionRef.current = null;
          setAvatarReady(false);
        }
      });

      session.on("session.disconnected", () => {
        avatarSessionRef.current = null;
        setAvatarReady(false);
        // Auto-reconnect if still on a call
        if (isOnCallRef.current) {
          console.log("[Avatar] Session dropped, reconnecting...");
          setTimeout(() => startAvatarSession(), 1000);
        }
      });

      session.on("session.stream_ready", () => {
        if (avatarVideoRef.current) {
          session.attach(avatarVideoRef.current);
        }
      });

      await session.start();
      avatarSessionRef.current = session;
    } catch (err) {
      console.error("Avatar not available:", err.message);
      setAvatarSupported(false);
    }
  };

  const stopAvatarSession = async () => {
    if (avatarSessionRef.current) {
      try {
        await avatarSessionRef.current.stop();
      } catch (e) {}
      avatarSessionRef.current = null;
      setAvatarReady(false);
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

  const addTranscriptionMessage = (msg) => {
    const msElapsed = msg.timestamp.getTime() - lastMessageTimeRef.current.getTime();
    setMessages(messages => [...messages, {
      id: messages.length + 1,
      text: msg.transcription,
      user: { name: "rawhi" },
      timestamp: msg.timestamp,
      ms: msElapsed
    }]);
    lastUserMessageTimeRef.current = msg.timestamp;
  };

  const addTextMessage = (msg) => {
    const timeSinceLastUserMessage = msg.timestamp.getTime() - (lastUserMessageTimeRef.current?.getTime() || 0);
    if (timeSinceLastUserMessage < TIME_THRESHOLD) return;

    setIsOtherSideTyping(false);
    const msElapsed = msg.timestamp.getTime() - lastMessageTimeRef.current.getTime();

    setMessages(messages => {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.user.name === "GPT") {
        const updatedMessages = [...messages];
        updatedMessages[updatedMessages.length - 1] = {
          ...lastMessage,
          text: lastMessage.text + " " + msg.text,
          timestamp: msg.timestamp,
          ms: msElapsed
        };
        return updatedMessages;
      } else {
        return [...messages, {
          id: messages.length + 1,
          text: msg.text,
          user: { name: "GPT" },
          timestamp: msg.timestamp,
          ms: msElapsed
        }];
      }
    });
  };

  const flushPendingMessages = () => {
    const pending = pendingMessagesRef.current;
    pendingMessagesRef.current = [];
    for (const msg of pending) {
      if (msg.transcription) addTranscriptionMessage(msg);
      else if (msg.text) addTextMessage(msg);
    }
  };

  const receiveChatMessage = (message) => {
    const now = new Date();
    const external = isExternalAgent();

    if (message.transcription && !external) {
      if (!isOnCallRef.current) return;
      const msg = { transcription: message.transcription, timestamp: now };
      if (!isStreamingRef.current) {
        pendingMessagesRef.current.push(msg);
        return;
      }
      addTranscriptionMessage(msg);
    } else if (message.text && !external) {
      if (!isOnCallRef.current) return;
      const msg = { text: message.text, timestamp: now };
      if (!isStreamingRef.current) {
        pendingMessagesRef.current.push(msg);
        return;
      }
      addTextMessage(msg);
    } else if (message.stream) {
      if (isAudioEnabledRef.current) {
        if (message.stream === "<close_stream>" || message.stream === "<service_error>") {
          handleEndCall();
        } else if (message.stream === "<cancel>") {
          if (avatarSessionRef.current) {
            try { avatarSessionRef.current.interrupt(); } catch (e) {
              avatarSessionRef.current = null;
              setAvatarReady(false);
            }
          }
          addAudioToQueue(message.stream);
        } else {
          if (avatarSessionRef.current) {
            try {
              avatarSessionRef.current.repeatAudio(message.stream);
            } catch (e) {
              // Session died — clear ref and fall back to PCM
              avatarSessionRef.current = null;
              setAvatarReady(false);
              addAudioToQueue(message.stream);
            }
          } else {
            addAudioToQueue(message.stream);
          }
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
    isOnCallRef.current = false;
    setOnCall(false);
    Manager.sendStream("<close_stream>", currentAgentIdRef.current);
  };

  const handleAudioStream = (data) => {
    if (data === "<start_stream>") {
      pauseAudio();
      isOnCallRef.current = true;
      setOnCall(true);
      Manager.sendStream(data, currentAgentId);
      // Start avatar session for external agents
      if (isExternalAgent()) {
        startAvatarSession();
      }
      return;
    }
    if (data === "<close_stream>") {
      stop();
      isOnCallRef.current = false;
      setOnCall(false);
      Manager.sendStream(data, currentAgentId);
      stopAvatarSession();
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
  const external = isExternalAgent();
  const showAvatar = external && avatarSupported;
  const showFace = external && !avatarSupported;

  return (
    <div className="landing-page">
      {/* Headless audio engine */}
      <AudioEngine
        ref={audioEngineRef}
        onAudioStream={handleAudioStream}
        onStreamStarted={handleStreamStarted}
        onStatusChange={(status) => {
          const wasStreaming = isStreamingRef.current;
          isStreamingRef.current = status.isStreaming;
          setCallStatus(status);
          if (!wasStreaming && status.isStreaming) {
            flushPendingMessages();
          }
        }}
      />

      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">
          <IconButton onClick={() => setShowMobileSidebar(!showMobileSidebar)} className="mobile-menu-btn" size="small">
            {showMobileSidebar ? <CloseIcon fontSize="small" /> : <MenuIcon fontSize="small" />}
          </IconButton>
          <img src={logo} alt="Logo" className="navbar-logo" />
          <span className="navbar-title">RingEn</span>
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
                className={`agent-item ${currentAgentId == agent.id ? 'active' : ''} ${isActive ? 'disabled' : ''}`}
                onClick={() => { if (!isActive) { setCurrentAgentId(agent.id); setShowMobileSidebar(false); } }}
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

        {/* Right: Call bar + Transcript/Avatar */}
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
                      {!showAvatar && (
                        <button
                          onClick={toggleAudio}
                          className={`call-ctrl-btn ${!isAudioEnabled ? 'off' : ''}`}
                          title={isAudioEnabled ? 'Mute Audio' : 'Unmute Audio'}
                        >
                          {isAudioEnabled ? <VolumeUpIcon fontSize="small" /> : <VolumeOffIcon fontSize="small" />}
                        </button>
                      )}
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
                      {!external && messages.length > 0 && (
                        <button
                          onClick={clearHistory}
                          className="clear-history-btn"
                          title="Clear conversation history"
                        >
                          <DeleteSweepIcon style={{ fontSize: 16 }} />
                          <span>Clear</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Avatar view for external agents with LiveAvatar */}
              {showAvatar ? (
                <div className={`avatar-container${avatarReady ? ' live' : ''}`}>
                  <video
                    ref={avatarVideoRef}
                    autoPlay
                    playsInline
                    className="avatar-video"
                  />
                  {!isActive && !avatarReady && (
                    <div className="avatar-placeholder">
                      <AiAvatar isSpeaking={false} size={160} />
                      <h3>Start a call</h3>
                      <p>Hit the call button to begin a voice conversation with {currentAgentName}.</p>
                    </div>
                  )}
                  {isActive && !avatarReady && (
                    <div className="avatar-placeholder">
                      <AiAvatar isSpeaking={true} size={160} />
                      <p>Connecting avatar...</p>
                    </div>
                  )}
                </div>
              ) : showFace ? (
                /* Animated orb fallback for external agents without LiveAvatar */
                <div className="avatar-container">
                  <div className="avatar-placeholder">
                    {isActive ? (
                      <AiAvatar isSpeaking={isGptSpeaking} size={200} />
                    ) : (
                      <>
                        <AiAvatar isSpeaking={false} size={160} />
                        <h3>Start a call</h3>
                        <p>Hit the call button to begin a voice conversation with {currentAgentName}.</p>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                /* Transcript view for standard agents */
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
              )}
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
