import React, { useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import ColorPicker from './ColorPicker';
import ChatPreview from './ChatPreview';
import OtherView from './OtherView';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

const AgentsList = ({ agents }) => {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState({});
  const [currentView, setCurrentView] = useState('chat');
  const [formGroupCollapseStatus, setFormGroupCollapseStatus] = useState(
    agents.reduce((acc, agent) => {
      Object.keys(agent).forEach((key) => {
        acc[key] = false;
      });
      return acc;
    }, {})
  );

  const handleColorPickerToggle = (fieldName) => {
    setIsColorPickerOpen({ ...isColorPickerOpen, [fieldName]: !isColorPickerOpen[fieldName] });
  };

  const handleColorChange = (color, propertyName) => {
    setSelectedAgent({ ...selectedAgent, [propertyName]: color });
  };

  const handleTextChange = (text, propertyName) => {
    setSelectedAgent({ ...selectedAgent, [propertyName]: text });
  };


  const handleAgentClick = (agent) => {
    setSelectedAgent(agent);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`/api/agents/${selectedAgent.Host}`, selectedAgent);
      console.log(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
  };

  const toggleCollapse = (propertyName) => {
    setFormGroupCollapseStatus((prevState) => ({
      ...prevState,
      [propertyName]: !prevState[propertyName],
    }));
  };

  const renderColorPickerFormGroup = (labelText, fieldName) => {
    return (
      <FormGroup key={fieldName}>
        <Label htmlFor={fieldName}>{labelText}</Label>
        <div className="d-flex align-items-center">
          <div className="color-picker-container">
            {isColorPickerOpen[fieldName] && (
              <ColorPicker
                name={fieldName}
                value={selectedAgent[fieldName]}
                onChange={(color) => handleColorChange(color, fieldName)}
                onClose={() => setIsColorPickerOpen({ ...isColorPickerOpen, [fieldName]: false })}
              />
            )}
          </div>
          {/* {selectedAgent[fieldName]} */}
          <div
            className="color-picker-preview"
            style={{ backgroundColor: selectedAgent[fieldName] }}
            onClick={() => handleColorPickerToggle(fieldName)}
          ></div>
        </div>
      </FormGroup>
    );
  };

  const renderTextInputFormGroup = (label, propertyName) => (
    <FormGroup>
      <Label htmlFor={propertyName}>
        {label}
        <CollapseButton onClick={() => toggleCollapse(propertyName)}>
          {formGroupCollapseStatus[propertyName] ? "+" : "-"}
        </CollapseButton>
      </Label>
      <Input
        isCollapsed={formGroupCollapseStatus[propertyName]}
        type="text"
        id={propertyName}
        name={propertyName}
        onKeyDown={handleKeyDown}
        value={selectedAgent[propertyName]}
        onChange={(e) => handleTextChange(e.target.value, propertyName)}
      />
    </FormGroup>
  );
  
  const renderTextAreaFormGroup = (label, propertyName) => (
    <FormGroup>
      <Label htmlFor={propertyName}>
        {label}
        <CollapseButton onClick={() => toggleCollapse(propertyName)}>
          {formGroupCollapseStatus[propertyName] ? "+" : "-"}
        </CollapseButton>
      </Label>
      <TextArea
        isCollapsed={formGroupCollapseStatus[propertyName]}
        id={propertyName}
        name={propertyName}
        value={selectedAgent[propertyName]}
        onChange={(e) =>
          setSelectedAgent({ ...selectedAgent, [propertyName]: e.target.value })
        }
      />
    </FormGroup>
  );

  const handleMove = (dragId, hoverId) => {
    // Perform the reordering logic here
  };

  return (
    <Container>
      <Table>
        <thead>
          <tr>
            <th>Host</th>
            <th>Logo</th>
            <th>Chat Icon</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {agents.map((agent) => (
            <tr key={agent.Host}>
              <td>{agent.Host}</td>
              <td>{agent.Logo}</td>
              <td>{agent.ChatIcon}</td>
              <td>
                <Button onClick={() => handleAgentClick(agent)}>Edit</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {selectedAgent && (
        <FormContainer>
          <FormWrapper>
          <Form onSubmit={handleFormSubmit}>
            
            <CloseIcon onClick={() => setSelectedAgent(null)}>
            <button className="navigation-close">
              <FontAwesomeIcon icon={faTimes} />
            </button>
            </CloseIcon>
            <FormHeading>Edit Agent</FormHeading>
            {renderTextInputFormGroup('Logo', 'Logo')}
            {renderTextInputFormGroup('Chat Icon', 'ChatIcon')}
            {renderTextInputFormGroup('Input Place holder', 'InputPlaceholder')}

            {renderTextInputFormGroup('Welcoming Message', 'WelcomingMessage')}
            {renderTextInputFormGroup('Text Login Page On Close', 'TextLoginPageOnClose')}

            {renderTextAreaFormGroup('Welcome First Text', 'WelcomeFirstText')}
            {renderTextAreaFormGroup('Welcome Second Text', 'WelcomeSecondText')}
            {renderTextAreaFormGroup('Welcome Third Text', 'WelcomeThirdText')}
            {renderTextAreaFormGroup('Text Login Page On Close', 'TextLoginPageOnClose')}

            {renderColorPickerFormGroup('Filling Box Background Color', 'FillingBoxBackgroundColor')}
            {renderColorPickerFormGroup('Filling Text Color', 'FillingTextColor')}
            {renderColorPickerFormGroup('Chat Background Color', 'ChatBackgroundColor')}
            {renderColorPickerFormGroup('Chat Background Send Color', 'ChatBackgroundSendColor')}
            {renderColorPickerFormGroup('Chat Background Response Color', 'ChatBackgroundResponseColor')}
            {renderColorPickerFormGroup('Chat Text Send Color', 'ChatTextSendColor')}
            {renderColorPickerFormGroup('Chat Text Response Color', 'ChatTextResponseColor')}
            {renderColorPickerFormGroup('Button Background Color', 'ButtonBackgroundColor')}
            {renderColorPickerFormGroup('Button Text Color', 'ButtonTextColor')}
            {/* repeat for all other Agent fields */}
            <div className="form-buttons">
              <Button className="save-button" type="submit">Save Changes</Button>
              <Button className="cancel-button" onClick={() => setSelectedAgent(null)} style={{ marginLeft: '10px' }}>Cancel</Button>
            </div>
          </Form>
          
          <div className="app">
          <nav className="navigation">
            <button onClick={() => setCurrentView('chat')}>Chat</button>
            <button onClick={() => setCurrentView('other')}>Other</button>
          </nav>
            {currentView === 'chat' && <ChatPreview agent={selectedAgent} />}
            {currentView === 'other' && <OtherView />}
          </div>
          
          </FormWrapper>
        </FormContainer>
      )}
    </Container>
  );
};

const CollapseButton = styled.button`
  background-color: transparent;
  color: #333;
  padding: 0.5rem;
  border: none;
  cursor: pointer;
  transition: color 0.2s ease-in-out;

  &:hover {
    color: #6c63ff;
  }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 2rem auto;
  max-width: 80rem;
  font-family: 'Roboto', sans-serif;
`;

const TextArea = styled.textarea`
  display: ${({ isCollapsed }) => (isCollapsed ? "none" : "flex")};
  padding: 0.75rem;
  font-size: 1.2rem;
  border: none;
  width: 100%;
  margin-bottom: 1rem;
  resize: none;
  background-color: transparent;

  &:focus {
    outline: none;
  }

  &::-webkit-scrollbar {
    width: 10px;
  }

  &::-webkit-scrollbar-track {
    background-color: #f5f5f5;
    border-radius: 4px;
  }

  &::-webkit-scrollbar:hover {
    cursor: pointer;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #888;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: #555;
  }

  &::-webkit-scrollbar-button {
    display: none;
  }
`;


const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #ddd;
  }

  th {
    background-color: #f7f7f7;
    font-weight: bold;
    color: #333;
  }
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  background-color: #6c63ff;
  color: #fff;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
  margin-top: 20px;
  &:hover {
    background-color: #4b41d7;
  }
`;

const CloseIcon = styled.span`
  position: absolute;
  top: 1rem;
  left: 1rem;
  font-size: 2rem;
  cursor: pointer;
  color: #333;
  transition: color 0.2s ease-in-out;

  &:hover {
    color: #6c63ff;
  }
`;

const Form = styled.form`
`;

const FormHeading = styled.h2`
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #333;
`;

const FormGroup = styled.div`
  flex-direction: column;
  margin-bottom: 1rem;
  width: 80%;
  border: 1px solid #ccc;
  border-radius: 0.5rem;
  padding: 1rem;
  padding-right: 2rem;
  background-color: white;
  overflow: hidden;
  position: relative;
`;

const Label = styled.label`
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    bottom: -0.1rem;
    left: 0;
    right: 0;
    height: 1px;
    background-color: #ccc;
  }
`;

const Input = styled.input`
  display: ${({ isCollapsed }) => (isCollapsed ? "none" : "flex")}; 
  padding: 0.5rem;
  font-size: 1.2rem;
  border: none;
  width: 100%;
  margin-bottom: 1rem;
  background-color: transparent;

  &:focus {
    outline: none;
  }
`;

const FormContainer = styled.div`
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: #f7f7f7;
  padding: 2rem;
  box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.1);
  z-index: 10;
  display: flex;
  flex-direction: column;
`;

const FormWrapper = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  background-color: #f7f7f7;
`;

export default AgentsList