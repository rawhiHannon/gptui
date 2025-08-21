import { useState, useEffect, useRef } from "react";

const useAudioPlayer = (onGptSpeakingChange, isAudioEnabledRef, onStreamComplete) => {
  const currentMessageAudioChunks = useRef([]);
  const streamCompleted = useRef(false);
  const [isGptSpeaking, setIsGptSpeaking] = useState(false);
  const audioContextRef = useRef(null);
  const isPlaying = useRef(false);
  const isPaused = useRef(false);
  const activeSources = useRef([]);
  const isFullAudioChunk = useRef(false);  // Track if current chunk is complete audio

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
    if (onGptSpeakingChange) {
      onGptSpeakingChange(isGptSpeaking);
    }
  }, [isGptSpeaking, onGptSpeakingChange]);

  const pauseAudio = () => {
    isPaused.current = true;
    activeSources.current.forEach(source => source.stop());
    activeSources.current = [];
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

  async function mergeAudioChunks(chunks) {
    if (chunks.length === 0) return null;

    // For full audio chunks, process them directly
    if (isFullAudioChunk.current && chunks.length === 1) {
      try {
        const arrayBuffer = await chunks[0].arrayBuffer();
        // Decode the audio data directly - this handles various formats properly
        return await audioContextRef.current.decodeAudioData(arrayBuffer);
      } catch (error) {
        console.error("Error decoding full audio chunk:", error);
        // Fall back to PCM processing if decoding fails
        isFullAudioChunk.current = false;
      }
    }

    // For partial chunks or fallback, use PCM processing
    let totalLength = 0;
    const pcmDataArrays = [];
    
    for (const blob of chunks) {
      try {
        const arrayBuffer = await blob.arrayBuffer();
        if (arrayBuffer.byteLength % 2 !== 0) {
          console.error("ArrayBuffer byte length is not a multiple of 2:", arrayBuffer.byteLength);
          continue;
        }
        const pcmData = new Int16Array(arrayBuffer);
        pcmDataArrays.push(pcmData);
        totalLength += pcmData.length;
      } catch (error) {
        console.error("Error processing audio chunk:", error);
      }
    }

    if (totalLength === 0) return null;

    const sampleRate = 24000;
    const numberOfChannels = 1;
    const mergedPcmData = new Int16Array(totalLength);
    let offset = 0;
    
    for (const pcmData of pcmDataArrays) {
      mergedPcmData.set(pcmData, offset);
      offset += pcmData.length;
    }

    const frameCount = mergedPcmData.length / numberOfChannels;
    const audioBuffer = audioContextRef.current.createBuffer(numberOfChannels, frameCount, sampleRate);

    // Apply a very gentle fade-in to reduce clicks (5ms)
    const float32Data = new Float32Array(mergedPcmData.length);
    for (let i = 0; i < mergedPcmData.length; i++) {
      // Convert from Int16 to Float32 (-1.0 to 1.0)
      let sample = mergedPcmData[i] / 32768;
      
      // Apply fade-in to the first few samples (helps reduce clicks)
      const fadeInSamples = Math.min(120, mergedPcmData.length / 10); // 5ms at 24kHz
      if (i < fadeInSamples) {
        sample *= (i / fadeInSamples);
      }
      
      float32Data[i] = sample;
    }

    audioBuffer.copyToChannel(float32Data, 0);
    return audioBuffer;
  }

  function startAudioPlayback() {
    if (currentMessageAudioChunks.current.length === 0) {
      setIsGptSpeaking(false);
      isPlaying.current = false;
      if (streamCompleted.current && onStreamComplete) {
        onStreamComplete();
      }
      return;
    }

    setIsGptSpeaking(true);
    isPlaying.current = true;

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
  }

  function playBuffer(audioBuffer) {
    const source = audioContextRef.current.createBufferSource();
    
    audioContextRef.current.resume().then(() => {
      source.buffer = audioBuffer;
      
      // Create a gain node for smoother playback
      const gainNode = audioContextRef.current.createGain();
      
      // Connect source -> gain -> destination
      source.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      // Apply a slight fade-in to reduce clicks
      gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
      gainNode.gain.linearRampToValueAtTime(1, audioContextRef.current.currentTime + 0.015); // 15ms fade-in
      
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
    streamCompleted.current = false;
    setIsGptSpeaking(false);
    if (onGptSpeakingChange) {
      onGptSpeakingChange(false);
    }
  };

  const base64ToBlob = (base64, contentType = 'audio/pcm') => {
    try {
      // Detect if this has a specific format marker
      if (base64.includes('<complete>')) {
        // This is a full audio chunk
        isFullAudioChunk.current = true;
        base64 = base64.replace('<complete>', '');
        contentType = 'audio/mpeg'; // Assume MP3 for complete chunks
      } else {
        // This is a partial chunk
        isFullAudioChunk.current = false;
      }
      
      const byteCharacters = atob(base64);
      const byteArrays = [];
      for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
        const slice = byteCharacters.slice(offset, offset + 1024);
        const byteNumbers = new Uint8Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        byteArrays.push(byteNumbers);
      }
      return new Blob(byteArrays, { type: contentType });
    } catch (e) {
      console.error("Error converting base64 to Blob:", e);
      return new Blob([], { type: contentType });
    }
  };

  const addAudioToQueue = async (stream) => {
    if (!isAudioEnabledRef.current) {
      return;
    }

    if (stream === "<cancel>") {
      stop();
    } else if (stream === "<stream_complete>") {
      streamCompleted.current = true;
      playNextAudioChunk();
    } else {
      streamCompleted.current = false;
      const audioBlob = base64ToBlob(stream);
      currentMessageAudioChunks.current.push(audioBlob);
      
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