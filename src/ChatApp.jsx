import { useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'
import Chat from "./Chat";
import AudioChat from "./AudioChat";
import AudioStreamer from "./AudioStreamer";

function ChatApp() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      {/* <Chat /> */}
      <AudioChat />
      {/* <AudioStreamer /> */}
    </div>
  )
}

export default ChatApp
