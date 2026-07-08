import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import useSound from 'use-sound';
import boopSfx from './interface-124464.mp3';
import voicecall from './phone-call.mp3';

/**
 * Headless audio engine — no UI at all.
 * Exposes state + controls via ref so the parent renders all buttons.
 *
 * Captures raw PCM16 at 16 kHz using AudioContext + ScriptProcessorNode.
 * This produces continuous samples with no WAV headers and no inter-chunk
 * discontinuities (unlike RecordRTC's timeSlice which wraps each chunk
 * in a separate WAV file, causing clicks at chunk boundaries).
 */
const AudioEngine = forwardRef(({ onAudioStream, onStreamStarted, onStatusChange }, ref) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDialing, setIsDialing] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [callTime, setCallTime] = useState(0);

  const callTimerRef = useRef(null);
  const captureCtxRef = useRef(null);   // AudioContext for mic capture at 16 kHz
  const processorRef = useRef(null);    // ScriptProcessorNode
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

      // Capture raw PCM16 at 16 kHz using AudioContext + ScriptProcessorNode.
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx({ sampleRate: 16000 });
      captureCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1); // 4096 samples @ 16kHz ≈ 256ms
      processorRef.current = processor;

      // Route through a zero-gain node so onaudioprocess fires (Chrome
      // requires connection to destination) but no audio leaks to speakers.
      const silentGain = ctx.createGain();
      silentGain.gain.value = 0;
      source.connect(processor);
      processor.connect(silentGain);
      silentGain.connect(ctx.destination);

      processor.onaudioprocess = (e) => {
        const float32 = e.inputBuffer.getChannelData(0);
        const int16 = new Int16Array(float32.length);
        for (let i = 0; i < float32.length; i++) {
          const s = Math.max(-1, Math.min(1, float32[i]));
          int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        handleDataAvailable(new Blob([int16.buffer]));
      };
    } catch (err) {
      console.error("Error accessing audio:", err);
      endCall();
    }
  };

  const cleanupAudio = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (captureCtxRef.current) {
      captureCtxRef.current.close().catch(() => {});
      captureCtxRef.current = null;
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
