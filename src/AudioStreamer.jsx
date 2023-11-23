import React, { useState, useEffect, useRef } from 'react';
import useSound from 'use-sound';
import boopSfx from './interface-124464.mp3';
import PhoneEnabledIcon from '@mui/icons-material/PhoneEnabled';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import PhoneDisabledIcon from '@mui/icons-material/PhoneDisabled';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Avatar from '@mui/material/Avatar';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';

const AudioStreamer = ({ onAudioStream, status, talkingStatus }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [callTime, setCallTime] = useState(0);
  const callTimerRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const [play] = useSound(boopSfx);
    const [isMicOn, setIsMicOn] = useState(true); // New state for managing microphone status

    useEffect(() => {
      if (isStreaming) {
          startCallTimer();
      } else {
          stopCallTimer();
      }
    }, [isStreaming]);

    const startCallTimer = () => {
      setCallTime(0);
      stopCallTimer(); // Ensure any existing timer is stopped before starting a new one
      callTimerRef.current = setInterval(() => {
          setCallTime(prevTime => prevTime + 1);
      }, 1000);
    };

    const stopCallTimer = () => {
        if (callTimerRef.current) {
            clearInterval(callTimerRef.current);
            callTimerRef.current = null;
        }
    };

    const formatCallTime = () => {
      const minutes = Math.floor(callTime / 60);
      const seconds = callTime % 60;
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleDataAvailable = (event) => {
        if (event.data.size > 0) {
            const reader = new FileReader();
            reader.readAsDataURL(event.data);
            reader.onloadend = () => {
                const base64AudioMessage = reader.result.split(',')[1];
                onAudioStream(base64AudioMessage);
            };
        }
    };

    const startStreaming = async () => {
        play();
        onAudioStream("start");
        setIsStreaming(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = handleDataAvailable;
            mediaRecorder.start(250); // Start recording and generate data every 250ms
        } catch (err) {
            console.error('Error accessing audio:', err);
            setIsStreaming(false);
        }
    };

    const stopStreaming = () => {
      if (mediaRecorderRef.current) {
          mediaRecorderRef.current.onstop = () => {
              onAudioStream("CloseStream"); // Indicate to close the stream
              setIsStreaming(false);
          };
          mediaRecorderRef.current.stop();
      }
  };
  

  useEffect(() => {
      return () => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
              mediaRecorderRef.current.stop();
          }
      };
  }, []);

  const handleIconClick = () => {
    if (status) {
        setIsDialogOpen(true);
        isStreaming ? stopStreaming() : startStreaming();
    }
};

const preventDialogClose = (event, reason) => {
    if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
        closeDialog();
    }
};

const closeDialog = () => {
  setIsDialogOpen(false);
  if (isStreaming) {
      stopStreaming();
  }
};

const toggleMic = () => {
  setIsMicOn(!isMicOn);
  // Additional logic to actually enable/disable the mic can be added here
};

return (
  <div>
      <div 
          onClick={handleIconClick}
          className="round-button"
          style={{
              outline: "none", 
              radius: "50%", 
              cursor: status ? 'pointer' : 'default',
              backgroundColor: !status || isStreaming ? '#d3d3d3' : '#3f6eb5' // Gray when inactive
          }}
      >
          {isStreaming ? <PhoneDisabledIcon style={{ color: "red", minWidth: "40px" }} /> : <PhoneEnabledIcon />}
      </div>


<Dialog open={isDialogOpen} onClose={preventDialogClose}>
      <DialogContent style={{ textAlign: 'center', padding: '20px', position: 'relative', width: "250px" }}>
          <Avatar sx={{ bgcolor: "gray" }} style={{ width: "80px", height: "80px", margin: "auto" }} />
          <p><b>PIZZZAAA</b></p>
          <p>{formatCallTime()}</p>
          <div className="audio-waves">
            <div className={`wave ${talkingStatus ? 'wave-animated' : 'wave-static'}`}></div>
            <div className={`wave ${talkingStatus ? 'wave-animated' : 'wave-static'}`}></div>
            <div className={`wave ${talkingStatus ? 'wave-animated' : 'wave-static'}`}></div>
            <div className={`wave ${talkingStatus ? 'wave-animated' : 'wave-static'}`}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                <div className="call-off-button">
                    <PowerSettingsNewIcon onClick={closeDialog} style={{ color: "white" }} />
                </div>
                <div className="mic-toggle-button">
                        {isMicOn ? 
                            <MicOffIcon style={{ color: "white" }} onClick={toggleMic} /> : 
                            <MicIcon style={{ color: "white" }} onClick={toggleMic} />
                        }
                    </div>
            </div>
        </DialogContent>
    </Dialog>
    </div>
    );
};

export default AudioStreamer;