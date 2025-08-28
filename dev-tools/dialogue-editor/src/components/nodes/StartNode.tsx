import React from 'react';
import { Handle, Position } from 'react-flow-renderer';
import styled from 'styled-components';

const NodeContainer = styled.div`
  background-color: #2d4a4a;
  border: 2px solid #4a7c7c;
  border-radius: 50%;
  padding: 16px;
  width: 80px;
  height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const NodeIcon = styled.div`
  font-size: 20px;
  margin-bottom: 4px;
`;

const NodeLabel = styled.div`
  font-size: 10px;
  color: #a8d8d8;
  font-weight: 600;
  text-align: center;
`;

interface StartNodeProps {
  data: {
    label?: string;
  };
  selected: boolean;
}

export const StartNode: React.FC<StartNodeProps> = ({ data, selected }) => {
  return (
    <NodeContainer style={{ 
      borderColor: selected ? '#007acc' : '#4a7c7c',
      boxShadow: selected ? '0 0 0 2px rgba(0, 122, 204, 0.3)' : 'none'
    }}>
      <NodeIcon>🚀</NodeIcon>
      <NodeLabel>START</NodeLabel>
      
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ 
          background: '#4a7c7c',
          border: '2px solid #a8d8d8',
          width: 12,
          height: 12,
        }}
      />
    </NodeContainer>
  );
};