import { useState } from 'react'
import './App.css'
import AudioChat from "./AudioChat";

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
