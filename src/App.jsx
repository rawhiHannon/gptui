import { useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'
import Chat from "./Chat";

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <Chat />
    </div>
  )
}

export default App
