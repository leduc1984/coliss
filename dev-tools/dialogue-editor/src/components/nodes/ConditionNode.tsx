import React from 'react';
import { Handle, Position } from 'react-flow-renderer';
import styled from 'styled-components';

const NodeContainer = styled.div`
  background-color: #4a4a2d;
  border: 2px solid #7c7c4a;
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
  color: #d8d8a8;
`;

const NodeIcon = styled.div`
  width: 16px;
  height: 16px;
  background-color: #7c7c4a;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
`;

const ConditionText = styled.div`
  font-size: 11px;
  color: #cccccc;
  background-color: rgba(0, 0, 0, 0.2);
  padding: 6px 8px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  border-left: 3px solid #7c7c4a;
  word-wrap: break-word;
  max-height: 60px;
  overflow: hidden;
`;

const ConditionType = styled.div`
  font-size: 10px;
  color: #d8d8a8;
  margin-bottom: 4px;
  text-transform: uppercase;
  font-weight: 500;
`;

const OutputHandles = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
`;

const HandleLabel = styled.div`
  font-size: 9px;
  color: #d8d8a8;
  text-align: center;
  margin-top: 4px;
`;

interface ConditionNodeProps {
  data: {
    label?: string;
    condition?: string;
    conditionType?: 'item' | 'quest' | 'stat' | 'variable' | 'custom';
  };
  selected: boolean;
}

export const ConditionNode: React.FC<ConditionNodeProps> = ({ data, selected }) => {
  const condition = data.condition || 'condition';
  const conditionType = data.conditionType || 'custom';

  const getConditionTypeIcon = (type: string) => {
    switch (type) {
      case 'item': return '🎒';
      case 'quest': return '📜';
      case 'stat': return '📊';
      case 'variable': return '🔧';
      default: return '❓';
    }
  };

  return (
    <NodeContainer style={{ 
      borderColor: selected ? '#007acc' : '#7c7c4a',
      boxShadow: selected ? '0 0 0 2px rgba(0, 122, 204, 0.3)' : 'none'
    }}>
      <Handle
        type="target"
        position={Position.Top}
        style={{ 
          background: '#7c7c4a',
          border: '2px solid #d8d8a8',
          width: 10,
          height: 10,
        }}
      />
      
      <NodeHeader>
        <NodeIcon>🔀</NodeIcon>
        <span>Condition</span>
      </NodeHeader>
      
      <ConditionType>
        {getConditionTypeIcon(conditionType)} {conditionType}
      </ConditionType>
      
      <ConditionText>{condition}</ConditionText>
      
      <OutputHandles>
        <div style={{ position: 'relative' }}>
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            style={{ 
              background: '#4ade80',
              border: '2px solid #22c55e',
              width: 10,
              height: 10,
              left: -5,
              bottom: -15,
            }}
          />
          <HandleLabel style={{ color: '#4ade80' }}>True</HandleLabel>
        </div>
        
        <div style={{ position: 'relative' }}>
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            style={{ 
              background: '#f87171',
              border: '2px solid #ef4444',
              width: 10,
              height: 10,
              right: -5,
              bottom: -15,
            }}
          />
          <HandleLabel style={{ color: '#f87171' }}>False</HandleLabel>
        </div>
      </OutputHandles>
    </NodeContainer>
  );
};