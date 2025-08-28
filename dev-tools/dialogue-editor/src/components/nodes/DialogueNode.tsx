import React from 'react';
import { Handle, Position } from 'react-flow-renderer';
import styled from 'styled-components';

const NodeContainer = styled.div`
  background-color: #2d4a2d;
  border: 2px solid #4a7c4a;
  border-radius: 8px;
  padding: 12px;
  min-width: 200px;
  max-width: 300px;
  position: relative;
`;

const NodeHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 12px;
  color: #8fbc8f;
`;

const NodeIcon = styled.div`
  width: 16px;
  height: 16px;
  background-color: #4a7c4a;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
`;

const CharacterName = styled.div`
  font-size: 11px;
  color: #a8d8a8;
  margin-bottom: 4px;
  font-weight: 500;
`;

const DialogueText = styled.div`
  font-size: 11px;
  color: #cccccc;
  line-height: 1.4;
  word-wrap: break-word;
  max-height: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
`;

const Portrait = styled.div`
  position: absolute;
  top: -8px;
  left: -8px;
  width: 24px;
  height: 24px;
  background-color: #4a7c4a;
  border: 2px solid #8fbc8f;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: white;
`;

interface DialogueNodeProps {
  data: {
    label?: string;
    character?: string;
    text?: string;
    portrait?: string;
    voiceFile?: string;
    animation?: string;
  };
  selected: boolean;
}

export const DialogueNode: React.FC<DialogueNodeProps> = ({ data, selected }) => {
  const character = data.character || 'Unknown';
  const text = data.text || 'Enter dialogue text...';
  const portraitInitial = character.charAt(0).toUpperCase();

  return (
    <NodeContainer style={{ 
      borderColor: selected ? '#007acc' : '#4a7c4a',
      boxShadow: selected ? '0 0 0 2px rgba(0, 122, 204, 0.3)' : 'none'
    }}>
      <Handle
        type="target"
        position={Position.Top}
        style={{ 
          background: '#4a7c4a',
          border: '2px solid #8fbc8f',
          width: 10,
          height: 10,
        }}
      />
      
      <Portrait>{portraitInitial}</Portrait>
      
      <NodeHeader>
        <NodeIcon>💬</NodeIcon>
        <span>Dialogue</span>
      </NodeHeader>
      
      <CharacterName>{character}</CharacterName>
      <DialogueText>{text}</DialogueText>
      
      {data.voiceFile && (
        <div style={{ 
          fontSize: '10px', 
          color: '#a8d8a8', 
          marginTop: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          🔊 Voice
        </div>
      )}
      
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ 
          background: '#4a7c4a',
          border: '2px solid #8fbc8f',
          width: 10,
          height: 10,
        }}
      />
    </NodeContainer>
  );
};