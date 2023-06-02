import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AgentsList from './AgentsList';
// import EditAgent from './EditAgent';
import reactLogo from './assets/react.svg';
import './AgentApp.css';
import GoogleLoginButton from './GoogleLoginButton';

const AgentsApp = () => {
  const [agents, setAgents] = useState([]);
  const [activeTab, setActiveTab] = useState('welcome');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSidebarButtonClick = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    const fetchAgents = async () => {
      const response = await axios.get('https://chat.agentaichat.com:2096/api/agents');
      setAgents(response.data);
    };
    fetchAgents();
  }, []);

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
  };

  const onAddAgent = (agent) => {
    setAgents([...agents, agent])
  }

  const handleGoogleLoginSuccess = () => {
    // Do something after the user has successfully logged in
    console.log('User logged in successfully');
  };
  <button className="crm__sidebar-button" onClick={handleSidebarButtonClick}>Open Sidebar</button>

  return (
    <>
    <div className="crm">
      <div className="crm__sidebar">
      <div className="crm__header">
        {/* <div className="crm__logo-container">
          <img src={reactLogo} alt="AiAgent Logo" className="crm__logo" />
        </div> */}
        <div className="crm__title-container">
          <h1 className="crm__title">AiAgent</h1>
        </div>
      </div>
        <div className="crm__tabs">
          <div className={`crm__tab ${activeTab != 'list' ? 'crm__tab--active' : ''}`} onClick={() => handleTabClick('welcome')}>
            <i className="fas fa-home crm__tab-icon"></i>
            <span className="crm__tab-label">Home</span>
          </div>
          <div className={`crm__tab ${activeTab === 'list' ? 'crm__tab--active' : ''}`} onClick={() => handleTabClick('list')}>
            <i className="fas fa-users crm__tab-icon"></i>
            <span className="crm__tab-label">Agents</span>
          </div>
          {/* <div className={`crm__tab `}>
            <i className="fas fa-users crm__tab-icon"></i>
            <span className="crm__tab-label">
              <GoogleLoginButton onLoginSuccess={handleGoogleLoginSuccess} />
            </span>
          </div> */}
        </div>
      </div>
        <div className="crm__content">
          {activeTab === 'welcome' && (
            <div className="crm__welcome">
              <img className="crm__logo" src={reactLogo} alt="React logo" />
              <h1 className="crm__title">Agent CRM</h1>
              <p className="crm__message">Welcome to Agent CRM! Use the Agents List tab to view and edit agents.</p>
            </div>
          )}
          {activeTab === 'list' && (
            <>
                <AgentsList agents={agents} onAddAgent={onAddAgent} />
            </>
          )}
        </div>
    </div>
    </>
    
  );
};

export default AgentsApp;