import React from 'react'
import ReactDOM from 'react-dom/client'
// import ChatApp from './ChatApp'
import AgentsApp from './AgentsApp'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AgentsApp />
    {/* <ChatApp /> */}
  </React.StrictMode>,
)
