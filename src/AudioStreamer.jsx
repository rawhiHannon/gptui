import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
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

const AudioStreamer = forwardRef(({
  onAudioStream, 
  onStreamStarted, 
  toggleAudio, 
  status, 
  talkingStatus, 
  isAudioEnabled
}, ref) => {
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [callTime, setCallTime] = useState(0);
  const callTimerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [play] = useSound(boopSfx);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isDialing, setIsDialing] = useState(false);
  const [playDialingSound, { stop: stopDialingSound }] = useSound(voicecall);
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
          setIsStreaming(false);
          mediaRecorderRef.current.stop();
          try {
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
          } catch(e) {}
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
    onAudioStream("<start>");
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
    try {
      document.getElementById('dialogContent').classList.add('dialog-fade-out');
    } catch(e) {
    }
    
    callManuallyTerminated = true;
    stopDialingSound()
    onAudioStream("<close_stream>");
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

useImperativeHandle(ref, () => ({
  closeDialog,
}));


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
              <div id="main">
                <div id="myCircle" className={talkingStatus ? 'animate' : ''}>
                  <div id="mainCircle">
                    <div className={`circle ${talkingStatus ? 'animate' : ''}`}></div>
                    <div className={`circle1 ${talkingStatus ? 'animate' : ''}`}></div>
                    <div id="mainContent">
                      <h2 id="mainText">Talking</h2>
                      <ul className={`bars ${talkingStatus ? '' : 'inactive'}`}>
                        <li className={`${talkingStatus ? 'animate' : ''}`}></li>
                        <li className={`${talkingStatus ? 'animate' : ''}`}></li>
                        <li className={`${talkingStatus ? 'animate' : ''}`}></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <br></br>
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
});

export default AudioStreamer;