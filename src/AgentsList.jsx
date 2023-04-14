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
      <Label htmlFor={propertyName}>{label}</Label>
      <Input
        type="text"
        id={propertyName}
        name={propertyName}
        value={selectedAgent[propertyName]}
        onChange={(e) => handleTextChange(e.target.value, propertyName)
        }
      />
    </FormGroup>
  );
  
  const renderTextAreaFormGroup = (label, propertyName) => (
    <FormGroup>
      <Label htmlFor={propertyName}>{label}</Label>
      <TextArea
        id={propertyName}
        name={propertyName}
        value={selectedAgent[propertyName]}
        onChange={(e) =>
          setSelectedAgent({ ...selectedAgent, [propertyName]: e.target.value })
        }
      />
    </FormGroup>
  );

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
            <Button type="submit">Save Changes</Button>
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
const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 2rem auto;
  max-width: 80rem;
`;

const TextArea = styled.textarea`
  padding: 0.5rem;
  font-size: 1.2rem;
  border-radius: 0.25rem;
  border: 1px solid #ccc;
  width: 100%;
  margin-bottom: 1rem;
  resize: vertical;
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
  border-radius: 0.25rem;
  background-color: #3498db;
  color: #fff;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background-color: #2980b9;
  }
`;

const CloseIcon = styled.span`
  position: absolute;
  top: 1rem;
  left: 1rem;
  font-size: 2rem;
  cursor: pointer;
  color: #333;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`;

const FormHeading = styled.h2`
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #333;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
  width: 100%;
`;

const Label = styled.label`
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  color: #333;
`;

const Input = styled.input`
  padding: 0.5rem;
  font-size: 1.2rem;
  border-radius: 0.25rem;
  border: 1px solid #ccc;
  width: 100%;
  margin-bottom: 1rem;
`;

const FormContainer = styled.div`
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: #f7f7f7;
  padding: 2rem;
  box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.2);
  z-index: 10;
  display: flex;
  flex-direction: column;
`;

const FormWrapper = styled.div`
  flex-grow: 1;
  overflow-y: auto;
`;

export default AgentsList