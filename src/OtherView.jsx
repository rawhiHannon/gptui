import React, { useState, useEffect } from 'react';
import Draggable from 'react-draggable';

const OtherView = ({ agent, position, onStop }) => {

  return (
    <Draggable bounds="body" position={position} onStop={onStop} handle=".chat-preview-drag-handle">
    <div className="chat-preview" style={{ backgroundColor: agent.ChatBackgroundColor }}>
      <div className="chat-preview-header chat-preview-drag-handle">
        Agent Buddy
      </div>
    </div>
    </Draggable>
  );
};
export default OtherView;

