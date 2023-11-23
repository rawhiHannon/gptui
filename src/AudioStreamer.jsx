import React, { useState, useEffect, useRef } from 'react';
import useSound from 'use-sound';
import boopSfx from './interface-124464.mp3';
import PhoneEnabledIcon from '@mui/icons-material/PhoneEnabled';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Avatar from '@mui/material/Avatar';

const AudioStreamer = ({ onAudioStream, status, talkingStatus }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [callTime, setCallTime] = useState(0);
  const callTimerRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const [play] = useSound(boopSfx);

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

return (
  <div>
      <div 
          onClick={handleIconClick}
          className={isStreaming ? "round-button-active" : "round-button"}
          style={{
              outline: "none", 
              borderRadius: "50%", 
              cursor: status ? 'pointer' : 'default',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
          }}
      >
          {isStreaming ? 
            <PowerSettingsNewIcon style={{ color: "red" }} /> : 
            <PhoneEnabledIcon style={{ color: "white" }} />
          }
      </div>

      <Dialog open={isDialogOpen} onClose={preventDialogClose} maxWidth="sm" fullWidth>
        <DialogContent style={{ textAlign: 'center', padding: '40px', position: 'relative' }}>
          <Avatar sx={{ bgcolor: "gray" }} style={{ width: "40px", height: "40px", marginRight: "10px" }} />
          <h2>Ongoing Call with PIZZZAAA</h2>
          <p>{formatCallTime()}</p>
          <div className="audio-waves">
            <div className={`wave ${talkingStatus ? 'wave-animated' : 'wave-static'}`}></div>
            <div className={`wave ${talkingStatus ? 'wave-animated' : 'wave-static'}`}></div>
            <div className={`wave ${talkingStatus ? 'wave-animated' : 'wave-static'}`}></div>
            <div className={`wave ${talkingStatus ? 'wave-animated' : 'wave-static'}`}></div>
         </div>
          <div className="call-off-button">
              <PowerSettingsNewIcon onClick={closeDialog} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
    );
};

export default AudioStreamer;