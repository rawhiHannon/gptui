import React, { useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';

const AgentsList = ({ agents }) => {
  const [selectedAgent, setSelectedAgent] = useState(null);

  const handleAgentClick = (agent) => {
    setSelectedAgent(agent);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`/api/agents/${selectedAgent.Host}`, selectedAgent);
      console.log(response.data); // handle success
    } catch (error) {
      console.log(error); // handle error
    }
  };

  return (
    <Container>
      <Heading>Agents List</Heading>
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
          <Form onSubmit={handleFormSubmit}>
            <FormHeading>Edit Agent</FormHeading>
            <FormGroup>
              <Label htmlFor="host">Host</Label>
              <Input
                type="text"
                id="host"
                name="Host"
                value={selectedAgent.Host}
                onChange={(e) =>
                  setSelectedAgent({ ...selectedAgent, Host: e.target.value })
                }
                disabled
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="logo">Logo</Label>
              <Input
                type="text"
                id="logo"
                name="Logo"
                value={selectedAgent.Logo}
                onChange={(e) =>
                  setSelectedAgent({ ...selectedAgent, Logo: e.target.value })
                }
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="chat-icon">Chat Icon</Label>
              <Input
                type="text"
                id="chat-icon"
                name="ChatIcon"
                value={selectedAgent.ChatIcon}
                onChange={(e) =>
                  setSelectedAgent({ ...selectedAgent, ChatIcon: e.target.value })
                }
              />
            </FormGroup>
            {/* repeat for all other Agent fields */}
            <Button type="submit">Save Changes</Button>
          </Form>
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

const Heading = styled.h1`
  font-size: 3rem;
  margin-bottom: 2rem;
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
    background-color: #f2f2f2;
    font-weight: bold;
  }
`;
const Button = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.25rem;`

  const CloseIcon = styled.span`
  position: absolute;
  top: 1rem;
  right: 1rem;
  font-size: 2rem;
  cursor: pointer;
`;

const FormContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: auto;
  background-color: #f2f2f2;
  padding: 2rem;
  box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.2);
  z-index: 10;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const FormHeading = styled.h2`
  font-size: 2rem;
  margin-bottom: 2rem;
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
`;

const Input = styled.input`
  padding: 0.5rem;
  font-size: 1.2rem;
  border-radius: 0.25rem;
  border: 1px solid #ccc;
  width: 100%;
  margin-bottom: 1rem;
`;


export default AgentsList