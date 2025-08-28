import React, { useState, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { UIComponent } from '../types/UIComponent';

const SelectionBoxWrapper = styled.div<{
  position: { x: number; y: number };
  size: { width: number; height: number };
}>`
  position: absolute;
  left: ${props => props.position.x - 4}px;
  top: ${props => props.position.y - 4}px;
  width: ${props => props.size.width + 8}px;
  height: ${props => props.size.height + 8}px;
  border: 2px solid #007acc;
  border-radius: 2px;
  pointer-events: none;
  z-index: 1000;
`;

const ResizeHandle = styled.div<{ position: string }>`
  position: absolute;
  width: 8px;
  height: 8px;
  background-color: #007acc;
  border: 1px solid #ffffff;
  border-radius: 1px;
  pointer-events: auto;
  cursor: ${props => {
    switch (props.position) {
      case 'top-left':
      case 'bottom-right':
        return 'nw-resize';
      case 'top-right':
      case 'bottom-left':
        return 'ne-resize';
      case 'top':
      case 'bottom':
        return 'ns-resize';
      case 'left':
      case 'right':
        return 'ew-resize';
      default:
        return 'default';
    }
  }};
  
  ${props => {
    switch (props.position) {
      case 'top-left':
        return 'top: -4px; left: -4px;';
      case 'top':
        return 'top: -4px; left: 50%; transform: translateX(-50%);';
      case 'top-right':
        return 'top: -4px; right: -4px;';
      case 'right':
        return 'right: -4px; top: 50%; transform: translateY(-50%);';
      case 'bottom-right':
        return 'bottom: -4px; right: -4px;';
      case 'bottom':
        return 'bottom: -4px; left: 50%; transform: translateX(-50%);';
      case 'bottom-left':
        return 'bottom: -4px; left: -4px;';
      case 'left':
        return 'left: -4px; top: 50%; transform: translateY(-50%);';
      default:
        return '';
    }
  }}
`;

const MoveHandle = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  cursor: move;
  pointer-events: auto;
`;

const ComponentLabel = styled.div`
  position: absolute;
  top: -20px;
  left: 0;
  background-color: #007acc;
  color: white;
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 10px;
  white-space: nowrap;
  pointer-events: none;
`;

interface SelectionBoxProps {
  component: UIComponent;
  onMove: (position: { x: number; y: number }) => void;
  onResize: (size: { width: number; height: number }) => void;
}

export const SelectionBox: React.FC<SelectionBoxProps> = ({
  component,
  onMove,
  onResize,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ 
    x: 0, 
    y: 0, 
    width: 0, 
    height: 0,
    handle: ''
  });

  const handleMouseDown = useCallback((e: React.MouseEvent, type: 'move' | 'resize', handle?: string) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;

    if (type === 'move') {
      setIsDragging(true);
      setDragStart({ x: startX, y: startY });
    } else if (type === 'resize' && handle) {
      setIsResizing(true);
      setResizeStart({
        x: startX,
        y: startY,
        width: component.size.width,
        height: component.size.height,
        handle
      });
    }

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      if (type === 'move' && isDragging) {
        onMove({
          x: Math.max(0, component.position.x + deltaX),
          y: Math.max(0, component.position.y + deltaY)
        });
      } else if (type === 'resize' && isResizing && handle) {
        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;
        let newX = component.position.x;
        let newY = component.position.y;

        switch (handle) {
          case 'top-left':
            newWidth = Math.max(20, resizeStart.width - deltaX);
            newHeight = Math.max(20, resizeStart.height - deltaY);
            newX = component.position.x + (resizeStart.width - newWidth);
            newY = component.position.y + (resizeStart.height - newHeight);
            break;
          case 'top':
            newHeight = Math.max(20, resizeStart.height - deltaY);
            newY = component.position.y + (resizeStart.height - newHeight);
            break;
          case 'top-right':
            newWidth = Math.max(20, resizeStart.width + deltaX);
            newHeight = Math.max(20, resizeStart.height - deltaY);
            newY = component.position.y + (resizeStart.height - newHeight);
            break;
          case 'right':
            newWidth = Math.max(20, resizeStart.width + deltaX);
            break;
          case 'bottom-right':
            newWidth = Math.max(20, resizeStart.width + deltaX);
            newHeight = Math.max(20, resizeStart.height + deltaY);
            break;
          case 'bottom':
            newHeight = Math.max(20, resizeStart.height + deltaY);
            break;
          case 'bottom-left':
            newWidth = Math.max(20, resizeStart.width - deltaX);
            newHeight = Math.max(20, resizeStart.height + deltaY);
            newX = component.position.x + (resizeStart.width - newWidth);
            break;
          case 'left':
            newWidth = Math.max(20, resizeStart.width - deltaX);
            newX = component.position.x + (resizeStart.width - newWidth);
            break;
        }

        // Update position if it changed
        if (newX !== component.position.x || newY !== component.position.y) {
          onMove({ x: Math.max(0, newX), y: Math.max(0, newY) });
        }

        onResize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [component, isDragging, isResizing, onMove, onResize]);

  const getComponentName = (component: UIComponent): string => {
    if (component.name) return component.name;
    const typeName = component.type.charAt(0).toUpperCase() + component.type.slice(1);
    return `${typeName}`;
  };

  const resizeHandles = [
    'top-left', 'top', 'top-right',
    'right', 'bottom-right', 'bottom',
    'bottom-left', 'left'
  ];

  return (
    <SelectionBoxWrapper
      position={component.position}
      size={component.size}
    >
      <ComponentLabel>
        {getComponentName(component)} ({component.size.width}×{component.size.height})
      </ComponentLabel>
      
      <MoveHandle
        onMouseDown={(e) => handleMouseDown(e, 'move')}
      />
      
      {resizeHandles.map(handle => (
        <ResizeHandle
          key={handle}
          position={handle}
          onMouseDown={(e) => handleMouseDown(e, 'resize', handle)}
        />
      ))}
    </SelectionBoxWrapper>
  );
};