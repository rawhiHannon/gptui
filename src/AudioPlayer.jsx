import { useState, useEffect, useRef } from "react";

const useAudioPlayer = (onGptSpeakingChange, isAudioEnabledRef) => {
  const audioQueue = useRef([]);
  const currentMessageAudioChunks = useRef([]);
  const historyMessageAudioChunks = useRef([]);
  const isProcessingAudio = useRef(false);
  const [isGptSpeaking, setIsGptSpeaking] = useState(false);
  const audioContextRef = useRef(null);
  const isPlaying = useRef(false);
  let isAudioStreaming = false;
  const sourceRef = useRef(null);
  const isPaused = useRef(false);
  let isSpecialMessagePlaying = false; 

  useEffect(() => {
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
      // Resume audio context on user interaction for iOS compatibility
      const resumeAudioContext = () => {
        if (audioContextRef.current.state === "suspended") {
          audioContextRef.current.resume();
        }
        window.removeEventListener('touchend', resumeAudioContext);
        window.removeEventListener('click', resumeAudioContext);
      };
      window.addEventListener('touchend', resumeAudioContext);
      window.addEventListener('click', resumeAudioContext);
    }
  }, []);

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
  
  const pauseAudio = () => {
    isPaused.current = true;
  };

  const playAudio = () => {
    if (isPaused.current && currentMessageAudioChunks.current.length > 0) {
      isPaused.current = false;
      playNextAudioChunk();
    }
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
    if (isPlaying.current || currentMessageAudioChunks.current.length === 0 || isPaused.current) {
      return;
    }

    // Check and potentially resume the AudioContext state for iOS
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume().then(() => {
        startAudioPlayback();
      });
    } else {
      startAudioPlayback();
    }
  }

  function startAudioPlayback() {
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
      audioContextRef.current.decodeAudioData(arrayBuffer, playBuffer, errorHandler);
    };
    reader.readAsArrayBuffer(combinedBlob);
  }

  
  function playBuffer(audioBuffer) {
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    source.start();
    sourceRef.current = source;

    source.onended = () => {
      isPlaying.current = false;
      setIsGptSpeaking(false);
      isSpecialMessagePlaying = false;
      playNextAudioChunk();
    };
  }
  
  const stop = () => {
    if (isSpecialMessagePlaying) {
      return;
    }
    // Stop the current audio source if it's playing
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current = null;
    }

    // Clear the audio queues
    audioQueue.current = [];
    currentMessageAudioChunks.current = [];
    historyMessageAudioChunks.current = [];

    // Reset states
    isPlaying.current = false;
    isProcessingAudio.current = false;
    setIsGptSpeaking(false);

    if (onGptSpeakingChange) {
      onGptSpeakingChange(false);
    }
  };


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

  const addAudioToQueue  = (stream) => {
    if (stream.startsWith("<filler>")) {
      const base64Audio = stream.split("<filler>")[1].trim();
      const audioBlob = base64ToBlob(base64Audio, 'audio/mpeg');
  
      // Stop current audio if playing
      stop();
      isSpecialMessagePlaying = true;
      currentMessageAudioChunks.current = [audioBlob];
      playNextAudioChunk();
      return;
    }
    if (stream === "<CANCEL>") {
      stop();
      return;
    }
    if (stream === "StreamComplete") {
        isAudioStreaming = false;
        audioQueue.current.push([...historyMessageAudioChunks.current]);
        historyMessageAudioChunks.current = [];
        historyMessageAudioChunks.current.push(stream);
        if (!isProcessingAudio.current) {
          // processAudioQueue();
        }
      } else {
        if(!isAudioEnabledRef.current) {
          return
        }
        if (!isAudioStreaming) {
          isAudioStreaming = true;
          historyMessageAudioChunks.current = [];
        }

        const audioBlob = base64ToBlob(stream, 'audio/mpeg');
        currentMessageAudioChunks.current.push(audioBlob);
        historyMessageAudioChunks.current.push(audioBlob);

        if (isPlaying.current == false) {
          playNextAudioChunk();
        }
      }
  };
  
  return {
    addAudioToQueue,
    stop,
    pauseAudio,
    playAudio
  };
};

export default useAudioPlayer;
