import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  NodeTypes,
  EdgeTypes,
  ConnectionMode,
  MarkerType,
} from 'react-flow-renderer';
import styled from 'styled-components';

import { DialogueNode as CustomDialogueNode } from './nodes/DialogueNode';
import { PlayerChoiceNode } from './nodes/PlayerChoiceNode';
import { ConditionNode } from './nodes/ConditionNode';
import { EventNode } from './nodes/EventNode';
import { StartNode } from './nodes/StartNode';
import { EndNode } from './nodes/EndNode';
import { NodePropertiesPanel } from './NodePropertiesPanel';
import { NodeLibrary } from './NodeLibrary';
import { DialogueToolbar } from './DialogueToolbar';
import { ContextMenu } from './ContextMenu';
import { DialogueNode, NodeType, DialogueProject } from '../types/DialogueTypes';
import { generateId } from '../utils/idGenerator';

const EditorContainer = styled.div`
  display: flex;
  flex: 1;
  height: calc(100vh - 48px);
  overflow: hidden;
`;

const LeftPanel = styled.div`
  width: 250px;
  min-width: 250px;
  background-color: #252526;
  border-right: 1px solid #3e3e42;
  display: flex;
  flex-direction: column;
`;

const CenterPanel = styled.div`
  flex: 1;
  background-color: #1e1e1e;
  display: flex;
  flex-direction: column;
  position: relative;
`;

const RightPanel = styled.div`
  width: 300px;
  min-width: 300px;
  background-color: #252526;
  border-left: 1px solid #3e3e42;
  display: flex;
  flex-direction: column;
`;

const FlowContainer = styled.div`
  flex: 1;
  position: relative;
`;

// Define custom node types
const nodeTypes: NodeTypes = {
  dialogue: CustomDialogueNode,
  player_choice: PlayerChoiceNode,
  condition: ConditionNode,
  event: EventNode,
  start: StartNode,
  end: EndNode,
};

// Default edge style
const defaultEdgeOptions = {
  animated: false,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#555555',
  },
  style: {
    stroke: '#555555',
    strokeWidth: 2,
  },
};

export const DialogueEditor: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<DialogueNode | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    nodeId?: string;
  }>({ visible: false, x: 0, y: 0 });
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  // Initialize with a start node
  useEffect(() => {
    const startNode: Node = {
      id: 'start-1',
      type: 'start',
      position: { x: 250, y: 50 },
      data: { label: 'Start' },
    };
    setNodes([startNode]);
  }, [setNodes]);

  const onConnect = useCallback(
    (params: Connection) => {
      const edge = {
        ...params,
        ...defaultEdgeOptions,
        id: generateId(),
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node as DialogueNode);
    setContextMenu({ visible: false, x: 0, y: 0 });
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setContextMenu({ visible: false, x: 0, y: 0 });
  }, []);

  const onContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
    });
  }, []);

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id,
    });
  }, []);

  const addNode = useCallback((nodeType: NodeType, position?: { x: number; y: number }) => {
    const rect = reactFlowWrapper.current?.getBoundingClientRect();
    const newPosition = position || {
      x: Math.random() * 400 + 100,
      y: Math.random() * 400 + 100,
    };

    const nodeData = {
      label: `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} Node`,
    };

    // Add type-specific default data
    switch (nodeType) {
      case 'dialogue':
        Object.assign(nodeData, {
          character: 'Professor Oak',
          text: 'Hello! Welcome to the world of Pokemon!',
        });
        break;
      case 'player_choice':
        Object.assign(nodeData, {
          choices: [
            { id: generateId(), text: 'Yes', condition: '' },
            { id: generateId(), text: 'No', condition: '' },
          ],
        });
        break;
      case 'condition':
        Object.assign(nodeData, {
          condition: 'player.hasItem("pokeball")',
          conditionType: 'item',
        });
        break;
      case 'event':
        Object.assign(nodeData, {
          eventType: 'give_item',
          eventData: { item: 'pokeball', quantity: 1 },
        });
        break;
    }

    const newNode: Node = {
      id: generateId(),
      type: nodeType,
      position: newPosition,
      data: nodeData,
    };

    setNodes((nds) => nds.concat(newNode));
    setContextMenu({ visible: false, x: 0, y: 0 });
  }, [setNodes, reactFlowWrapper]);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
    setContextMenu({ visible: false, x: 0, y: 0 });
  }, [setNodes, setEdges, selectedNode]);

  const duplicateNode = useCallback((nodeId: string) => {
    const nodeToDuplicate = nodes.find((node) => node.id === nodeId);
    if (nodeToDuplicate) {
      const newNode: Node = {
        ...nodeToDuplicate,
        id: generateId(),
        position: {
          x: nodeToDuplicate.position.x + 50,
          y: nodeToDuplicate.position.y + 50,
        },
      };
      setNodes((nds) => nds.concat(newNode));
    }
    setContextMenu({ visible: false, x: 0, y: 0 });
  }, [nodes, setNodes]);

  const updateNodeData = useCallback((nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...newData,
            },
          };
        }
        return node;
      })
    );

    // Update selected node if it's the one being updated
    if (selectedNode?.id === nodeId) {
      setSelectedNode((prev) => prev ? {
        ...prev,
        data: {
          ...prev.data,
          ...newData,
        },
      } : null);
    }
  }, [setNodes, selectedNode]);

  const onLoad = useCallback((rfi: any) => {
    setReactFlowInstance(rfi);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const nodeType = event.dataTransfer.getData('application/reactflow') as NodeType;

      if (typeof nodeType === 'undefined' || !nodeType || !reactFlowBounds) {
        return;
      }

      const position = reactFlowInstance?.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      addNode(nodeType, position);
    },
    [reactFlowInstance, addNode]
  );

  return (
    <EditorContainer>
      <LeftPanel>
        <NodeLibrary onAddNode={addNode} />
      </LeftPanel>

      <CenterPanel>
        <DialogueToolbar
          onValidate={() => console.log('Validating...')}
          onPlayTest={() => console.log('Play testing...')}
          onZoomFit={() => reactFlowInstance?.fitView()}
          onZoomIn={() => reactFlowInstance?.zoomIn()}
          onZoomOut={() => reactFlowInstance?.zoomOut()}
        />
        
        <FlowContainer ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={onLoad}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onContextMenu={onContextMenu}
            onNodeContextMenu={onNodeContextMenu}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            connectionMode={ConnectionMode.Loose}
            fitView
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                switch (node.type) {
                  case 'dialogue': return '#2d4a2d';
                  case 'player_choice': return '#4a2d4a';
                  case 'condition': return '#4a4a2d';
                  case 'event': return '#4a2d2d';
                  case 'start': return '#2d4a4a';
                  case 'end': return '#3d3d3d';
                  default: return '#2d2d30';
                }
              }}
              maskColor="rgba(30, 30, 30, 0.8)"
            />
          </ReactFlow>
        </FlowContainer>

        {contextMenu.visible && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            nodeId={contextMenu.nodeId}
            onAddNode={addNode}
            onDeleteNode={deleteNode}
            onDuplicateNode={duplicateNode}
            onClose={() => setContextMenu({ visible: false, x: 0, y: 0 })}
          />
        )}
      </CenterPanel>

      <RightPanel>
        <NodePropertiesPanel
          selectedNode={selectedNode}
          onUpdateNode={updateNodeData}
        />
      </RightPanel>
    </EditorContainer>
  );
};