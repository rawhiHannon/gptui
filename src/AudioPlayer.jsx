import { useState, useEffect, useRef } from "react";

const useAudioPlayer = (onGptSpeakingChange, isAudioEnabled) => {
  const audioQueue = useRef([]);
  const currentMessageAudioChunks = useRef([]);
  const historyMessageAudioChunks = useRef([]);
  const isProcessingAudio = useRef(false);
  const [isGptSpeaking, setIsGptSpeaking] = useState(false);
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const isPlaying = useRef(false);
  let isAudioStreaming = false;  

  useEffect(() => {
    if (!isPlaying.current) {
      setIsGptSpeaking(false);
      if (onGptSpeakingChange) {
        onGptSpeakingChange(false);
      }
    }
  }, [isPlaying.current, onGptSpeakingChange]);

  useEffect(() => {
    setIsGptSpeaking(isGptSpeaking);
    if (onGptSpeakingChange) {
      onGptSpeakingChange(isGptSpeaking);
    }
  }, [isGptSpeaking, onGptSpeakingChange]);
  
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
    if (isPlaying.current || currentMessageAudioChunks.current.length === 0) {
      return;
    }
  
    setIsGptSpeaking(true);
    isPlaying.current = true;
  
    const hasStreamComplete = currentMessageAudioChunks.current[currentMessageAudioChunks.current.length - 1] === "StreamComplete";
    const audioBlobs = hasStreamComplete ? currentMessageAudioChunks.current.slice(0, -1) : [...currentMessageAudioChunks.current];
    currentMessageAudioChunks.current = hasStreamComplete ? ["StreamComplete"] : [];
  
    if (audioBlobs.length === 0) {
      setIsGptSpeaking(false);
      isPlaying.current = false;
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
      isPlaying.current = false;
      setIsGptSpeaking(false);
      playNextAudioChunk(); // Play the next chunk if available
    };
  }
  
  function errorHandler(e) {
    console.error("Error decoding audio data: " + e.err);
    isPlaying.current = false;
    setIsGptSpeaking(false);
  }
  
  const base64ToBlob = (base64, contentType) => {
    const binaryString = window.atob(base64);
    const byteNumbers = new Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      byteNumbers[i] = binaryString.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
  };

  const addAudioToQueue  = (message) => {
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

        if (isPlaying.current == false) {
          playNextAudioChunk();
        }
      }
  };
  
  return {
    addAudioToQueue,
  };
};

export default useAudioPlayer;
