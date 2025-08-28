import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { ComponentLibrary } from './ComponentLibrary';
import { VisualCanvas } from './VisualCanvas';
import { PropertiesPanel } from './PropertiesPanel';
import { HierarchyPanel } from './HierarchyPanel';
import { UIComponent, UIComponentType } from '../types/UIComponent';
import { generateId } from '../utils/idGenerator';

const EditorContainer = styled.div`
  display: flex;
  flex: 1;
  height: calc(100vh - 48px);
  overflow: hidden;
`;

const LeftPanel = styled.div`
  width: 300px;
  min-width: 300px;
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

const PanelSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  &:not(:last-child) {
    border-bottom: 1px solid #3e3e42;
  }
`;

const Toolbar = styled.div`
  height: 40px;
  background-color: #2d2d30;
  border-bottom: 1px solid #3e3e42;
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 8px;
`;

const ToolbarButton = styled.button`
  background: none;
  border: 1px solid #5e5e5e;
  color: #cccccc;
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 11px;
  cursor: pointer;
  
  &:hover {
    background-color: #3e3e42;
  }
  
  &.active {
    background-color: #0e639c;
    border-color: #0e639c;
    color: white;
  }
`;

const ResolutionSelector = styled.select`
  background-color: #3c3c3c;
  border: 1px solid #5e5e5e;
  color: #cccccc;
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 11px;
`;

export const UIEditor: React.FC = () => {
  const [components, setComponents] = useState<UIComponent[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<UIComponent | null>(null);
  const [canvasResolution, setCanvasResolution] = useState('1920x1080');
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const handleAddComponent = useCallback((type: UIComponentType, position: { x: number; y: number }) => {
    const newComponent: UIComponent = {
      id: generateId(),
      type,
      position,
      size: { width: 100, height: 40 },
      properties: {
        text: type === 'text' ? 'Sample Text' : '',
        backgroundColor: '#333333',
        color: '#ffffff',
        fontSize: 14,
        borderRadius: 4,
        padding: 8,
      },
      children: [],
    };

    setComponents(prev => [...prev, newComponent]);
    setSelectedComponent(newComponent);
  }, []);

  const handleSelectComponent = useCallback((component: UIComponent | null) => {
    setSelectedComponent(component);
  }, []);

  const handleUpdateComponent = useCallback((componentId: string, updates: Partial<UIComponent>) => {
    setComponents(prev => prev.map(comp => 
      comp.id === componentId ? { ...comp, ...updates } : comp
    ));
    
    if (selectedComponent?.id === componentId) {
      setSelectedComponent(prev => prev ? { ...prev, ...updates } : null);
    }
  }, [selectedComponent]);

  const handleDeleteComponent = useCallback((componentId: string) => {
    setComponents(prev => prev.filter(comp => comp.id !== componentId));
    if (selectedComponent?.id === componentId) {
      setSelectedComponent(null);
    }
  }, [selectedComponent]);

  const handleDuplicateComponent = useCallback((componentId: string) => {
    const component = components.find(comp => comp.id === componentId);
    if (component) {
      const duplicated: UIComponent = {
        ...component,
        id: generateId(),
        position: {
          x: component.position.x + 20,
          y: component.position.y + 20
        }
      };
      setComponents(prev => [...prev, duplicated]);
    }
  }, [components]);

  return (
    <EditorContainer>
      <LeftPanel>
        <PanelSection style={{ flex: '0 0 50%' }}>
          <ComponentLibrary onAddComponent={handleAddComponent} />
        </PanelSection>
        <PanelSection style={{ flex: '0 0 50%' }}>
          <HierarchyPanel 
            components={components}
            selectedComponent={selectedComponent}
            onSelectComponent={handleSelectComponent}
            onDeleteComponent={handleDeleteComponent}
            onDuplicateComponent={handleDuplicateComponent}
          />
        </PanelSection>
      </LeftPanel>

      <CenterPanel>
        <Toolbar>
          <ToolbarButton 
            className={showGrid ? 'active' : ''}
            onClick={() => setShowGrid(!showGrid)}
          >
            Grid
          </ToolbarButton>
          <ToolbarButton 
            className={snapToGrid ? 'active' : ''}
            onClick={() => setSnapToGrid(!snapToGrid)}
          >
            Snap
          </ToolbarButton>
          <ToolbarButton 
            className={isPreviewMode ? 'active' : ''}
            onClick={() => setIsPreviewMode(!isPreviewMode)}
          >
            Preview
          </ToolbarButton>
          <ResolutionSelector 
            value={canvasResolution}
            onChange={(e) => setCanvasResolution(e.target.value)}
          >
            <option value="1920x1080">1920×1080</option>
            <option value="1366x768">1366×768</option>
            <option value="1280x720">1280×720</option>
            <option value="375x667">375×667 (Mobile)</option>
            <option value="414x896">414×896 (Mobile)</option>
          </ResolutionSelector>
        </Toolbar>
        <VisualCanvas
          components={components}
          selectedComponent={selectedComponent}
          onSelectComponent={handleSelectComponent}
          onUpdateComponent={handleUpdateComponent}
          onAddComponent={handleAddComponent}
          resolution={canvasResolution}
          showGrid={showGrid}
          snapToGrid={snapToGrid}
          isPreviewMode={isPreviewMode}
        />
      </CenterPanel>

      <RightPanel>
        <PropertiesPanel
          selectedComponent={selectedComponent}
          onUpdateComponent={handleUpdateComponent}
        />
      </RightPanel>
    </EditorContainer>
  );
};