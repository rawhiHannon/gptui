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
  const numberOfRings = 2;
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
        className={`${!status || isStreaming ? 'round-button-inactive' : 'round-button'}`}
        style={{
            outline: "none", 
            borderRadius: "50%", 
            cursor: status ? 'pointer' : 'default',
            // backgroundColor removed
        }}
    >
          {isStreaming ? <CallEndIcon style={{ color: "red", minWidth: "40px" }} /> : <CallIcon />}
      </div>


<Dialog id="dialogContent" open={shouldShowDialog} onClose={preventDialogClose} className="call-dialog">
    <DialogContent style={{ textAlign: 'center', padding: '20px', position: 'relative', width: "250px" }} className="call-dialog-content">
        {isDialing ? 
            <>
              <p style={{ color: "white" }}>Calling Test...</p>
              <div onClick={closeDialog} className="call-off-button">
                  <CallEndIcon style={{ color: "white" }} />
              </div>
            </> : <></> }
        {isStreaming ? 
            <>
            <Avatar sx={{ bgcolor: "gray" }} style={{ width: "80px", height: "80px", margin: "auto", borderColor: "#fff" }} />
            <div style={{color: "#fff", marginBottom: "0px", marginTop: "5px", fontSize: "25px"}}><b>Test</b></div>
            <div style={{color: "#fff", marginBottom: "25px"}}>{formatCallTime()}</div>
          <div className="audio-waves" style={{}}>
            <div className={`wave ${talkingStatus ? 'wave-animated' : 'wave-static'}`}></div>
            <div className={`wave ${talkingStatus ? 'wave-animated' : 'wave-static'}`}></div>
            <div className={`wave ${talkingStatus ? 'wave-animated' : 'wave-static'}`}></div>
            <div className={`wave ${talkingStatus ? 'wave-animated' : 'wave-static'}`}></div>
            <div className={`wave ${talkingStatus ? 'wave-animated' : 'wave-static'}`}></div>
            <div className={`wave ${talkingStatus ? 'wave-animated' : 'wave-static'}`}></div>
            <div className={`wave ${talkingStatus ? 'wave-animated' : 'wave-static'}`}></div>
            <div className={`wave ${talkingStatus ? 'wave-animated' : 'wave-static'}`}></div>
            <div className={`wave ${talkingStatus ? 'wave-animated' : 'wave-static'}`}></div>
            </div>
            
            <div className='buttons-holder' style={{ gap: '15px' }}>
                <div onClick={closeDialog} className="toggle-button-raw">
                    {isAudioEnabled ? (
                      <VolumeUpIcon style={{ color: "white", width: "25px", height: "25px" }} onClick={toggleAudio} />
                    ) : (
                      <VolumeOffIcon style={{ color: "white", width: "25px", height: "25px" }} onClick={toggleAudio} />
                    )}
                </div>
                <div onClick={toggleMic} className="toggle-button-raw">
                        {isMicOn ? 
                            <MicIcon style={{ color: "white", width: "25px", height: "25px" }} /> : 
                            <MicOffIcon style={{ color: "white", width: "25px", height: "25px" }} />
                        }
                </div>
                <div onClick={closeDialog} className="call-off-button" style={{ width: "30px", height: "30px" }}>
                    <CallEndIcon style={{ color: "white", fontSize: "20px" }} />
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