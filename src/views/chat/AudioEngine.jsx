import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import useSound from 'use-sound';
import boopSfx from './interface-124464.mp3';
import voicecall from './phone-call.mp3';
import RecordRTC, { StereoAudioRecorder } from 'recordrtc';

/**
 * Headless audio engine — no UI at all.
 * Exposes state + controls via ref so the parent renders all buttons.
 */
const AudioEngine = forwardRef(({ onAudioStream, onStreamStarted, onStatusChange }, ref) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDialing, setIsDialing] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [callTime, setCallTime] = useState(0);

  const callTimerRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const dataChunksRef = useRef(0);
  const callManuallyTerminatedRef = useRef(false);
  const dialingTimeoutRef = useRef(null);

  const [play] = useSound(boopSfx);
  const [playDialingSound, { stop: stopDialingSound }] = useSound(voicecall);
  const numberOfRings = 2;

  // Notify parent of status changes
  useEffect(() => {
    if (onStatusChange) {
      onStatusChange({ isStreaming, isDialing, isMicOn, callTime });
    }
  }, [isStreaming, isDialing, isMicOn, callTime]);

  // Timer
  useEffect(() => {
    if (isStreaming) {
      setCallTime(0);
      callTimerRef.current = setInterval(() => {
        setCallTime(t => t + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    }
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    };
  }, [isStreaming]);

  const handleDataAvailable = (blob) => {
    if (blob && blob.size > 0) {
      dataChunksRef.current++;
      onAudioStream(blob);
    }
  };

  const startStreaming = async () => {
    if (onStreamStarted) onStreamStarted();
    play();
    setIsStreaming(true);
    dataChunksRef.current = 0;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      recorderRef.current = new RecordRTC(stream, {
        type: 'audio',
        recorderType: StereoAudioRecorder,
        mimeType: 'audio/wav',
        numberOfAudioChannels: 1,
        desiredSampRate: 16000,
        timeSlice: 200,
        ondataavailable: handleDataAvailable
      });

      recorderRef.current.startRecording();
    } catch (err) {
      console.error("Error accessing audio:", err);
      endCall();
    }
  };

  const cleanupAudio = () => {
    if (recorderRef.current) {
      try { recorderRef.current.stopRecording(() => {}); } catch (e) {}
      recorderRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => { try { track.stop(); } catch (e) {} });
      streamRef.current = null;
    }
  };

  const playRingSound = (currentRing) => {
    if (currentRing <= numberOfRings) {
      const delay = currentRing === numberOfRings ? 1000 : 2500;
      playDialingSound();
      dialingTimeoutRef.current = setTimeout(() => playRingSound(currentRing + 1), delay);
    } else {
      if (!callManuallyTerminatedRef.current) {
        setIsDialing(false);
        startStreaming();
      }
    }
  };

  const startCall = () => {
    callManuallyTerminatedRef.current = false;
    setIsDialing(true);
    setCallTime(0);
    setIsMicOn(true);
    onAudioStream("<start_stream>");
    playRingSound(1);
  };

  const endCall = () => {
    callManuallyTerminatedRef.current = true;
    stopDialingSound();
    onAudioStream("<close_stream>");
    if (isStreaming) {
      setIsStreaming(false);
      cleanupAudio();
    }
    setIsDialing(false);
    setCallTime(0);
    clearTimeout(dialingTimeoutRef.current);
  };

  const toggleMic = () => {
    const newState = !isMicOn;
    setIsMicOn(newState);
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = newState;
      });
    }
  };

  useImperativeHandle(ref, () => ({
    startCall,
    endCall,
    toggleMic,
    getState: () => ({ isStreaming, isDialing, isMicOn, callTime }),
  }));

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      clearTimeout(dialingTimeoutRef.current);
    };
  }, []);

  return null; // No UI
});

export default AudioEngine;
