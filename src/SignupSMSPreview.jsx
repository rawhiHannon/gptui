import React, { useState, useEffect } from 'react';
import Draggable from 'react-draggable';

const SignupSMSPreview = ({ agent, position, onStop, onClose }) => {
    const [email, setEmail] = useState('');

    const handleEmailChange = (e) => {
      setEmail(e.target.value);
    }


    const handleToggleEmail = () => {
      // Toggle email input logic
    };
  
    const handleTogglePhone = () => {
      // Toggle phone input logic
    };
  
    const handleSubmit = (event) => {
      event.preventDefault();
      // Form submission logic
    };
  

  return (
    <Draggable bounds="body" position={position} onStop={onStop} handle=".chat-preview-drag-handle">
    <div className="chat-preview" style={{ backgroundColor: agent.ChatBackgroundColor }}>
      <div className="chat-preview-header chat-preview-drag-handle">
        <div className="chatbox-flex-center" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
          <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.1035 15.0876L4.88789 8.87194C4.82886 8.81291 4.78754 8.75388 4.76393 8.69486C4.74032 8.63583 4.72852 8.5709 4.72852 8.50007C4.72852 8.42923 4.74032 8.3643 4.76393 8.30527C4.78754 8.24625 4.82886 8.18722 4.88789 8.12819L11.1035 1.91257C11.2334 1.7827 11.3987 1.71777 11.5993 1.71777C11.8 1.71777 11.9653 1.7827 12.0952 1.91257C12.2368 2.05423 12.3077 2.22246 12.3077 2.41725C12.3077 2.61204 12.2368 2.78027 12.0952 2.92194L6.51706 8.50007L12.0952 14.0782C12.2487 14.2317 12.3195 14.4028 12.3077 14.5917C12.2959 14.7806 12.225 14.94 12.0952 15.0699C11.9535 15.2115 11.7853 15.2824 11.5905 15.2824C11.3957 15.2824 11.2334 15.2174 11.1035 15.0876Z" fill="#865439"></path>
          </svg>
          </div>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.17 14.83L14.83 9.17M14.83 14.83L9.17 9.17M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="#865439" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        </div>
      </div>
      <div className="chatbox-sign" id="chatbox-sign" style={{ display: 'block' }}>
      <div id="js-chatbox-email-input">
        <h3 style={{textAlign: 'center', color: '#333333'}}>{agent.EmailFirstText}</h3>
        
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <img src="https://agentbuddy.xseed.me/logo.png" style={{ width: '250px' }} alt="" className="chatbox-image" id="chatbox-logo" />
        </div>

        <p id="js-chatbox-welcomeFirstText">{agent.WelcomeFirstText}</p>
        <div className="chatbox-input">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-mail">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
          <input type="email" className="chatbox-email" name="email" placeholder="E-mail" value={email} onChange={handleEmailChange} />
        </div>
        </div>

        <form onSubmit={handleSubmit} className="js-chatbox-forminput">
        <div style={{ }}>
          <p style={{fontSize: '13px'}}>By continuing you agree to our Terms of Service and Privacy Policy</p>
        </div>
        <button type="submit" style={{ width: '100%', border: 'none', outline: 'none' }} className="chatbox-submit">Continue</button>
        </form>
      </div>
    </div>
    </Draggable>
  );
};


export default SignupSMSPreview;

