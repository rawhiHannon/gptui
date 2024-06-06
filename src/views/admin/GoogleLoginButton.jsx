import React, { useCallback } from 'react';

const GoogleLoginButton = ({ onLoginSuccess }) => {
  const handleButtonClick = useCallback(() => {
    // Replace '/auth/google' with the appropriate API endpoint
    fetch('https://chat.agentaichat.com:2096/api/auth/google?uid=your_uid_here')
      .then(response => response.text())
      .then(url => {
        const authWindow = window.open(url, '_blank', 'width=500,height=600');
        const checkAuthInterval = setInterval(() => {
          if (authWindow.closed) {
            clearInterval(checkAuthInterval);
            // Notify the client that they have been upgraded and can continue chatting
            onLoginSuccess();
          }
        }, 1000);
      });
  }, [onLoginSuccess]);

  return <button onClick={handleButtonClick}>Login with Google</button>;
};

export default GoogleLoginButton;