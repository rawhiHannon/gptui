import React, { useState, useEffect, useRef } from 'react';
import Button from '@mui/material/Button';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/Stop';
import useSound from 'use-sound';
import boopSfx from './interface-124464.mp3';

const AudioRecorder = ({ onRecordingComplete, status }) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [play] = useSound(boopSfx);
  const [isMouseDown, setIsMouseDown] = useState(false);

  useEffect(() => {
    // Add global mouseup event listener
    const handleGlobalMouseUp = () => {
      if (isMouseDown) {
        setIsRecording(false); // Stop recording when mouse is released
        setIsMouseDown(false);
        if (hasSpeechEnded && transcriptAccumulator.current.trim().length > 0) {
          sendTextMessage(transcriptAccumulator.current);
          transcriptAccumulator.current = "";
        }
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isMouseDown]);

  const startRecording = async () => {
    setIsMouseDown(true);
    play();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' }); // Ensure the blob type is compatible with your backend and Whisper
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64AudioMessage = reader.result.split(',')[1];
          if (onRecordingComplete) {
            onRecordingComplete(base64AudioMessage, audioBlob);
          }
        };
        setIsRecording(false);
      };

      mediaRecorder.start(50); // Start recording and generate data every 250ms
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing audio:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  return (
    <div>
      <Button 
        onMouseDown={startRecording} 
        onMouseUp={stopRecording}
        variant="contained"
        style={{
          outline: "none",
        }}
      >
        {isRecording ? <MicOffIcon style={{ color: "red", minWidth: "40px" }} /> : <MicIcon />}
      </Button>
    </div>
  );
};

export default AudioRecorder;
