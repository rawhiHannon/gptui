import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import ColorPicker from './ColorPicker';
import ChatPreview from './ChatPreview';
import SignupPreview from './SignupPreview';
import SignupSMSPreview from './SignupSMSPreview';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const AgentsList = ({ agents, onAddAgent }) => {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState({});
  const [formGroupCollapseStatus, setFormGroupCollapseStatus] = useState(
    agents.reduce((acc, agent) => {
      Object.keys(agent).forEach((key) => {
        acc[key] = false;
      });
      return acc;
    }, {})
  );
  
  const [previewPositions, setPreviewPositions] = useState(() => {
    const savedPositions = localStorage.getItem('previewPositions');
    return savedPositions ? JSON.parse(savedPositions) : {};
  });

  const [viewsVisibility, setViewsVisibility] = useState(() => {
    const savedviewsVisibility = localStorage.getItem('viewsVisibility');
    return savedviewsVisibility ? JSON.parse(savedviewsVisibility) : {};
  });

  const showErrorNotification = (msg) => {
    toast.error(
      msg, {
      position: toast.POSITION.TOP_CENTER,
      autoClose: 2000,
      hideProgressBar: true,
    });
  };

  const showSuccessNotification = (msg) => {
    toast.success(
      msg, {
      position: toast.POSITION.TOP_CENTER,
      autoClose: 2000,
      hideProgressBar: true,
    });
  };

  const toggleViewVisibility = (view) => {
    setViewsVisibility((prevState) => {
      const updatedState = {
        ...prevState,
        [view]: prevState[view] ? !prevState[view] : true,
      };
      localStorage.setItem('viewsVisibility', JSON.stringify(updatedState));
      return updatedState;
    });
  };
  
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

  const updateAgent = (agent) => {
    for(let i in agents) {
      if(agents[i].host == agent.host) {
        agents[i] = agent;
        return;
      }
    }
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`https://chat.agentaichat.com:2096/api/agent?host=${selectedAgent.host}`, selectedAgent);
      updateAgent(selectedAgent.host)
      setSelectedAgent(null);
      showSuccessNotification("Updated successfully")
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

  const setPreviewPosition = (previewName, position) => {
    setPreviewPositions((prevState) => {
      const updatedPositions = {
        ...prevState,
        [previewName]: position,
      };
      localStorage.setItem('previewPositions', JSON.stringify(updatedPositions));
      return updatedPositions;
    });
  };

  const [isAddingAgent, setIsAddingAgent] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");

  const handleAddAgent = () => {
    setIsAddingAgent(true);
  };

  const handleNewAgentNameChange = (event) => {
    setNewAgentName(event.target.value);
  };

  const handleAddNewAgent = () => {
    if(newAgentName == "") {
      setIsAddingAgent(false);
      showErrorNotification("Empty name!")
      return
    }
    const newAgent = {
      host: newAgentName,
    };
    for(let i in agents) {
      if(agents[i].host == newAgentName) {
        setIsAddingAgent(false);
        showErrorNotification("Agent already exists!")
        return;
      }
    }
    onAddAgent(newAgent);
    setIsAddingAgent(false);
  };

  const handleCancelAddAgent = () => {
    setIsAddingAgent(false);
    setNewAgentName("");
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

  return (
    <>
    <ToastContainer />
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
            <tr key={agent.host}>
              <td>{agent.host}</td>
              <td>{agent.logo}</td>
              <td>{agent.chat_icon}</td>
              <td>
                <Button onClick={() => handleAgentClick(agent)}>Edit</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

    <div className="add-agent-button" onClick={handleAddAgent}>
      +
    </div>

    <div>
      <Dialog open={isAddingAgent} onClose={handleCancelAddAgent}>
        <DialogTitle>Add New Agent</DialogTitle>
        <DialogContent>
          <DialogContentText>
          </DialogContentText>
          <TextField
            // autoFocus
            margin="dense"
            id="name"
            label="Enter agent name"
            style={{ width: '500px' }}
            variant="standard"
            onChange={handleNewAgentNameChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelAddAgent}>Cancel</Button>
          <Button onClick={handleAddNewAgent}>Add</Button>
        </DialogActions>
      </Dialog>
    </div>
      {/* The rest of your component's code goes here */}

      {selectedAgent && (
        <FormContainer>
          <FormWrapper>
          <Form onSubmit={handleFormSubmit}>
            
            <FormHeader>
              <FormHeading>Edit Agent</FormHeading>
              <CloseIcon onClick={() => setSelectedAgent(null)}>
                  <FontAwesomeIcon icon={faTimes} />
              </CloseIcon>
            </FormHeader>

            {renderTextInputFormGroup('Logo', 'logo')}
            {renderTextInputFormGroup('Chat Icon', 'chat_icon')}
            {renderTextInputFormGroup('Input Place holder', 'input_placeholder')}

            {renderTextInputFormGroup('Welcoming Message', 'welcoming_message')}
            {renderTextInputFormGroup('Text Login Page On Close', 'text_login_page_on_close')}

            {renderTextAreaFormGroup('Welcome First Text', 'welcome_first_text')}
            {renderTextAreaFormGroup('Welcome Second Text', 'welcome_second_text')}
            {renderTextAreaFormGroup('Welcome Third Text', 'welcome_third_text')}
            {renderTextAreaFormGroup('Text Login Page On Close', 'text_login_page_on_close')}
            {renderTextAreaFormGroup('Email First Text', 'email_first_text')}
            {renderTextAreaFormGroup('Phone First Text', 'phone_first_text')}
            {renderTextAreaFormGroup('Phone Second Text', 'phone_second_text')}
            {renderTextAreaFormGroup('Privacy Policy Text', 'privacy_policy_text')}

            {renderColorPickerFormGroup('Filling Box Background Color', 'filling_box_background_color')}
            {renderColorPickerFormGroup('Filling Text Color', 'filling_text_color')}
            {renderColorPickerFormGroup('Chat Background Color', 'chat_background_color')}
            {renderColorPickerFormGroup('Chat Background Send Color', 'chat_background_send_color')}
            {renderColorPickerFormGroup('Chat Background Response Color', 'chat_background_response_color')}
            {renderColorPickerFormGroup('Chat Text Send Color', 'chat_text_send_color')}
            {renderColorPickerFormGroup('Chat Text Response Color', 'chat_text_response_color')}
            {renderColorPickerFormGroup('Button Background Color', 'button_background_color')}
            {renderColorPickerFormGroup('Button Text Color', 'button_text_color')}
            {/* repeat for all other Agent fields */}
            <div className="form-buttons">
              <Button className="save-button" type="submit">Save Changes</Button>
              <Button className="cancel-button" onClick={() => setSelectedAgent(null)} style={{ marginLeft: '10px' }}>Cancel</Button>
            </div>
          </Form>
          
          <div className="app">
              <nav className="navigation">
                <button onClick={() => toggleViewVisibility('chat')}>
                  {viewsVisibility['chat'] ? 'Hide Chat' : 'Show Chat'}
                </button>
                <button onClick={() => toggleViewVisibility('signup')}>
                  {viewsVisibility['signup'] ? 'Hide signup' : 'Show signup'}
                </button>
                <button onClick={() => toggleViewVisibility('sms')}>
                  {viewsVisibility['sms'] ? 'Hide sms' : 'Show sms'}
                </button>
              </nav>
              {viewsVisibility['chat'] && (
                <PreviewContainer>
                  <ChatPreview
                    position={previewPositions['chat']}
                    agent={selectedAgent}
                    onStop={(e, data) => {
                      setPreviewPosition('chat', { x: data.x, y: data.y });
                    }}
                  />
                </PreviewContainer>
              )}
              {viewsVisibility['signup'] && (
                <PreviewContainer>
                  <SignupPreview
                    position={previewPositions['signup']}
                    agent={selectedAgent}
                    onStop={(e, data) => {
                      setPreviewPosition('signup', { x: data.x, y: data.y });
                    }}
                  />
                </PreviewContainer>
              )}
              {viewsVisibility['sms'] && (
                <PreviewContainer>
                  <SignupSMSPreview
                    position={previewPositions['sms']}
                    agent={selectedAgent}
                    onStop={(e, data) => {
                      setPreviewPosition('sms', { x: data.x, y: data.y });
                    }}
                  />
                </PreviewContainer>
              )}
            </div>
          
          </FormWrapper>
        </FormContainer>
      )}
    </Container>
    </>
  );
};

const FormHeader = styled.div`
  flex-direction: column;
  width: 80%;
  padding-right: 2rem;
  overflow: hidden;
  position: relative;
`;

const PreviewContainer = styled.div`
  padding: 1rem;
`;

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

  &:focus {
    outline: none;
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

const CustomButton = styled.button`
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

const FormHeading = styled.h3`
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 2rem;
`;

const CloseIcon = styled.span`
  position: absolute;
  top: 15px;
  right: 0;
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