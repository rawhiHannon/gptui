import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import useSound from 'use-sound';
import boopSfx from './interface-124464.mp3';
import voicecall from './phone-call.mp3';
import HeadsetIcon from '@mui/icons-material/LocalPhone';
import CallEndIcon from '@mui/icons-material/CallEnd';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import TimelineIcon from '@mui/icons-material/Timeline';
import './AudioStreamer.css';
import RecordRTC, { StereoAudioRecorder } from 'recordrtc';

const AudioStreamer = forwardRef(({
  onAudioStream,
  onStreamStarted,
  toggleAudio,
  status,
  talkingStatus,
  isAudioEnabled,
  initialState,
  fsmStates,
  inline
}, ref) => {
  
  // Component state
  const [isStreaming, setIsStreaming] = useState(false);
  const [callTime, setCallTime] = useState(0);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isDialing, setIsDialing] = useState(false);
  const [shouldShowDialog, setShouldShowDialog] = useState(false);
  const [currentState, setCurrentState] = useState(null);
  const [currentStateKey, setCurrentStateKey] = useState(null);
  const [stateHistory, setStateHistory] = useState([]);
  const [params, setParams] = useState([]);
  const [stateDescription, setStateDescription] = useState('');
  const [progressStates, setProgressStates] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const [currentScrollPosition, setCurrentScrollPosition] = useState(0);

  // Refs
  const callTimerRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const dataChunksRef = useRef(0);
  const stepperRef = useRef(null);
  const [play] = useSound(boopSfx);
  const [playDialingSound, { stop: stopDialingSound }] = useSound(voicecall);
  const numberOfRings = 2;
  const dialingTimeoutRef = useRef(null);
  let callManuallyTerminated = false;

  // Helper function to safely get string value
  const safeStringValue = (value) => {
    if (value === null || value === undefined) return '';
    return String(value);
  };

  // Create compact progress flow
  const createProgressFlow = (fsmStates) => {
    if (!fsmStates || Object.keys(fsmStates).length === 0) return [];
    
    // Define typical conversation flow order for progress
    const flowOrder = [
      'Greeting',
      'QualifyingQuestions', 
      'MeetingProposal',
      'HandleObjections',
      'ScheduleMeeting',
      'ConfirmMeeting',
      'SuccessfulEnd',
      'EndWithFollowUp'
    ];
    
    const progress = [];
    const processedStates = new Set();
    
    // Add states in logical order
    flowOrder.forEach(stateName => {
      const stateKey = Object.keys(fsmStates).find(key => 
        fsmStates[key].name === stateName
      );
      
      if (stateKey && !processedStates.has(stateKey)) {
        const state = fsmStates[stateKey];
        progress.push({
          key: stateKey,
          name: state.name || stateKey,
          displayName: getStateDisplayName(state.name || stateKey),
          description: state.description || '',
          type: state.type || 'conversation',
          isEndState: state.type === 'end',
          paramsToCollect: state.params_to_collect || []
        });
        processedStates.add(stateKey);
      }
    });
    
    console.log('Created progress flow:', progress.map(s => s.displayName));
    return progress;
  };

  // Initialize progress when states change
  useEffect(() => {
    if (fsmStates && Object.keys(fsmStates).length > 0) {
      console.log('Creating progress flow from states:', Object.keys(fsmStates));
      const progress = createProgressFlow(fsmStates);
      setProgressStates(progress);
    } else {
      console.log('No FSM states available');
      setProgressStates([]);
    }
  }, [fsmStates]);

  // Create path trail from actual history (no future states)
  const getPathTrail = () => {
    // Return actual states visited in order, including current
    const trail = [...stateHistory];
    
    // Add current state if not already in history
    if (currentStateKey && !stateHistory.some(h => h.stateKey === currentStateKey)) {
      trail.push({
        stateName: currentState,
        stateKey: currentStateKey,
        timestamp: new Date()
      });
    }
    
    return trail;
  };

  const getCurrentProgress = () => {
    const trail = getPathTrail();
    return {
      current: trail.length,
      total: trail.length // Only show actual progress, no future
    };
  };

// Auto-scroll to current state when path changes
useEffect(() => {
  const trail = getPathTrail();
  if (trail.length > 0 && stepperRef.current) {
    // Always scroll to the end to show the latest state
    const container = stepperRef.current;
    
    // Small delay to ensure DOM is updated
    setTimeout(() => {
      const maxScroll = container.scrollWidth - container.offsetWidth;
      
      // Always scroll to the very end
      container.scrollTo({
        left: maxScroll,
        behavior: 'smooth'
      });
      setCurrentScrollPosition(maxScroll);
    }, 50);
  }
}, [stateHistory, currentStateKey]);


  useEffect(() => {
    if (shouldShowDialog) {
      console.log('Dialog opened, initializing...');
      setCurrentState(null);
      setCurrentStateKey(null);
      setStateHistory([]);
      setParams([]);
      setStateDescription('');
      setShowDetails(false);
      setCurrentScrollPosition(0);
    }
  }, [shouldShowDialog]);

  useEffect(() => {
    if (isStreaming) {
      startCallTimer();
    } else {
      stopCallTimer();
    }
    
    return () => {
      stopCallTimer();
      cleanupAudio();
    };
  }, [isStreaming]);

  const startCallTimer = () => {
    setCallTime(0);
    stopCallTimer();
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

  const handleDataAvailable = (blob) => {
    if (blob && blob.size > 0) {
      dataChunksRef.current++;
      if (dataChunksRef.current % 10 === 0) {
        console.log(`Sending audio chunk ${dataChunksRef.current}: ${blob.size} bytes`);
      }
      onAudioStream(blob);
    }
  };

  const startStreaming = async () => {
    if (onStreamStarted) {
      onStreamStarted();
    }
    
    play();
    setIsStreaming(true);
    dataChunksRef.current = 0;
    
    try {
      console.log("Getting microphone access");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioTracks = stream.getAudioTracks();
      console.log('Using audio device:', audioTracks[0].label);
      console.log('Audio track settings:', audioTracks[0].getSettings());
      
      console.log("Initializing RecordRTC");
      recorderRef.current = new RecordRTC(stream, {
        type: 'audio',
        recorderType: StereoAudioRecorder,
        mimeType: 'audio/wav',
        numberOfAudioChannels: 1,
        desiredSampRate: 16000,
        timeSlice: 200,
        ondataavailable: handleDataAvailable
      });
      
      recorderRef.current.startRecording();
      console.log("RecordRTC started");
      
    } catch (err) {
      console.error("Error accessing audio:", err);
      closeDialog();
    }
  };

  const stopStreaming = () => {
    setIsStreaming(false);
    cleanupAudio();
  };

  const cleanupAudio = () => {
    console.log("Cleaning up audio resources");
    
    if (recorderRef.current) {
      try {
        recorderRef.current.stopRecording(() => {
          console.log("RecordRTC stopped");
        });
      } catch (e) {
        console.error('Error stopping RecordRTC:', e);
      }
      recorderRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.error('Error stopping track:', e);
        }
      });
      streamRef.current = null;
    }
    
    console.log(`Audio cleanup complete. Total chunks sent: ${dataChunksRef.current}`);
  };

  const startDialing = () => {
    setIsDialing(true);
    callManuallyTerminated = false;
    console.log('Sending start_stream signal');
    onAudioStream("<start_stream>");
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
      let delay = 2500;
      if(currentRing === numberOfRings) {
        delay = 1000;
      }
      playDialingSound();
      dialingTimeoutRef.current = setTimeout(() => {
        playRingSound(currentRing + 1);
      }, delay); 
    } else {
      endDialingAndStartStreaming();
    }
  };

  const resetState = () => {
    setCurrentState(null);
    setCurrentStateKey(null);
    setStateHistory([]);
    setParams([]);
    setStateDescription('');
    setCallTime(0);
    setShowDetails(false);
  };

  const closeDialog = () => {
    callManuallyTerminated = true;
    stopDialingSound();
    console.log('Sending CloseStream signal');
    onAudioStream("<close_stream>");
    if (isStreaming) {
      stopStreaming();
    }
    setShouldShowDialog(false);
    setIsDialing(false);
    clearTimeout(dialingTimeoutRef.current);
    resetState();
  };

  const handleIconClick = () => {
    if (status) {
      setShouldShowDialog(true);
      resetState();
      startDialing();
    }
  };

  const preventDialogClose = (event, reason) => {
    if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
      closeDialog();
    }
  };

  const toggleMic = () => {
    setIsMicOn(!isMicOn);
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isMicOn;
        console.log(`Microphone ${!isMicOn ? 'enabled' : 'muted'}`);
      });
    }
  };

  useImperativeHandle(ref, () => ({
    closeDialog,
    updateStateInfo: (message) => {
      console.log('Received state update:', message);
      
      if (message.current_state_details?.name && message.current_state) {
        const newStateName = message.current_state_details.name;
        const newStateKey = message.current_state;
        
        console.log('State transition:', { 
          from: currentState, 
          to: newStateName, 
          fromKey: currentStateKey, 
          toKey: newStateKey 
        });
        
        setCurrentState(newStateName);
        setCurrentStateKey(newStateKey);
        setStateDescription(message.current_state_details.description || '');
        
        // Only add to history if this is actually a new state change
        if (newStateKey !== currentStateKey) {
          setStateHistory(prev => {
            // Always append to history when state actually changes
            return [...prev, {
              stateName: newStateName,
              stateKey: newStateKey,
              timestamp: new Date()
            }];
          });
        }
        
        const newParamsToCollect = message.current_state_details.params_to_collect || [];
        setParams(prevParams => {
          const updatedParams = [...prevParams];
          
          newParamsToCollect.forEach(newParam => {
            const existingParamIndex = updatedParams.findIndex(p => p.name === newParam.name);
            if (existingParamIndex === -1) {
              updatedParams.push({ 
                name: newParam.name, 
                value: '',
                required: newParam.required || false,
                description: newParam.description || '',
                type: newParam.type || 'string'
              });
            }
          });
          
          return updatedParams;
        });
      }
      
      if (message.collected_params) {
        console.log('Updating collected params:', message.collected_params);
        setParams(prevParams => {
          return prevParams.map(param => {
            if (message.collected_params.hasOwnProperty(param.name)) {
              const newValue = message.collected_params[param.name];
              return { 
                ...param, 
                value: safeStringValue(newValue)
              };
            }
            return param;
          });
        });
      }
    }
  }));

  const getStateDisplayName = (stateName) => {
    const stateMap = {
      'Greeting': 'Greeting',
      'QualifyingQuestions': 'Qualifying',
      'MeetingProposal': 'Proposing',
      'ScheduleMeeting': 'Scheduling',
      'HandleObjections': 'Objections',
      'ConfirmMeeting': 'Confirming',
      'SuccessfulEnd': 'Success',
      'EndWithFollowUp': 'Follow-up',
      'handleObjection': 'Objection'
    };
    return stateMap[stateName] || stateName;
  };


  const getStepStatus = (stepIndex) => {
    if (!currentStateKey) return 'pending';
    
    const currentIndex = progressStates.findIndex(state => state.key === currentStateKey);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  const renderProgressHeader = () => {
    const progress = getCurrentProgress();
    const progressPercentage = Math.min(100, (progress.current / Math.max(1, progress.current)) * 100);
    
    return (
      <div className="progress-header">
        <div className="progress-info">
          <div className="current-state-display">
            <FiberManualRecordIcon className="current-indicator" />
            <span className="state-name">{currentState || 'Starting...'}</span>
          </div>
          <div className="progress-counter">
            Step {progress.current}
          </div>
        </div>
        
        <div className="progress-bar-container">
          <div className="progress-bar-track">
            <div 
              className="progress-bar-fill" 
              style={{width: `${progressPercentage}%`}}
            />
          </div>
        </div>
        
        <div className="progress-description">
          {stateDescription || 'Conversation in progress...'}
        </div>
      </div>
    );
  };

  const scrollStepper = (direction) => {
    if (!stepperRef.current) return;
    
    const container = stepperRef.current;
    const stepWidth = 120;
    const scrollAmount = stepWidth * 2; // Scroll 2 steps at a time for better UX
    const currentScroll = container.scrollLeft;
    
    let targetScroll;
    if (direction === 'left') {
      targetScroll = Math.max(0, currentScroll - scrollAmount);
    } else {
      const maxScroll = container.scrollWidth - container.offsetWidth;
      targetScroll = Math.min(maxScroll, currentScroll + scrollAmount);
    }
    
    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
    setCurrentScrollPosition(targetScroll);
  };

  const canScrollLeft = () => {
    return stepperRef.current && stepperRef.current.scrollLeft > 10; // Small buffer
  };

  const canScrollRight = () => {
    if (!stepperRef.current) return false;
    const container = stepperRef.current;
    return container.scrollLeft < (container.scrollWidth - container.offsetWidth - 10);
  };

  const renderProgressStepper = () => {
    const trail = getPathTrail();
    
    if (trail.length === 0) return null;
    
    const isSingleState = trail.length === 1;
    
    return (
      <div className="stepper-container">
        {!isSingleState && canScrollLeft() && (
          <button className="stepper-nav left" onClick={() => scrollStepper('left')}>
            ❮
          </button>
        )}
        
        <div 
          className={`progress-stepper ${isSingleState ? 'single-state' : 'multiple-states'}`}
          ref={stepperRef}
          onScroll={(e) => setCurrentScrollPosition(e.target.scrollLeft)}
        >
          {trail.map((step, index) => {
            const isLast = index === trail.length - 1;
            const isCurrent = step.stateKey === currentStateKey;
            
            return (
              <div key={`${step.stateKey}-${step.timestamp.getTime()}`} className="step-container">
                <div className={`step ${isCurrent ? 'current' : 'completed'} ${isSingleState ? 'single' : ''}`}>
                  <div className="step-indicator">
                    {isCurrent ? (
                      <FiberManualRecordIcon className="step-icon" />
                    ) : (
                      <CheckCircleIcon className="step-icon" />
                    )}
                  </div>
                  <div className="step-label">{step.stateName}</div>
                  {isCurrent && !isSingleState && (
                    <div className="current-pulse"></div>
                  )}
                </div>
                {!isLast && <div className="step-connector completed" />}
              </div>
            );
          })}
        </div>
        
        {!isSingleState && canScrollRight() && (
          <button className="stepper-nav right" onClick={() => scrollStepper('right')}>
            ❯
          </button>
        )}
      </div>
    );
  };

  const renderParameters = () => {
    if (params.length === 0) return null;

    const collectedCount = params.filter(p => {
      const value = safeStringValue(p.value);
      return value.trim() !== '';
    }).length;

    return (
      <div className="params-section">
        <div className="params-summary">
          <span className="params-title">Information</span>
          <span className="params-count">{collectedCount}/{params.length}</span>
        </div>
        
        <div className="params-grid">
          {params.map((param, index) => {
            const value = safeStringValue(param.value);
            const hasValue = value.trim() !== '';
            
            return (
              <div key={index} className={`param-chip ${hasValue ? 'collected' : 'pending'}`}>
                <div className="param-icon">
                  {hasValue ? 
                    <CheckCircleIcon className="check-icon" /> : 
                    <RadioButtonUncheckedIcon className="pending-icon" />
                  }
                </div>
                <div className="param-info">
                  <span className="param-name">{param.name.replace(/_/g, ' ')}: </span>
                  <span className="param-value">{hasValue ? value : '...'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderControls = () => (
    <div className="call-controls">
      <div className="status-row">
        <div className={`status-badge ${talkingStatus ? 'speaking' : 'listening'}`}>
          <div className="status-dot"></div>
          <span>{talkingStatus ? 'AI Speaking' : 'Listening'}</span>
        </div>
        <div className="call-timer">{formatCallTime()}</div>
      </div>
      
      <div className="control-buttons">
        <button 
          onClick={toggleAudio} 
          className={`control-btn ${!isAudioEnabled ? 'muted' : ''}`}
          title={isAudioEnabled ? 'Mute Audio' : 'Unmute Audio'}
        >
          {isAudioEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
        </button>
        
        <button 
          onClick={toggleMic} 
          className={`control-btn ${!isMicOn ? 'muted' : ''}`}
          title={isMicOn ? 'Mute Mic' : 'Unmute Mic'}
        >
          {isMicOn ? <MicIcon /> : <MicOffIcon />}
        </button>
        
        <button 
          onClick={closeDialog} 
          className="control-btn end-btn"
          title="End Call"
        >
          <CallEndIcon />
        </button>
      </div>
    </div>
  );

  const renderDetailsPanel = () => {
    if (!showDetails) return null;
    
    return (
      <div className="details-panel">
        <div className="details-header">
          <span>Debug Details</span>
          <button onClick={() => setShowDetails(false)} className="close-details">
            <ExpandLessIcon />
          </button>
        </div>
        
        <div className="details-content">
          <div className="detail-row">
            <span className="detail-label">State Key:</span>
            <span className="detail-value">{currentStateKey || 'N/A'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">State Name:</span>
            <span className="detail-value">{currentState || 'N/A'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Description:</span>
            <span className="detail-value">{stateDescription || 'N/A'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">History:</span>
            <span className="detail-value">{stateHistory.length} states visited</span>
          </div>
        </div>
      </div>
    );
  };

  const renderDialing = () => (
    <div className="dialing-screen">
      <div className="dial-animation">
        <div className="pulse-1"></div>
        <div className="pulse-2"></div>
        <div className="pulse-3"></div>
        <HeadsetIcon className="dial-icon" />
      </div>
      <div className="dial-text">
        <h3>Connecting...</h3>
        <p>Please wait while we connect</p>
      </div>
    </div>
  );

  const hasValidFSM = fsmStates && Object.keys(fsmStates).length > 0;

  const inlineContent = (shouldShowDialog) ? (
    <div className="inline-call-panel">
      {isDialing ? renderDialing() : null}
      {isStreaming ? (
        <div className="compact-call-interface">
          {hasValidFSM ? renderProgressHeader() : (
            <div className="simple-header">
              <h3>AI Call</h3>
              {currentState && <span>{currentState}</span>}
            </div>
          )}

          {getPathTrail().length > 0 && renderProgressStepper()}
          {renderParameters()}
          {renderControls()}
        </div>
      ) : null}
    </div>
  ) : null;

  if (inline) {
    return (
      <div>
        <button
          onClick={handleIconClick}
          className={`call-btn ${!status ? 'disabled' : ''} ${isStreaming ? 'active' : ''}`}
          disabled={!status}
        >
          {isStreaming ? <CallEndIcon /> : <HeadsetIcon />}
        </button>
        {inlineContent}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleIconClick}
        className={`call-btn ${!status ? 'disabled' : ''} ${isStreaming ? 'active' : ''}`}
        disabled={!status}
      >
        {isStreaming ? <CallEndIcon /> : <HeadsetIcon />}
      </button>

      <Dialog
        open={shouldShowDialog}
        onClose={preventDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          className: 'compact-call-dialog'
        }}
      >
        <DialogContent className="compact-dialog-content">
          {isDialing ? renderDialing() : null}
          {isStreaming ? (
            <div className="compact-call-interface">
              {hasValidFSM ? renderProgressHeader() : (
                <div className="simple-header">
                  <h3>AI Call</h3>
                  {currentState && <span>{currentState}</span>}
                </div>
              )}

              {getPathTrail().length > 0 && renderProgressStepper()}
              {renderParameters()}
              {renderControls()}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default AudioStreamer;