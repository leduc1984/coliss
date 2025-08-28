import React from 'react';
import styled from 'styled-components';
import { DialogueEditor } from './components/DialogueEditor';
import { GlobalStyles } from './styles/GlobalStyles';
import './App.css';

const AppContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #1e1e1e;
  color: #ffffff;
`;

const AppHeader = styled.header`
  background-color: #2d2d30;
  padding: 8px 16px;
  border-bottom: 1px solid #3e3e42;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  min-height: 48px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #cccccc;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
`;

const HeaderButton = styled.button`
  background-color: #0e639c;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #1177bb;
  }

  &:active {
    background-color: #0d5a9a;
  }
  
  &:disabled {
    background-color: #5a5a5a;
    cursor: not-allowed;
  }
`;

const FileInput = styled.input`
  display: none;
`;

function App() {
  const handleNewProject = () => {
    if (window.confirm('Create a new dialogue project? Unsaved changes will be lost.')) {
      console.log('Creating new project...');
      // TODO: Implement new project creation
    }
  };

  const handleSave = () => {
    console.log('Saving project...');
    // TODO: Implement save functionality
  };

  const handleLoad = () => {
    const input = document.getElementById('load-file') as HTMLInputElement;
    input?.click();
  };

  const handleFileLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          console.log('Loading project:', JSON.parse(content));
          // TODO: Implement project loading
        } catch (error) {
          alert('Invalid project file format');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleExport = () => {
    console.log('Exporting dialogue...');
    // TODO: Implement export functionality
  };

  const handlePlayTest = () => {
    console.log('Starting play test...');
    // TODO: Implement play test mode
  };

  const handleValidate = () => {
    console.log('Validating dialogue...');
    // TODO: Implement validation
  };

  return (
    <>
      <GlobalStyles />
      <AppContainer>
        <AppHeader>
          <Title>
            💬 Pokemon MMO - Dialogue Editor
          </Title>
          <HeaderActions>
            <HeaderButton onClick={handleNewProject}>New</HeaderButton>
            <HeaderButton onClick={handleLoad}>Load</HeaderButton>
            <HeaderButton onClick={handleSave}>Save</HeaderButton>
            <HeaderButton onClick={handleExport}>Export</HeaderButton>
            <HeaderButton onClick={handleValidate}>Validate</HeaderButton>
            <HeaderButton onClick={handlePlayTest}>Play Test</HeaderButton>
            <FileInput
              id="load-file"
              type="file"
              accept=".json"
              onChange={handleFileLoad}
            />
          </HeaderActions>
        </AppHeader>
        <DialogueEditor />
      </AppContainer>
    </>
  );
}

export default App;