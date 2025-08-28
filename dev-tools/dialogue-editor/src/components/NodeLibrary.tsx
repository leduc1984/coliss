import React from 'react';
import styled from 'styled-components';
import { NodeType } from '../types/DialogueTypes';

const LibraryContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const LibraryHeader = styled.div`
  background-color: #2d2d30;
  padding: 8px 12px;
  border-bottom: 1px solid #3e3e42;
  font-size: 12px;
  font-weight: 600;
  color: #cccccc;
`;

const LibraryContent = styled.div`
  flex: 1;
  padding: 12px;
  overflow-y: auto;
`;

const NodeGroup = styled.div`
  margin-bottom: 16px;
`;

const GroupTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 11px;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const NodeList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const NodeItem = styled.div<{ color: string }>`
  background-color: ${props => props.color};
  border: 1px solid ${props => props.color}99;
  border-radius: 6px;
  padding: 8px 10px;
  cursor: grab;
  transition: all 0.2s;
  font-size: 11px;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    border-color: ${props => props.color};
  }
  
  &:active {
    cursor: grabbing;
    transform: translateY(0);
  }
`;

const NodeIcon = styled.div`
  font-size: 14px;
  width: 16px;
  text-align: center;
`;

const NodeInfo = styled.div`
  flex: 1;
`;

const NodeTitle = styled.div`
  font-weight: 600;
  margin-bottom: 2px;
`;

const NodeDescription = styled.div`
  font-size: 9px;
  opacity: 0.8;
  line-height: 1.2;
`;

interface NodeLibraryProps {
  onAddNode: (nodeType: NodeType, position?: { x: number; y: number }) => void;
}

interface NodeTypeInfo {
  type: NodeType;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export const NodeLibrary: React.FC<NodeLibraryProps> = ({ onAddNode }) => {
  const dialogueNodes: NodeTypeInfo[] = [
    {
      type: 'dialogue',
      title: 'Dialogue',
      description: 'NPC speech with character portrait',
      icon: '💬',
      color: '#2d4a2d',
    },
    {
      type: 'player_choice',
      title: 'Player Choice',
      description: 'Multiple response options',
      icon: '🤔',
      color: '#4a2d4a',
    },
  ];

  const logicNodes: NodeTypeInfo[] = [
    {
      type: 'condition',
      title: 'Condition',
      description: 'Branch based on game state',
      icon: '🔀',
      color: '#4a4a2d',
    },
    {
      type: 'event',
      title: 'Event',
      description: 'Trigger game actions',
      icon: '⚡',
      color: '#4a2d2d',
    },
  ];

  const flowNodes: NodeTypeInfo[] = [
    {
      type: 'start',
      title: 'Start',
      description: 'Conversation entry point',
      icon: '🚀',
      color: '#2d4a4a',
    },
    {
      type: 'end',
      title: 'End',
      description: 'Conversation exit point',
      icon: '🏁',
      color: '#3d3d3d',
    },
  ];

  const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDoubleClick = (nodeType: NodeType) => {
    onAddNode(nodeType);
  };

  const renderNodeGroup = (title: string, nodes: NodeTypeInfo[]) => (
    <NodeGroup>
      <GroupTitle>{title}</GroupTitle>
      <NodeList>
        {nodes.map((node) => (
          <NodeItem
            key={node.type}
            color={node.color}
            draggable
            onDragStart={(e) => onDragStart(e, node.type)}
            onDoubleClick={() => handleDoubleClick(node.type)}
            title={`Drag to canvas or double-click to add`}
          >
            <NodeIcon>{node.icon}</NodeIcon>
            <NodeInfo>
              <NodeTitle>{node.title}</NodeTitle>
              <NodeDescription>{node.description}</NodeDescription>
            </NodeInfo>
          </NodeItem>
        ))}
      </NodeList>
    </NodeGroup>
  );

  return (
    <LibraryContainer>
      <LibraryHeader>Node Library</LibraryHeader>
      <LibraryContent>
        {renderNodeGroup('Dialogue', dialogueNodes)}
        {renderNodeGroup('Logic', logicNodes)}
        {renderNodeGroup('Flow Control', flowNodes)}
        
        <div style={{ 
          marginTop: '20px', 
          padding: '8px', 
          backgroundColor: 'rgba(0, 122, 204, 0.1)', 
          borderRadius: '4px',
          fontSize: '10px',
          color: '#94a3b8'
        }}>
          💡 <strong>Tip:</strong> Drag nodes to the canvas or double-click to add them at a random position.
        </div>
      </LibraryContent>
    </LibraryContainer>
  );
};