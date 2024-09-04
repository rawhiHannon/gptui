import { useState, useEffect, useRef } from "react";

const useAudioPlayer = (onGptSpeakingChange, isAudioEnabledRef, onStreamComplete) => {
  const currentMessageAudioChunks = useRef([]);
  const streamCompleted = useRef(false);
  const [isGptSpeaking, setIsGptSpeaking] = useState(false);
  const audioContextRef = useRef(null);
  const isPlaying = useRef(false);
  const isPaused = useRef(false);
  const activeSources = useRef([]);
  const chunkSource = useRef(null);

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

  async function detectChunkSource(blob) {
    const arrayBuffer = await blob.arrayBuffer();
    const header = new Uint8Array(arrayBuffer.slice(0, 4));
    
    // Check for MP3 header (ID3 or MPEG sync word)
    if (
      (header[0] === 0x49 && header[1] === 0x44 && header[2] === 0x33) || // "ID3"
      (header[0] === 0xFF && (header[1] & 0xE0) === 0xE0) // MPEG sync word
    ) {
      console.log("Detected ElevenLabs chunk (MP3)");
      return 'elevenlabs';
    }
    
    // If not MP3, assume it's Azure TTS (raw PCM or other format)
    console.log("Detected Azure TTS chunk");
    return 'azure';
  }

  async function extractRawAudioData(blob) {
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
    
    console.log("Chunk properties:", { 
      duration: audioBuffer.duration, 
      numberOfChannels: audioBuffer.numberOfChannels, 
      sampleRate: audioBuffer.sampleRate 
    });

    const numberOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numberOfChannels;
    const rawData = new Float32Array(length);
    
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let i = 0; i < audioBuffer.length; i++) {
        rawData[i * numberOfChannels + channel] = channelData[i];
      }
    }
    
    return { rawData, sampleRate: audioBuffer.sampleRate, numberOfChannels };
  }

  async function mergeAudioChunks(chunks) {
    if (chunks.length === 0) return null;
    
    const extractedChunks = await Promise.all(chunks.map(extractRawAudioData));
    const totalLength = extractedChunks.reduce((sum, chunk) => sum + chunk.rawData.length, 0);
    const sampleRate = extractedChunks[0].sampleRate;
    const numberOfChannels = extractedChunks[0].numberOfChannels;
    
    const mergedData = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of extractedChunks) {
      mergedData.set(chunk.rawData, offset);
      offset += chunk.rawData.length;
    }
    
    const audioBuffer = audioContextRef.current.createBuffer(numberOfChannels, mergedData.length / numberOfChannels, sampleRate);
    
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let i = 0; i < audioBuffer.length; i++) {
        channelData[i] = mergedData[i * numberOfChannels + channel];
      }
    }
    
    console.log("Merged audio properties:", { 
      duration: audioBuffer.duration, 
      numberOfChannels: audioBuffer.numberOfChannels, 
      sampleRate: audioBuffer.sampleRate 
    });

    return audioBuffer;
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
    
    if (chunkSource.current === 'azure') {
      mergeAudioChunks(currentMessageAudioChunks.current).then(mergedAudioBuffer => {
        if (mergedAudioBuffer) {
          playBuffer(mergedAudioBuffer);
        } else {
          console.error("Failed to merge audio chunks");
          isPlaying.current = false;
          setIsGptSpeaking(false);
        }
        currentMessageAudioChunks.current = [];
      }).catch(error => {
        console.error("Error merging audio chunks:", error);
        isPlaying.current = false;
        setIsGptSpeaking(false);
      });
    } else {
      // ElevenLabs: Use the original method
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

  const addAudioToQueue = async (stream) => {
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
      chunkSource.current = await detectChunkSource(audioBlob);
      playNextAudioChunk();
    } else if (stream === "<cancel>") {
      stop();
    } else if (stream === "<stream_complete>") {
      streamCompleted.current = true;
      playNextAudioChunk(); // Ensure any remaining audio is played
    } else {
      streamCompleted.current = false;
      const audioBlob = base64ToBlob(stream, 'audio/mpeg');
      
      if (currentMessageAudioChunks.current.length === 0) {
        chunkSource.current = await detectChunkSource(audioBlob);
      }
      
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