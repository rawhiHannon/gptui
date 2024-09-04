import { useState, useEffect, useRef } from "react";

const useAudioPlayer = (onGptSpeakingChange, isAudioEnabledRef, onStreamComplete) => {
  const currentMessageAudioChunks = useRef([]);
  const streamCompleted = useRef(false);
  const [isGptSpeaking, setIsGptSpeaking] = useState(false);
  const audioContextRef = useRef(null);
  const isPlaying = useRef(false);
  const isPaused = useRef(false);
  const activeSources = useRef([]);

  useEffect(() => {
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
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
    setIsGptSpeaking(isGptSpeaking);
    if (onGptSpeakingChange) {
      onGptSpeakingChange(isGptSpeaking);
    }
  }, [isGptSpeaking, onGptSpeakingChange]);

  const pauseAudio = (paused) => {
    isPaused.current = paused !== false;
    if (isPaused.current) {
      activeSources.current.forEach(source => source.stop());
      activeSources.current = [];
    } else {
      playNextAudioChunk();
    }
  };

  const playAudio = () => {
    isPaused.current = false;
    playNextAudioChunk();
  };

  function playNextAudioChunk() {
    if (isPlaying.current || isPaused.current || currentMessageAudioChunks.current.length === 0) {
      return;
    }

    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume().then(startAudioPlayback);
    } else {
      startAudioPlayback();
    }
  }

  function startAudioPlayback() {
    if (currentMessageAudioChunks.current.length === 0) {
      console.log("No audio chunks to play");
      setIsGptSpeaking(false);
      isPlaying.current = false;
      if (streamCompleted.current && onStreamComplete) {
        onStreamComplete();
      }
      return;
    }

    setIsGptSpeaking(true);
    isPlaying.current = true;

    console.log("Starting playback of", currentMessageAudioChunks.current.length, "chunks");
    const combinedBlob = new Blob(currentMessageAudioChunks.current, { type: 'audio/mpeg' });
    currentMessageAudioChunks.current = [];

    const reader = new FileReader();
    reader.onload = function() {
      const arrayBuffer = this.result;
      console.log("Decoding audio data", arrayBuffer.byteLength, "bytes");
      audioContextRef.current.decodeAudioData(arrayBuffer, playBuffer, errorHandler);
    };
    reader.readAsArrayBuffer(combinedBlob);
  }

  function playBuffer(audioBuffer) {
    console.log("Playing audio buffer", audioBuffer.duration, "seconds");
    const source = audioContextRef.current.createBufferSource();
    audioContextRef.current.resume().then(() => {
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start();
      activeSources.current.push(source);
  
      source.onended = () => {
        isPlaying.current = false;
        setIsGptSpeaking(false);
        activeSources.current = activeSources.current.filter(s => s !== source);
        playNextAudioChunk();
      };
    });
  }

  const stop = () => {
    activeSources.current.forEach(source => source.stop());
    activeSources.current = [];
    currentMessageAudioChunks.current = [];
    isPlaying.current = false;
    setIsGptSpeaking(false);
    if (onGptSpeakingChange) {
      onGptSpeakingChange(false);
    }
  };

  function errorHandler(e) {
    console.error("Error decoding audio data:", e);
    isPlaying.current = false;
    setIsGptSpeaking(false);
    playNextAudioChunk();
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
      console.error("Error converting base64 to Blob:", e);
      return new Blob([], { type: contentType });
    }
  };

  const addAudioToQueue = (stream) => {
    if (!isAudioEnabledRef.current) {
      console.log("Audio is disabled");
      return;
    }

    if (stream.startsWith("<filler>")) {
      const base64Audio = stream.split("<filler>")[1].trim();
      const audioBlob = base64ToBlob(base64Audio, 'audio/mpeg');
      stop();
      currentMessageAudioChunks.current = [audioBlob];
      streamCompleted.current = false;
      playNextAudioChunk();
    } else if (stream === "<cancel>") {
      stop();
    } else if (stream === "<stream_complete>") {
      streamCompleted.current = true;
      playNextAudioChunk(); // Ensure any remaining audio is played
    } else {
      streamCompleted.current = false;
      const audioBlob = base64ToBlob(stream, 'audio/mpeg');
      currentMessageAudioChunks.current.push(audioBlob);
      console.log("Added audio chunk, total chunks:", currentMessageAudioChunks.current.length);

      if (!isPlaying.current && !isPaused.current) {
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