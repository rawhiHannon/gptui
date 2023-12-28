import { useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'
import Chat from "./Chat";
import AudioChat from "./AudioChat";
import SpeechRecognition from "./SpeechRecognition";

function ChatApp(handleDrawerOpen) {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      {/* <Chat /> */}
      <AudioChat handleDrawerOpen={handleDrawerOpen} />
      {/* <SpeechRecognition /> */}
    </div>
  )
}

export default ChatApp
