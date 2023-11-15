import React, { useState, useEffect, useRef } from "react";
import Manager from "./manager";
import Button from '@mui/material/Button';
import SendIcon from '@mui/icons-material/Send';
import Avatar from '@mui/material/Avatar';

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
  
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  let sourceNode = null;
  let audioBuffer = null;
  let isAudioStreaming = false;  

  const playAudioChunk = async (arrayBuffer) => {
    try {
      const additionalBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
      if (!audioBuffer) {
        audioBuffer = additionalBuffer;
      } else {
        const tmpBuffer = audioContext.createBuffer(
          audioBuffer.numberOfChannels,
          audioBuffer.length + additionalBuffer.length,
          audioBuffer.sampleRate
        );
  
        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
          const channelData = tmpBuffer.getChannelData(channel);
          channelData.set(audioBuffer.getChannelData(channel), 0);
          channelData.set(additionalBuffer.getChannelData(channel), audioBuffer.length);
        }
  
        audioBuffer = tmpBuffer;
      }
  
      if (sourceNode) {
        currentPlaybackTime = audioContext.currentTime - sourceNode.startTime;
        sourceNode.disconnect();
      }
  
      sourceNode = audioContext.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.connect(audioContext.destination);
      sourceNode.start(0, currentPlaybackTime);
      sourceNode.startTime = audioContext.currentTime - currentPlaybackTime;
    } catch (error) {
      console.error('Error playing audio chunk:', error);
    }
  };
  
  const receiveChatMessage = (message) => {
    if (message.text === "StreamComplete") {
      setIsGptSpeaking(false);
      isAudioStreaming = false;
      audioQueue.current.push([...currentMessageAudioChunks.current]);
      currentMessageAudioChunks.current = [];
      if (!isProcessingAudio.current) {
        processAudioQueue();
      }
      audioBuffer = null
      sourceNode = null

    } else {
      // This block handles the incoming audio chunks
      if (!isAudioStreaming) {
        setIsGptSpeaking(true);
        isAudioStreaming = true;
        currentMessageAudioChunks.current = [];
      }
  
      const audioBlob = base64ToBlob(message.text, 'audio/mpeg');
      currentMessageAudioChunks.current.push(audioBlob);
  
      // Convert the Blob to ArrayBuffer for the audio context
      const reader = new FileReader();
      reader.onload = function() {
        const arrayBuffer = this.result;
        playAudioChunk(arrayBuffer);
      };
      reader.readAsArrayBuffer(audioBlob);
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
