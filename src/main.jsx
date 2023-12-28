import React from 'react'
import ReactDOM from 'react-dom/client'
import ChatApp from './ChatApp'
// import Chat from './Chat'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* <Chat /> */}
    <ChatApp />
  </React.StrictMode>,
)
