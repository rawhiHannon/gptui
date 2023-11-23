import { useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'
import Chat from "./Chat";
import AudioChat from "./AudioChat";

function ChatApp() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      {/* <Chat /> */}
      <AudioChat />
    </div>
  )
}

export default ChatApp
