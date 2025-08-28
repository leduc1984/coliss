import React from 'react';
import styled from 'styled-components';
import { useDrag } from 'react-dnd';
import { UIComponentType } from '../types/UIComponent';

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

const ComponentGroup = styled.div`
  margin-bottom: 16px;
`;

const GroupTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 11px;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ComponentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
`;

const ComponentItem = styled.div<{ isDragging: boolean }>`
  background-color: #3c3c3c;
  border: 1px solid #5e5e5e;
  border-radius: 4px;
  padding: 12px 8px;
  text-align: center;
  cursor: grab;
  transition: all 0.2s;
  opacity: ${props => props.isDragging ? 0.5 : 1};
  
  &:hover {
    background-color: #484848;
    border-color: #007acc;
  }
  
  &:active {
    cursor: grabbing;
  }
`;

const ComponentIcon = styled.div`
  width: 24px;
  height: 24px;
  margin: 0 auto 4px;
  background-color: #007acc;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: white;
`;

const ComponentLabel = styled.div`
  font-size: 10px;
  color: #cccccc;
  line-height: 1.2;
`;

interface ComponentLibraryProps {
  onAddComponent: (type: UIComponentType, position: { x: number; y: number }) => void;
}

interface DraggableComponentProps {
  type: UIComponentType;
  icon: string;
  label: string;
}

const DraggableComponent: React.FC<DraggableComponentProps> = ({ type, icon, label }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'component',
    item: { componentType: type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <ComponentItem ref={drag} isDragging={isDragging}>
      <ComponentIcon>{icon}</ComponentIcon>
      <ComponentLabel>{label}</ComponentLabel>
    </ComponentItem>
  );
};

export const ComponentLibrary: React.FC<ComponentLibraryProps> = ({ onAddComponent }) => {
  const basicComponents: DraggableComponentProps[] = [
    { type: 'button', icon: '⬜', label: 'Button' },
    { type: 'text', icon: 'T', label: 'Text' },
    { type: 'image', icon: '🖼', label: 'Image' },
    { type: 'input', icon: '📝', label: 'Input' },
    { type: 'checkbox', icon: '☑', label: 'Checkbox' },
    { type: 'slider', icon: '◐', label: 'Slider' },
  ];

  const layoutComponents: DraggableComponentProps[] = [
    { type: 'panel', icon: '▢', label: 'Panel' },
    { type: 'window', icon: '🪟', label: 'Window' },
    { type: 'scrolllist', icon: '📋', label: 'Scroll List' },
  ];

  const gameComponents: DraggableComponentProps[] = [
    { type: 'itemslot', icon: '🎒', label: 'Item Slot' },
    { type: 'progressbar', icon: '▓', label: 'Progress Bar' },
    { type: 'tooltip', icon: '💬', label: 'Tooltip' },
  ];

  return (
    <LibraryContainer>
      <LibraryHeader>Component Library</LibraryHeader>
      <LibraryContent>
        <ComponentGroup>
          <GroupTitle>Basic Controls</GroupTitle>
          <ComponentGrid>
            {basicComponents.map(component => (
              <DraggableComponent
                key={component.type}
                type={component.type}
                icon={component.icon}
                label={component.label}
              />
            ))}
          </ComponentGrid>
        </ComponentGroup>

        <ComponentGroup>
          <GroupTitle>Layout</GroupTitle>
          <ComponentGrid>
            {layoutComponents.map(component => (
              <DraggableComponent
                key={component.type}
                type={component.type}
                icon={component.icon}
                label={component.label}
              />
            ))}
          </ComponentGrid>
        </ComponentGroup>

        <ComponentGroup>
          <GroupTitle>Game UI</GroupTitle>
          <ComponentGrid>
            {gameComponents.map(component => (
              <DraggableComponent
                key={component.type}
                type={component.type}
                icon={component.icon}
                label={component.label}
              />
            ))}
          </ComponentGrid>
        </ComponentGroup>
      </LibraryContent>
    </LibraryContainer>
  );
};