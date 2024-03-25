import { useState, useEffect, useRef } from "react";

const useAudioPlayer = (onGptSpeakingChange, isAudioEnabledRef, onStreamComplete) => {
  const audioQueue = useRef([]);
  const isProcessingAudio = useRef(false);
  const [isGptSpeaking, setIsGptSpeaking] = useState(false);
  const audioContextRef = useRef(null);
  const activeSources = useRef([]);
  const audioPlaybackPromiseQueue = useRef(Promise.resolve());

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
    setIsGptSpeaking(audioQueue.current.length > 0);
    if (onGptSpeakingChange) {
      onGptSpeakingChange(audioQueue.current.length > 0);
    }
  }, [audioQueue.current.length, onGptSpeakingChange]);

  const enqueueAudioChunk = (audioChunk) => {
    audioQueue.current.push(audioChunk);
    processAudioQueue();
  };

  const processAudioQueue = () => {
    if (!isProcessingAudio.current && audioQueue.current.length > 0) {
      isProcessingAudio.current = true;
      const nextAudioChunk = audioQueue.current.shift();
      playAudioChunk(nextAudioChunk).finally(() => {
        isProcessingAudio.current = false;
        if (audioQueue.current.length > 0) {
          processAudioQueue();
        } else {
          setIsGptSpeaking(false);
          onGptSpeakingChange && onGptSpeakingChange(false);
          onStreamComplete && onStreamComplete();
        }
      });
    }
  };

  const playAudioChunk = (audioChunk) => {
    return new Promise((resolve, reject) => {
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioChunk;
      source.connect(audioContextRef.current.destination);
      source.start(0);
      activeSources.current.push(source);
      source.onended = () => {
        activeSources.current = activeSources.current.filter(s => s !== source);
        resolve();
      };
    });
  };

  const stop = () => {
    while(activeSources.current.length > 0) {
      const source = activeSources.current.pop();
      source.stop();
    }
    audioQueue.current = [];
    setIsGptSpeaking(false);
    onGptSpeakingChange && onGptSpeakingChange(false);
  };

  const addAudioToQueue = (base64Audio) => {
    if (!base64Audio) return;
    const audioBlob = base64ToBlob(base64Audio, 'audio/mpeg');
    const arrayBufferPromise = blobToArrayBuffer(audioBlob);
    arrayBufferPromise.then(arrayBuffer => {
      return audioContextRef.current.decodeAudioData(arrayBuffer);
    }).then(audioBuffer => {
      enqueueAudioChunk(audioBuffer);
    }).catch(error => {
      console.error('Error processing audio', error);
    });
  };

  // Helper function to convert Blob to ArrayBuffer
  const blobToArrayBuffer = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });
  };

  // Convert Base64 string to a Blob
  const base64ToBlob = (base64, contentType) => {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type: contentType });
  };

  return {
    addAudioToQueue,
    stop
  };
};

export default useAudioPlayer;
