import { useState, useEffect, useRef } from "react";

const useAudioPlayer = (onGptSpeakingChange, isAudioEnabledRef, onStreamComplete) => {
  const audioQueue = useRef([]);
  const currentMessageAudioChunks = useRef([]);
  const historyMessageAudioChunks = useRef([]);
  const streamCompleted = useRef(false);
  const isProcessingAudio = useRef(false);
  const [isGptSpeaking, setIsGptSpeaking] = useState(false);
  const audioContextRef = useRef(null);
  const isPlaying = useRef(false);
  let isAudioStreaming = false;
  const sourceRef = useRef(null);
  const isPaused = useRef(false);
  const activeSources = useRef([]);
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
  
  const pauseAudio = (paused) => {
    let state = true;
    if(paused === false) {
      state = false
    } 
    isPaused.current = state;
  };

  const playAudio = () => {
    isPaused.current = false;
    playNextAudioChunk();
  };

  function playNextAudioChunk() {
    if (isPlaying.current || isPaused.current) {
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
    if (currentMessageAudioChunks.current.length === 0) {
      setIsGptSpeaking(false);
      isPlaying.current = false;
      if(streamCompleted.current == true) {
        if(onStreamComplete) {
          onStreamComplete()
        }
      }
      return;
    }

    setIsGptSpeaking(true);
    isPlaying.current = true;

    const combinedBlob = new Blob([...currentMessageAudioChunks.current], { type: 'audio/mpeg' });
    currentMessageAudioChunks.current = [];

    const reader = new FileReader();
    reader.onload = function() {
      const arrayBuffer = this.result;
      audioContextRef.current.decodeAudioData(arrayBuffer, playBuffer, errorHandler);
    };
    reader.readAsArrayBuffer(combinedBlob);
  }

  
  function playBuffer(audioBuffer) {
    const source = audioContextRef.current.createBufferSource();
    audioContextRef.current.resume().then(() => {
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start();
      activeSources.current.push(source);
  
      source.onended = () => {
        isPlaying.current = false;
        setIsGptSpeaking(false);
        isSpecialMessagePlaying = false;
        activeSources.current = activeSources.current.filter(s => s !== source);
        playNextAudioChunk();
      };
    });
  }
  
  const stop = () => {
    // Stop the current audio source if it's playing
    activeSources.current.forEach(source => source.stop());
    activeSources.current = []; // Clear the list of active sources.

    // Clear the audio queues
    audioQueue.current = [];
    currentMessageAudioChunks.current = [];

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
    try {
      const binaryString = window.atob(base64);
      const byteNumbers = new Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        byteNumbers[i] = binaryString.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type: contentType });
    } catch (e) {
      console.log(base64)
      return new Blob([], { type: contentType });
    }

  };

  const addAudioToQueue  = (stream) => {
    if (stream.startsWith("<filler>")) {
      const base64Audio = stream.split("<filler>")[1].trim();
      const audioBlob = base64ToBlob(base64Audio, 'audio/mpeg');
  
      // Stop current audio if playing
      stop();
      isSpecialMessagePlaying = true;
      currentMessageAudioChunks.current = [audioBlob];
      streamCompleted.current = false;
      playNextAudioChunk();
      return;
    }
    if (stream === "<cancel>") {
      stop();
      return;
    }
    if (stream === "<stream_complete>") {
      streamCompleted.current = true;
    } else {
        if(!isAudioEnabledRef.current) {
          return
        }
        streamCompleted.current = false;
        const audioBlob = base64ToBlob(stream, 'audio/mpeg');
        currentMessageAudioChunks.current.push(audioBlob);

        if (isPlaying.current == false && isPaused.current == false) {
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
