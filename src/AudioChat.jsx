import React, { useState, useEffect, useRef } from "react";
import Manager from "./manager";
import Button from '@mui/material/Button';
import SendIcon from '@mui/icons-material/Send';
import Avatar from '@mui/material/Avatar';
import { faL } from "@fortawesome/free-solid-svg-icons";
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/Stop';
import useSound from 'use-sound';
import boopSfx from './interface-124464.mp3';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArchiveIcon from '@mui/icons-material/Archive';
import ContentPasteSearchIcon from '@mui/icons-material/ContentPasteSearch';

const AudioChat = () => {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);
  const audioQueue = useRef([]);
  const chatMessagesRef = useRef(null);
  const currentMessageAudioChunks = useRef([]);
  const historyMessageAudioChunks = useRef([]);
  const isProcessingAudio = useRef(false);
  const [isGptSpeaking, setIsGptSpeaking] = useState(false);
  const [play] = useSound(boopSfx);

  const [isMouseDown, setIsMouseDown] = useState(false);
  const [hasSpeechEnded, setHasSpeechEnded] = useState(false);

  useEffect(() => {
    // Add global mouseup event listener
    const handleGlobalMouseUp = () => {
      if (isMouseDown) {
        setIsRecording(false); // Stop recording when mouse is released
        setIsMouseDown(false);
        if (hasSpeechEnded && transcriptAccumulator.current.trim().length > 0) {
          sendTextMessage(transcriptAccumulator.current);
          transcriptAccumulator.current = "";
        }
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isMouseDown]);

  useEffect(() => {
    Manager.registerChatHandler(receiveChatMessage);
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


  const [isRecording, setIsRecording] = useState(false);
  const speechRecognitionRef = useRef(null);
  const audioStartRef = useRef(new Audio('interface-124464.mp3'));
  const transcriptAccumulator = useRef("");  // Local variable for accumulating transcript

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      speechRecognitionRef.current = new SpeechRecognition();
      speechRecognitionRef.current.continuous = false;
      speechRecognitionRef.current.lang = 'en-US';
      speechRecognitionRef.current.interimResults = false;

      speechRecognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        transcriptAccumulator.current += transcript; // Accumulate transcript
      };

      speechRecognitionRef.current.onend = () => {
        setHasSpeechEnded(true);
        if (!isMouseDown && transcriptAccumulator.current.trim().length > 0) {
          sendTextMessage(transcriptAccumulator.current);
          transcriptAccumulator.current = "";
        }
      };

      speechRecognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
      };
    } else {
      console.error('Speech recognition not supported in this browser.');
    }
  }, []);

  const startRecording = () => {
    play()
    setIsRecording(true);
    transcriptAccumulator.current = "";  // Clear accumulator
    setIsMouseDown(true);
    speechRecognitionRef.current.start();
  };

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
    if (isPlaying || currentMessageAudioChunks.current.length === 0) {
      // Already playing or no chunks to play
      return;
    }
  
    setIsGptSpeaking(true);
    isPlaying = true;
  
    // Determine if the last item is "StreamComplete"
    const hasStreamComplete = currentMessageAudioChunks.current[currentMessageAudioChunks.current.length - 1] === "StreamComplete";
  
    // Extract all chunks except "StreamComplete" if it's present
    const audioBlobs = hasStreamComplete ? currentMessageAudioChunks.current.slice(0, -1) : [...currentMessageAudioChunks.current];
    
    // Clear the array except for "StreamComplete" if it's present
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


  // const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  let isAudioStreaming = false;  

  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  async function sendAudioToSTTService(audioBlob) {
    // Implement the actual call to the STT service here
    // Return the transcribed text
    return "Transcribed text from audio";
  }

  const receiveChatMessage = (message) => {
    if (message.text === "StreamComplete") {
      isAudioStreaming = false;
      audioQueue.current.push([...historyMessageAudioChunks.current]);
      historyMessageAudioChunks.current = [];
      historyMessageAudioChunks.current.push(message.text);
      if (!isProcessingAudio.current) {
        // processAudioQueue();
      }
      const transcribedText = "Recevied all chunks.";
      setMessages(messages => [...messages, { id: messages.length + 1, text: transcribedText, user: { name: "GPT", avatar: "gpt", color: "maroon" } }]);
    } else {
      // This block handles the incoming audio chunks
      if (!isAudioStreaming) {
        isAudioStreaming = true;
        historyMessageAudioChunks.current = [];
      }

      const audioBlob = base64ToBlob(message.text, 'audio/mpeg');
      currentMessageAudioChunks.current.push(audioBlob);
      historyMessageAudioChunks.current.push(audioBlob);

      if (isPlaying == false) {
        playNextAudioChunk();
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
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const toggleRecording = () => {
    setIsManuallyStopped(isRecording);
    setIsRecording(!isRecording);
    if (!isRecording) {
      speechRecognitionRef.current.start();
    } else {
      speechRecognitionRef.current.stop();
    }
  };

  return (
    <div>

    <div className="chat-container">
  <div className="sidebar">

  <div className="assistant-tab active">
      <Avatar sx={{ bgcolor: "gray" }} style={{ width: "40px", height: "40px", marginRight: "10px" }} />
      <div>
        <span className="assistant-name">Assistant 1</span>
        <div className="last-message">Last message...</div>
      </div>
    </div>
    <div className="assistant-tab">
      <Avatar sx={{ bgcolor: "gray" }} style={{ width: "40px", height: "40px", marginRight: "10px" }} />
      <div>
        <span className="assistant-name">Assistant 2</span>
        <div className="last-message">Last message...</div>
      </div>
    </div>

    {/* Add more tabs or elements here as needed */}
  </div>

  <div className="chat">
  <div className="person-info">
    <Avatar sx={{ bgcolor: "gray" }} style={{ width: "50px", height: "50px", marginRight: "10px" }} />
    <div className="person-details">
      <h2>Assistant1</h2>
      <p>Online</p>
    </div>
    <div className="icon-container">
      <MoreVertIcon />
    </div>
  </div>

    <div className="chat-messages" ref={chatMessagesRef}>
        {messages.map(message => (
      <div
        key={message.id}
        className={`message ${message.user.name === "rawhi" ? 'me' : 'other'}`}
      >
        <div className="text">
          {message.text}
          <span className={`message-time ${message.user.name === "rawhi" ? 'me' : 'other'}`}>10:15</span>
        </div>
      </div>
    ))}
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
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button disabled={!text} onClick={() => sendMessage()} variant="contained"
        >
        {<SendIcon />}
        </Button>
        <Button 
        onMouseDown={startRecording} 
        variant="contained"
      >
          {isRecording ? <MicOffIcon  style={{ color: "red", minWidth: "40px" }} /> : <MicIcon onClick={play} />}
        </Button>
      </div>
    </div>
    </div>
    </div>
  );
};

export default AudioChat;
