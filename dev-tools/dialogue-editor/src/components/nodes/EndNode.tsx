import React from 'react';
import { Handle, Position } from 'react-flow-renderer';
import styled from 'styled-components';

const NodeContainer = styled.div`
  background-color: #3d3d3d;
  border: 2px solid #6d6d6d;
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
  color: #cccccc;
  font-weight: 600;
  text-align: center;
`;

interface EndNodeProps {
  data: {
    label?: string;
  };
  selected: boolean;
}

export const EndNode: React.FC<EndNodeProps> = ({ data, selected }) => {
  return (
    <NodeContainer style={{ 
      borderColor: selected ? '#007acc' : '#6d6d6d',
      boxShadow: selected ? '0 0 0 2px rgba(0, 122, 204, 0.3)' : 'none'
    }}>
      <Handle
        type="target"
        position={Position.Top}
        style={{ 
          background: '#6d6d6d',
          border: '2px solid #cccccc',
          width: 12,
          height: 12,
        }}
      />
      
      <NodeIcon>🏁</NodeIcon>
      <NodeLabel>END</NodeLabel>
    </NodeContainer>
  );
};