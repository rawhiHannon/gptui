import React, { useState, useEffect, useRef } from "react";
import Manager from "./manager";
import Button from '@mui/material/Button';
import SendIcon from '@mui/icons-material/Send';
import Avatar from '@mui/material/Avatar';
import { faL } from "@fortawesome/free-solid-svg-icons";

const AudioChat = () => {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);
  const audioQueue = useRef([]);
  const chatMessagesRef = useRef(null);
  const currentMessageAudioChunks = useRef([]);
  const isProcessingAudio = useRef(false);
  const [isGptSpeaking, setIsGptSpeaking] = useState(false);
  let currentPlaybackTime = 0;

  useEffect(() => {
    Manager.registerChatHandler(receiveChatMessage);
  }, []);

  useEffect(() => {
    chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
  }, [messages]);

  let isPlaying = false;
  let finished = true;

  useEffect(() => {
    if (!isPlaying) {
      setIsGptSpeaking(false);
    }
  }, [isPlaying]);

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
  
  let streamFinished = true;

  function playNextAudioChunk() {
    if(currentMessageAudioChunks.current.length == 0) {
      streamFinished = true;
    }
    if (isPlaying || currentMessageAudioChunks.current.length === 0) {
      // Already playing or no chunks to play
      return;
    }
  
    isPlaying = true;
    streamFinished = false;
    setIsGptSpeaking(true);
    const audioBlob = currentMessageAudioChunks.current.shift();
    
    if(audioBlob == null) {
      setIsGptSpeaking(false);
      finished = true;
    }

    const reader = new FileReader();
    reader.onload = function() {
      const arrayBuffer = this.result;
      audioContext.decodeAudioData(arrayBuffer, playBuffer, errorHandler);
    };
    reader.readAsArrayBuffer(audioBlob);
  }
  
  function playBuffer(audioBuffer) {
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
  
    source.onended = () => {
      isPlaying = false;
      this.forceUpdate(); // If you're using class components
      playNextAudioChunk(); // Play the next chunk if available
    };
  }
  
  function errorHandler(e) {
    console.error("Error decoding audio data: " + e.err);
  }


  // const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  let isAudioStreaming = false;  

  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  const receiveChatMessage = (message) => {
    if (message.text === "StreamComplete") {
      isAudioStreaming = false;
      audioQueue.current.push([...currentMessageAudioChunks.current]);
      // currentMessageAudioChunks.current = [];
      if (!isProcessingAudio.current) {
        processAudioQueue();
      }
      currentMessageAudioChunks.current.push(null);
    } else {
      // This block handles the incoming audio chunks
      if (!isAudioStreaming) {
        isAudioStreaming = true;
        // currentMessageAudioChunks.current = [];
      }

      const audioBlob = base64ToBlob(message.text, 'audio/mpeg');
      currentMessageAudioChunks.current.push(audioBlob);
  
      if (streamFinished == true) {
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
    let msg = { 
      id: messages.length + 1, 
      text, 
      user: { name: "rawhi", avatar: "r", color: "green" } 
    };
    Manager.send(msg.text);
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
      {isGptSpeaking && <div>GPT is speaking...</div>}
    </div>
      <div className="chat-messages" ref={chatMessagesRef}>
        {messages.map(message => (
          <div key={message.id} className={`message ${message.user.name === "rawhi" ? 'me' : 'other'}`}>
            {message.text &&               <>
                <div className="text" style={{ alignSelf: "center" }}>{message.text}</div>
                <Avatar sx={{ bgcolor: message.user.color }} style={{ width: "40px", height: "40px", marginLeft: "10px" }}>{message.user.avatar}</Avatar>
              </>}
            {message.audioUrl &&               <>
                <Avatar sx={{ bgcolor: message.user.color }} style={{ width: "40px", height: "40px", marginRight: "10px" }}>{message.user.avatar}</Avatar>
                <audio controls src={message.audioUrl}></audio>
              </>}
          </div>
        ))}
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

export default AudioChat;
