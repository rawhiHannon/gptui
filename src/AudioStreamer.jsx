import React, { useState, useEffect, useRef } from 'react';
import manager from './manager'; // Assuming this is your WebSocket manager
import AudioRecorder from './AudioRecorder';

const AudioStreamer = () => {

  const handleAudioComplete = (base64audio) => {
    manager.sendStream(base64audio)
  };

  return (
    <div>
      <AudioRecorder onRecordingComplete={handleAudioComplete} />
    </div>
  );
};

export default AudioStreamer;
