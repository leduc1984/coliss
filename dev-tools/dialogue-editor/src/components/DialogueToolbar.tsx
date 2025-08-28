import React from 'react';
import styled from 'styled-components';

const ToolbarContainer = styled.div`
  height: 40px;
  background-color: #2d2d30;
  border-bottom: 1px solid #3e3e42;
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 8px;
`;

const ToolbarButton = styled.button`
  background: none;
  border: 1px solid #5e5e5e;
  color: #cccccc;
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  
  &:hover {
    background-color: #3e3e42;
  }
  
  &.active {
    background-color: #0e639c;
    border-color: #0e639c;
    color: white;
  }
`;

const ToolbarSeparator = styled.div`
  width: 1px;
  height: 20px;
  background-color: #3e3e42;
  margin: 0 4px;
`;

const ToolbarInfo = styled.div`
  margin-left: auto;
  font-size: 10px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 12px;
`;

interface DialogueToolbarProps {
  onValidate: () => void;
  onPlayTest: () => void;
  onZoomFit: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export const DialogueToolbar: React.FC<DialogueToolbarProps> = ({
  onValidate,
  onPlayTest,
  onZoomFit,
  onZoomIn,
  onZoomOut,
}) => {
  return (
    <ToolbarContainer>
      <ToolbarButton onClick={onValidate} title="Validate dialogue flow">
        ✓ Validate
      </ToolbarButton>
      
      <ToolbarButton onClick={onPlayTest} title="Test the dialogue">
        ▶ Play Test
      </ToolbarButton>
      
      <ToolbarSeparator />
      
      <ToolbarButton onClick={onZoomOut} title="Zoom out">
        🔍-
      </ToolbarButton>
      
      <ToolbarButton onClick={onZoomFit} title="Fit to view">
        📐 Fit
      </ToolbarButton>
      
      <ToolbarButton onClick={onZoomIn} title="Zoom in">
        🔍+
      </ToolbarButton>
      
      <ToolbarInfo>
        <span>💡 Drag nodes from library • Right-click for context menu</span>
      </ToolbarInfo>
    </ToolbarContainer>
  );
};