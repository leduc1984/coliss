import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import styled from 'styled-components';
import { MonsterEditor } from './components/MonsterEditor';
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

const StatusIndicator = styled.div<{ hasChanges: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: ${props => props.hasChanges ? '#f59e0b' : '#10b981'};
`;

const FileInput = styled.input`
  display: none;
`;

function App() {
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const [isConnected, setIsConnected] = React.useState(false);

  const handleSave = () => {
    console.log('Saving Pokemon database...');
    // TODO: Implement save functionality
    setHasUnsavedChanges(false);
  };

  const handlePublish = () => {
    if (window.confirm('Publish changes to live database? This action cannot be undone.')) {
      console.log('Publishing to live database...');
      // TODO: Implement publish functionality
    }
  };

  const handleImport = () => {
    const input = document.getElementById('import-file') as HTMLInputElement;
    input?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          console.log('Importing Pokemon data:', file.name);
          // TODO: Implement import functionality
        } catch (error) {
          alert('Invalid file format');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleExport = () => {
    console.log('Exporting Pokemon database...');
    // TODO: Implement export functionality
  };

  const handleBackup = () => {
    console.log('Creating database backup...');
    // TODO: Implement backup functionality
  };

  const handleValidate = () => {
    console.log('Validating Pokemon data...');
    // TODO: Implement validation
  };

  const handleAnalyze = () => {
    console.log('Analyzing game balance...');
    // TODO: Implement balance analysis
  };

  return (
    <>
      <GlobalStyles />
      <Router>
        <AppContainer>
          <AppHeader>
            <Title>
              🦄 Pokemon MMO - Monster Editor
            </Title>
            <HeaderActions>
              <StatusIndicator hasChanges={hasUnsavedChanges}>
                {hasUnsavedChanges ? '⚠️ Unsaved Changes' : '✅ Saved'}
              </StatusIndicator>
              <StatusIndicator hasChanges={!isConnected}>
                {isConnected ? '🔗 Connected' : '🔌 Offline'}
              </StatusIndicator>
              <HeaderButton onClick={handleImport}>Import</HeaderButton>
              <HeaderButton onClick={handleExport}>Export</HeaderButton>
              <HeaderButton onClick={handleBackup}>Backup</HeaderButton>
              <HeaderButton onClick={handleValidate}>Validate</HeaderButton>
              <HeaderButton onClick={handleAnalyze}>Analyze</HeaderButton>
              <HeaderButton onClick={handleSave} disabled={!hasUnsavedChanges}>
                Save
              </HeaderButton>
              <HeaderButton onClick={handlePublish} disabled={!hasUnsavedChanges}>
                Publish
              </HeaderButton>
              <FileInput
                id="import-file"
                type="file"
                accept=".json,.csv,.xml"
                onChange={handleFileImport}
              />
            </HeaderActions>
          </AppHeader>
          
          <Routes>
            <Route 
              path="/*" 
              element={
                <MonsterEditor 
                  onUnsavedChanges={setHasUnsavedChanges}
                  onConnectionChange={setIsConnected}
                />
              } 
            />
          </Routes>
        </AppContainer>
      </Router>
    </>
  );
}

export default App;