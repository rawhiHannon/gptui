import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AgentsList from './AgentsList';
// import EditAgent from './EditAgent';
import reactLogo from './assets/react.svg';
import './AgentApp.css';

const AgentsApp = () => {
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('welcome');

  useEffect(() => {
    const fetchAgents = async () => {
      const response = await axios.get('https://chat.agentaichat.com:2096/api/agent');
      setAgents([response.data]);
    };
    fetchAgents();
  }, []);

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
    setSelectedAgent(null);
    setIsEditing(false);
  };

  const handleEdit = (agent) => {
    setSelectedAgent(agent);
    setIsEditing(true);
    setActiveTab('edit');
  };

  const handleSave = async (updatedAgent) => {
    try {
      const response = await axios.put(`https://chat.agentaichat.com:2096/api/agent/${updatedAgent.id}`, updatedAgent);
      const updatedAgents = agents.map((agent) => (agent.id === updatedAgent.id ? updatedAgent : agent));
      setAgents(updatedAgents);
      setSelectedAgent(null);
      setIsEditing(false);
      setActiveTab('list');
    } catch (error) {
      console.error(error);
    }
  };

  const handleCancel = () => {
    setSelectedAgent(null);
    setIsEditing(false);
    setActiveTab('list');
  };

  return (
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
            {/* {isEditing ? (
              <EditAgent agent={selectedAgent} onSave={handleSave} onCancel={handleCancel} />
            ) : ( */}
              <AgentsList agents={agents} onEdit={handleEdit} />
            {/* )} */}
          </>
        )}
      </div>
    </div>
  );
};

export default AgentsApp;