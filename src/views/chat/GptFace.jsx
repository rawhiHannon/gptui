import React from 'react';

const GptFace = ({ isSpeaking, isOnCall }) => {
  return (
    isSpeaking && !isOnCall && (
      <div className="head">
        <div className="hair"></div>
        <div className="eyebrow-container">
          <div className="eyebrow left"></div>
          <div className="eyebrow right"></div>
        </div>
        <div className="eyes-container">
          <div className="eye">
            <div className="iris">
              <div className="pupil"></div>
            </div>
          </div>
          <div className="eye">
            <div className="iris">
              <div className="pupil"></div>
            </div>
          </div>
        </div>
        <div className="nose"></div>
        {isSpeaking ? <div className="mouth"></div> : <div className="nospeak-mouth"></div>}
      </div>
    )
  );
};

export default GptFace;
