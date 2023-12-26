import React, { useState, useEffect, useRef } from 'react';
import useSound from 'use-sound';
import boopSfx from './interface-124464.mp3';
import voicecall from './phone-call.mp3';
import CallIcon from '@mui/icons-material/Call';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import PhoneDisabledIcon from '@mui/icons-material/PhoneDisabled';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Avatar from '@mui/material/Avatar';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import { Mic, Phone } from '@mui/icons-material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';

const AudioStreamer = ({ onAudioStream, onStreamStarted, toggleAudio, status, talkingStatus, isAudioEnabled }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [callTime, setCallTime] = useState(0);
  const callTimerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [play] = useSound(boopSfx);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isDialing, setIsDialing] = useState(false);
  const [playDialingSound] = useSound(voicecall);
  const numberOfRings = 3;
  const dialingTimeoutRef = useRef(null); // Ref to store dialing timeouts
  const [shouldShowDialog, setShouldShowDialog] = useState(false); // New state
  let callManuallyTerminated = false;

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
        if(onStreamStarted) {
            onStreamStarted()
        }
        play();
        setIsStreaming(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = handleDataAvailable;
            mediaRecorder.start(250); // Start recording and generate data every 250ms
        } catch (err) {
            console.error('Error accessing audio:', err);
            closeDialog();
        }
    };

    const stopStreaming = () => {
      if (mediaRecorderRef.current) {
          onAudioStream("CloseStream");
          setIsStreaming(false);
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

  const startDialing = () => {
    setIsDialing(true);
    callManuallyTerminated = false;
    onAudioStream("start");
    playRingSound(1);
  };

  const endDialingAndStartStreaming = () => {
    if (!callManuallyTerminated) {
      setIsDialing(false); 
      startStreaming();
    }
  };

  const playRingSound = (currentRing) => {
      if (currentRing <= numberOfRings) {
          let delay = 2500
          if(currentRing == numberOfRings) {
            delay = 1000
          }
          playDialingSound();
          dialingTimeoutRef.current = setTimeout(() => {
              playRingSound(currentRing + 1);
          }, delay); // Adjust based on sound file duration
      } else {
          endDialingAndStartStreaming();
      }
  };


const closeDialog = () => {
  callManuallyTerminated = true;
  document.getElementById('dialogContent').classList.add('dialog-fade-out');
  if (isStreaming) {
    stopStreaming();
  }
  setShouldShowDialog(false);
  setIsDialing(false);
  clearTimeout(dialingTimeoutRef.current);
};

const preventDialogClose = (event, reason) => {
  if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
      closeDialog();
  }
};

const handleIconClick = () => {
  if (status) {
      setShouldShowDialog(true); // Set to true when starting the process
      startDialing();
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
        className={`${!status || isStreaming ? 'call-button-inactive' : 'call-button'}`}
        style={{
            outline: "none", 
            borderRadius: "50%", 
            cursor: status ? 'pointer' : 'default',
        }}
    >
          {isStreaming ? <CallEndIcon style={{ color: "red", minWidth: "40px" }} /> : <CallIcon />}
      </div>

    <Dialog id="dialogContent" open={shouldShowDialog} onClose={preventDialogClose} className="call-dialog">
      <DialogContent className="call-dialog-content">
        {isDialing ? (
          <>
            <p>Calling Test...</p>
            <div onClick={closeDialog} className="end-call">
                <CallEndIcon className="icon"/>
            </div>
          </>
        ) : null}
        {isStreaming ? (
          <>
            <Avatar className="avatar" />
            <div className="contact-name">Test</div>
            <div className="call-time">{formatCallTime()}</div>
            <div className="audio-waves">
              {Array(9).fill().map((_, idx) => (
                <div key={idx} className={`wave ${talkingStatus ? 'animated' : ''}`}></div>
              ))}
            </div>
            <div className='buttons-holder'>
              <div onClick={toggleAudio} className="toggle-button">
                {isAudioEnabled ? <VolumeUpIcon className="icon" /> : <VolumeOffIcon className="icon" />}
              </div>
              <div onClick={toggleMic} className="toggle-button">
                {isMicOn ? <MicIcon className="icon" /> : <MicOffIcon className="icon" />}
              </div>
              <div onClick={closeDialog} className="end-call">
                <CallEndIcon className="icon" />
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  </div>
);
};

export default AudioStreamer;