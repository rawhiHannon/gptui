import React, { useState, useEffect, useRef } from "react";
import Button from '@mui/material/Button';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/Stop';
import useSound from 'use-sound';
import boopSfx from './interface-124464.mp3';

const SpeechRecognition = ({ onSpeechText }) => {
  const [play] = useSound(boopSfx);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const speechRecognitionRef = useRef(null);
  const transcriptAccumulator = useRef("");

  useEffect(() => {
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isMouseDown]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      speechRecognitionRef.current = new SpeechRecognition();
      speechRecognitionRef.current.continuous = true;  // Changed to true for continuous recognition
      speechRecognitionRef.current.lang = 'en-US';
      speechRecognitionRef.current.interimResults = true;  // Changed to true for real-time interim results

      speechRecognitionRef.current.onresult = (event) => {
        const interimTranscript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        transcriptAccumulator.current = interimTranscript;
        onSpeechText(interimTranscript);  // Call onSpeechText for real-time update
      };

      speechRecognitionRef.current.onend = () => {
        setIsRecording(false);
        if (transcriptAccumulator.current.trim().length > 0) {
          onSpeechText(transcriptAccumulator.current);
        }
        transcriptAccumulator.current = "";
      };

      speechRecognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
      };
    } else {
      console.error('Speech recognition not supported in this browser.');
    }
  }, []);

  const startRecording = () => {
    play();
    setIsMouseDown(true);
    if (!isRecording) {
      setIsRecording(true);
      transcriptAccumulator.current = "";  // Clear accumulator
      speechRecognitionRef.current.start();
    }
  };

  const handleGlobalMouseUp = () => {
    if (isMouseDown) {
      setIsMouseDown(false);
      if (isRecording) {
        speechRecognitionRef.current.stop();
      }
    }
  };

  return (
    <div>
      <Button 
        onMouseDown={startRecording} 
        variant="contained"
      >
        {isRecording ? <MicOffIcon style={{ color: "red", minWidth: "40px" }} /> : <MicIcon />}
      </Button>
    </div>
  );
};

export default SpeechRecognition;
