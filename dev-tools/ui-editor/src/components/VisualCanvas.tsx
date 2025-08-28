import React, { useRef, useCallback, useState } from 'react';
import styled from 'styled-components';
import { useDrop } from 'react-dnd';
import { UIComponent, UIComponentType } from '../types/UIComponent';
import { RenderComponent } from './RenderComponent';
import { SelectionBox } from './SelectionBox';
import { GridOverlay } from './GridOverlay';

const CanvasContainer = styled.div`
  flex: 1;
  position: relative;
  overflow: auto;
  background-color: #1e1e1e;
`;

const CanvasViewport = styled.div<{ resolution: string; showGrid: boolean }>`
  position: relative;
  margin: 20px auto;
  background-color: #ffffff;
  border: 1px solid #3e3e42;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  ${props => {
    const [width, height] = props.resolution.split('x').map(Number);
    return `
      width: ${width}px;
      height: ${height}px;
    `;
  }}
`;

const CanvasBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, #f0f0f0 25%, transparent 25%), 
              linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), 
              linear-gradient(45deg, transparent 75%, #f0f0f0 75%), 
              linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  opacity: 0.1;
`;

const DropZone = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
`;

const GuideLines = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1000;
`;

const GuideLine = styled.div<{ type: 'horizontal' | 'vertical'; position: number }>`
  position: absolute;
  background-color: #ff0000;
  z-index: 1000;
  ${props => props.type === 'horizontal' ? `
    top: ${props.position}px;
    left: 0;
    right: 0;
    height: 1px;
  ` : `
    left: ${props.position}px;
    top: 0;
    bottom: 0;
    width: 1px;
  `}
`;

const ZoomControls = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 4px;
  z-index: 100;
`;

const ZoomButton = styled.button`
  background-color: #2d2d30;
  border: 1px solid #5e5e5e;
  color: #cccccc;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  
  &:hover {
    background-color: #3e3e42;
  }
`;

const ZoomLevel = styled.div`
  background-color: #2d2d30;
  border: 1px solid #5e5e5e;
  color: #cccccc;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  display: flex;
  align-items: center;
`;

interface VisualCanvasProps {
  components: UIComponent[];
  selectedComponent: UIComponent | null;
  onSelectComponent: (component: UIComponent | null) => void;
  onUpdateComponent: (componentId: string, updates: Partial<UIComponent>) => void;
  onAddComponent: (type: UIComponentType, position: { x: number; y: number }) => void;
  resolution: string;
  showGrid: boolean;
  snapToGrid: boolean;
  isPreviewMode: boolean;
}

export const VisualCanvas: React.FC<VisualCanvasProps> = ({
  components,
  selectedComponent,
  onSelectComponent,
  onUpdateComponent,
  onAddComponent,
  resolution,
  showGrid,
  snapToGrid,
  isPreviewMode,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [guideLines, setGuideLines] = useState<Array<{ type: 'horizontal' | 'vertical'; position: number }>>([]);
  const [isDragging, setIsDragging] = useState(false);

  const snapToGridValue = useCallback((value: number, gridSize: number = 10): number => {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  }, [snapToGrid]);

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'component',
    drop: (item: { componentType: UIComponentType }, monitor) => {
      if (!canvasRef.current) return;

      const canvasRect = canvasRef.current.getBoundingClientRect();
      const clientOffset = monitor.getClientOffset();
      
      if (clientOffset) {
        const x = snapToGridValue(clientOffset.x - canvasRect.left);
        const y = snapToGridValue(clientOffset.y - canvasRect.top);
        
        onAddComponent(item.componentType, { x, y });
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onSelectComponent(null);
    }
  }, [onSelectComponent]);

  const handleComponentMove = useCallback((componentId: string, newPosition: { x: number; y: number }) => {
    const snappedPosition = {
      x: snapToGridValue(newPosition.x),
      y: snapToGridValue(newPosition.y)
    };
    
    onUpdateComponent(componentId, { position: snappedPosition });
    
    // Show guide lines for alignment
    const guidelines: Array<{ type: 'horizontal' | 'vertical'; position: number }> = [];
    
    components.forEach(comp => {
      if (comp.id !== componentId) {
        // Vertical alignment
        if (Math.abs(comp.position.x - snappedPosition.x) < 5) {
          guidelines.push({ type: 'vertical', position: comp.position.x });
        }
        if (Math.abs(comp.position.x + comp.size.width - snappedPosition.x) < 5) {
          guidelines.push({ type: 'vertical', position: comp.position.x + comp.size.width });
        }
        
        // Horizontal alignment
        if (Math.abs(comp.position.y - snappedPosition.y) < 5) {
          guidelines.push({ type: 'horizontal', position: comp.position.y });
        }
        if (Math.abs(comp.position.y + comp.size.height - snappedPosition.y) < 5) {
          guidelines.push({ type: 'horizontal', position: comp.position.y + comp.size.height });
        }
      }
    });
    
    setGuideLines(guidelines);
    
    // Clear guidelines after a short delay
    setTimeout(() => setGuideLines([]), 300);
  }, [components, onUpdateComponent, snapToGridValue]);

  const handleComponentResize = useCallback((componentId: string, newSize: { width: number; height: number }) => {
    const snappedSize = {
      width: snapToGridValue(newSize.width),
      height: snapToGridValue(newSize.height)
    };
    
    onUpdateComponent(componentId, { size: snappedSize });
  }, [onUpdateComponent, snapToGridValue]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.1));
  const handleZoomReset = () => setZoom(1);

  return (
    <CanvasContainer ref={drop}>
      <ZoomControls>
        <ZoomButton onClick={handleZoomOut}>-</ZoomButton>
        <ZoomLevel>{Math.round(zoom * 100)}%</ZoomLevel>
        <ZoomButton onClick={handleZoomIn}>+</ZoomButton>
        <ZoomButton onClick={handleZoomReset}>⌂</ZoomButton>
      </ZoomControls>
      
      <CanvasViewport 
        ref={canvasRef}
        resolution={resolution}
        showGrid={showGrid}
        onClick={handleCanvasClick}
        style={{ 
          transform: `scale(${zoom})`,
          transformOrigin: 'center top',
        }}
      >
        <CanvasBackground />
        
        {showGrid && <GridOverlay gridSize={10} />}
        
        <DropZone 
          style={{
            backgroundColor: isOver && canDrop ? 'rgba(0, 122, 204, 0.1)' : 'transparent',
            border: isOver && canDrop ? '2px dashed #007acc' : 'none',
          }}
        />
        
        {components.map(component => (
          <RenderComponent
            key={component.id}
            component={component}
            isSelected={selectedComponent?.id === component.id}
            isPreviewMode={isPreviewMode}
            onSelect={() => onSelectComponent(component)}
            onMove={(newPosition) => handleComponentMove(component.id, newPosition)}
            onResize={(newSize) => handleComponentResize(component.id, newSize)}
          />
        ))}
        
        {selectedComponent && !isPreviewMode && (
          <SelectionBox
            component={selectedComponent}
            onMove={(newPosition) => handleComponentMove(selectedComponent.id, newPosition)}
            onResize={(newSize) => handleComponentResize(selectedComponent.id, newSize)}
          />
        )}
        
        <GuideLines>
          {guideLines.map((guideLine, index) => (
            <GuideLine
              key={index}
              type={guideLine.type}
              position={guideLine.position}
            />
          ))}
        </GuideLines>
      </CanvasViewport>
    </CanvasContainer>
  );
};