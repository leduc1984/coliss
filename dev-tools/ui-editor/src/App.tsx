import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import styled from 'styled-components';
import { UIEditor } from './components/UIEditor';
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
`;

function App() {
  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Saving UI layout...');
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting UI to JSON...');
  };

  const handleImport = () => {
    // TODO: Implement import functionality
    console.log('Importing UI from JSON...');
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <GlobalStyles />
      <AppContainer>
        <AppHeader>
          <Title>Pokemon MMO - UI Editor</Title>
          <HeaderActions>
            <HeaderButton onClick={handleImport}>Import</HeaderButton>
            <HeaderButton onClick={handleSave}>Save</HeaderButton>
            <HeaderButton onClick={handleExport}>Export</HeaderButton>
          </HeaderActions>
        </AppHeader>
        <UIEditor />
      </AppContainer>
    </DndProvider>
  );
}

export default App;