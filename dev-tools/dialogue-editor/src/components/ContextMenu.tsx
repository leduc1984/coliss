import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { NodeType } from '../types/DialogueTypes';

const MenuContainer = styled.div<{ x: number; y: number }>`
  position: fixed;
  left: ${props => props.x}px;
  top: ${props => props.y}px;
  background-color: #2d2d30;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  padding: 4px 0;
  min-width: 150px;
  z-index: 1000;
`;

const MenuItem = styled.div`
  padding: 6px 12px;
  font-size: 12px;
  color: #cccccc;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background-color: #094771;
  }

  &.danger {
    color: #f87171;
  }

  &.danger:hover {
    background-color: #7f1d1d;
  }
`;

const MenuSeparator = styled.div`
  height: 1px;
  background-color: #3e3e42;
  margin: 4px 0;
`;

const SubMenu = styled.div`
  padding-left: 8px;
`;

interface ContextMenuProps {
  x: number;
  y: number;
  nodeId?: string;
  onAddNode: (nodeType: NodeType, position?: { x: number; y: number }) => void;
  onDeleteNode: (nodeId: string) => void;
  onDuplicateNode: (nodeId: string) => void;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  nodeId,
  onAddNode,
  onDeleteNode,
  onDuplicateNode,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleAddNode = (nodeType: NodeType) => {
    onAddNode(nodeType, { x: x - 100, y: y - 50 });
    onClose();
  };

  const handleDeleteNode = () => {
    if (nodeId) {
      onDeleteNode(nodeId);
    }
    onClose();
  };

  const handleDuplicateNode = () => {
    if (nodeId) {
      onDuplicateNode(nodeId);
    }
    onClose();
  };

  return (
    <MenuContainer ref={menuRef} x={x} y={y}>
      {nodeId ? (
        // Node-specific context menu
        <>
          <MenuItem onClick={handleDuplicateNode}>
            📄 Duplicate Node
          </MenuItem>
          <MenuSeparator />
          <MenuItem className="danger" onClick={handleDeleteNode}>
            🗑 Delete Node
          </MenuItem>
        </>
      ) : (
        // Canvas context menu
        <>
          <MenuItem>
            ➕ Add Node
          </MenuItem>
          <SubMenu>
            <MenuItem onClick={() => handleAddNode('dialogue')}>
              💬 Dialogue
            </MenuItem>
            <MenuItem onClick={() => handleAddNode('player_choice')}>
              🤔 Player Choice
            </MenuItem>
            <MenuItem onClick={() => handleAddNode('condition')}>
              🔀 Condition
            </MenuItem>
            <MenuItem onClick={() => handleAddNode('event')}>
              ⚡ Event
            </MenuItem>
            <MenuItem onClick={() => handleAddNode('start')}>
              🚀 Start
            </MenuItem>
            <MenuItem onClick={() => handleAddNode('end')}>
              🏁 End
            </MenuItem>
          </SubMenu>
        </>
      )}
    </MenuContainer>
  );
};