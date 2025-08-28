import React from 'react';
import { Handle, Position } from 'react-flow-renderer';
import styled from 'styled-components';

const NodeContainer = styled.div`
  background-color: #4a2d4a;
  border: 2px solid #7c4a7c;
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
  color: #d8a8d8;
`;

const NodeIcon = styled.div`
  width: 16px;
  height: 16px;
  background-color: #7c4a7c;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
`;

const ChoiceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Choice = styled.div`
  font-size: 11px;
  color: #cccccc;
  background-color: rgba(255, 255, 255, 0.1);
  padding: 4px 6px;
  border-radius: 4px;
  border-left: 3px solid #7c4a7c;
  position: relative;
  line-height: 1.3;
`;

const ChoiceHandle = styled(Handle)`
  background: #7c4a7c !important;
  border: 2px solid #d8a8d8 !important;
  width: 8px !important;
  height: 8px !important;
  right: -6px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
`;

interface Choice {
  id: string;
  text: string;
  condition?: string;
  targetNodeId?: string;
}

interface PlayerChoiceNodeProps {
  data: {
    label?: string;
    choices?: Choice[];
  };
  selected: boolean;
}

export const PlayerChoiceNode: React.FC<PlayerChoiceNodeProps> = ({ data, selected }) => {
  const choices = data.choices || [
    { id: '1', text: 'Yes' },
    { id: '2', text: 'No' }
  ];

  return (
    <NodeContainer style={{ 
      borderColor: selected ? '#007acc' : '#7c4a7c',
      boxShadow: selected ? '0 0 0 2px rgba(0, 122, 204, 0.3)' : 'none'
    }}>
      <Handle
        type="target"
        position={Position.Top}
        style={{ 
          background: '#7c4a7c',
          border: '2px solid #d8a8d8',
          width: 10,
          height: 10,
        }}
      />
      
      <NodeHeader>
        <NodeIcon>🤔</NodeIcon>
        <span>Player Choice</span>
      </NodeHeader>
      
      <ChoiceList>
        {choices.map((choice, index) => (
          <Choice key={choice.id}>
            {choice.text}
            {choice.condition && (
              <div style={{ 
                fontSize: '9px', 
                color: '#d8a8d8', 
                marginTop: '2px',
                fontStyle: 'italic'
              }}>
                if: {choice.condition}
              </div>
            )}
            <ChoiceHandle
              type="source"
              position={Position.Right}
              id={`choice-${choice.id}`}
              style={{ 
                top: `${20 + index * 32 + 16}px`
              }}
            />
          </Choice>
        ))}
      </ChoiceList>
    </NodeContainer>
  );
};