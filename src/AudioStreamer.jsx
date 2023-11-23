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

const AudioStreamer = ({ onAudioStream, status, talkingStatus }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [callTime, setCallTime] = useState(0);
  const callTimerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [play] = useSound(boopSfx);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isDialing, setIsDialing] = useState(false);
  const [playDialingSound] = useSound(voicecall);
  const numberOfRings = 1;
  const dialingTimeoutRef = useRef(null); // Ref to store dialing timeouts
  const [shouldShowDialog, setShouldShowDialog] = useState(false); // New state

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

  const startDialing = () => {
    setIsDialing(true);
    playRingSound(1); // Start the first ring
  };

  const endDialingAndStartStreaming = () => {
    setIsDialing(false); 
    setIsDialogOpen(true);
    startStreaming();
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


const preventDialogClose = (event, reason) => {
    if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
        closeDialog();
    }
};

const closeDialog = () => {
  document.getElementById('dialogContent').classList.add('dialog-fade-out');
  setTimeout(() => {
    setShouldShowDialog(false); // Immediately hide the dialog
    setIsDialogOpen(false);
    setIsDialing(false);
    clearTimeout(dialingTimeoutRef.current);
  
    if (isStreaming) {
        stopStreaming();
    }
  }, 500); // Timeout should match the animation duration
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
        className={`round-button ${!status || isStreaming ? 'round-button-inactive' : ''}`}
        style={{
            outline: "none", 
            borderRadius: "50%", 
            cursor: status ? 'pointer' : 'default',
            // backgroundColor removed
        }}
    >
          {isStreaming ? <CallEndIcon style={{ color: "red", minWidth: "40px" }} /> : <CallIcon />}
      </div>


<Dialog id="dialogContent" open={shouldShowDialog} onClose={preventDialogClose}>
    <DialogContent style={{ textAlign: 'center', padding: '20px', position: 'relative', width: "250px" }}>
        {isDialing ? 
            <>
              <p>Calling PIZZZAAA...</p>
              <div onClick={closeDialog} className="call-off-button">
                  <CallEndIcon style={{ color: "white" }} />
              </div>
            </> : <></> }
        {isStreaming ? 
            <>
            <Avatar sx={{ bgcolor: "gray" }} style={{ width: "80px", height: "80px", margin: "auto" }} />
            <p><b>PIZZZAAA</b></p>
            <p>{formatCallTime()}</p>
          <div className="audio-waves">
            <div className={`wave ${talkingStatus ? 'wave-animated' : 'wave-static'}`}></div>
            <div className={`wave ${talkingStatus ? 'wave-animated' : 'wave-static'}`}></div>
            <div className={`wave ${talkingStatus ? 'wave-animated' : 'wave-static'}`}></div>
            <div className={`wave ${talkingStatus ? 'wave-animated' : 'wave-static'}`}></div>
            <div className={`wave ${talkingStatus ? 'wave-animated' : 'wave-static'}`}></div>
            <div className={`wave ${talkingStatus ? 'wave-animated' : 'wave-static'}`}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                <div onClick={closeDialog} className="call-off-button">
                    <CallEndIcon style={{ color: "white" }} />
                </div>
                <div onClick={toggleMic} className="mic-toggle-button">
                        {isMicOn ? 
                            <MicIcon style={{ color: "white" }} /> : 
                            <MicOffIcon style={{ color: "white" }} />
                        }
                    </div>
            </div>
            </>: <></>
          }
          </DialogContent>
        </Dialog>
    </div>
    );
};

export default AudioStreamer;