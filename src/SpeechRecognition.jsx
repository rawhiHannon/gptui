import React, { useState, useEffect, useRef } from "react";
import Button from '@mui/material/Button';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/Stop';
import useSound from 'use-sound';
import boopSfx from './interface-124464.mp3';

const SpeechRecognition = ({ onSpeechText }) => {
  const [play] = useSound(boopSfx);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [hasSpeechEnded, setHasSpeechEnded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const speechRecognitionRef = useRef(null);
  const transcriptAccumulator = useRef("");

  useEffect(() => {
    // Add global mouseup event listener
    const handleGlobalMouseUp = () => {
      if (isMouseDown) {
        setIsRecording(false); // Stop recording when mouse is released
        setIsMouseDown(false);
        if (hasSpeechEnded && transcriptAccumulator.current.trim().length > 0) {
          if(handleSpeechText) {
            handleSpeechText(transcriptAccumulator.current)
          }
          transcriptAccumulator.current = "";
        }
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isMouseDown]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      speechRecognitionRef.current = new SpeechRecognition();
      speechRecognitionRef.current.continuous = false;
      speechRecognitionRef.current.lang = 'en-US';
      speechRecognitionRef.current.interimResults = false;

      speechRecognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        transcriptAccumulator.current += transcript; // Accumulate transcript
      };

      speechRecognitionRef.current.onend = () => {
        setHasSpeechEnded(true);
        if (!isMouseDown && transcriptAccumulator.current.trim().length > 0) {
          if(onSpeechText) {
            onSpeechText(transcriptAccumulator.current);
          }
          transcriptAccumulator.current = "";
        }
      };

      speechRecognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
      };
    } else {
      console.error('Speech recognition not supported in this browser.');
    }
  }, []);

  const startRecording = () => {
    play()
    setIsRecording(true);
    transcriptAccumulator.current = "";  // Clear accumulator
    setIsMouseDown(true);
    speechRecognitionRef.current.start();
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
