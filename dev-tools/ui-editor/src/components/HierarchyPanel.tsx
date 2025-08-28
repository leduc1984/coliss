import React, { useState } from 'react';
import styled from 'styled-components';
import { UIComponent } from '../types/UIComponent';

const HierarchyContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const HierarchyHeader = styled.div`
  background-color: #2d2d30;
  padding: 8px 12px;
  border-bottom: 1px solid #3e3e42;
  font-size: 12px;
  font-weight: 600;
  color: #cccccc;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HierarchyActions = styled.div`
  display: flex;
  gap: 4px;
`;

const ActionButton = styled.button`
  background: none;
  border: 1px solid #5e5e5e;
  color: #cccccc;
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 10px;
  cursor: pointer;
  
  &:hover {
    background-color: #3e3e42;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const HierarchyContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 4px;
`;

const ComponentTreeItem = styled.div<{ level: number; isSelected: boolean }>`
  display: flex;
  align-items: center;
  padding: 2px 4px;
  margin-left: ${props => props.level * 16}px;
  font-size: 11px;
  color: #cccccc;
  cursor: pointer;
  border-radius: 2px;
  background-color: ${props => props.isSelected ? '#094771' : 'transparent'};
  
  &:hover {
    background-color: ${props => props.isSelected ? '#094771' : '#3e3e42'};
  }
`;

const ComponentIcon = styled.span`
  margin-right: 6px;
  font-size: 10px;
  width: 12px;
  text-align: center;
`;

const ComponentName = styled.span`
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const VisibilityToggle = styled.button`
  background: none;
  border: none;
  color: #999;
  padding: 0;
  margin-left: 4px;
  cursor: pointer;
  font-size: 10px;
  
  &:hover {
    color: #cccccc;
  }
`;

const ExpandToggle = styled.button`
  background: none;
  border: none;
  color: #999;
  padding: 0;
  margin-right: 4px;
  cursor: pointer;
  font-size: 8px;
  width: 12px;
  
  &:hover {
    color: #cccccc;
  }
`;

const EmptyMessage = styled.div`
  text-align: center;
  color: #999;
  font-size: 11px;
  padding: 20px;
`;

const SearchInput = styled.input`
  width: 100%;
  background-color: #3c3c3c;
  border: 1px solid #5e5e5e;
  border-radius: 3px;
  color: #cccccc;
  font-size: 10px;
  padding: 4px 6px;
  margin: 4px 0;

  &:focus {
    border-color: #007acc;
    outline: none;
  }
`;

interface HierarchyPanelProps {
  components: UIComponent[];
  selectedComponent: UIComponent | null;
  onSelectComponent: (component: UIComponent | null) => void;
  onDeleteComponent: (componentId: string) => void;
  onDuplicateComponent: (componentId: string) => void;
}

export const HierarchyPanel: React.FC<HierarchyPanelProps> = ({
  components,
  selectedComponent,
  onSelectComponent,
  onDeleteComponent,
  onDuplicateComponent,
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const getComponentIcon = (type: string): string => {
    const icons: Record<string, string> = {
      button: '⬜',
      text: 'T',
      image: '🖼',
      panel: '▢',
      input: '📝',
      checkbox: '☑',
      slider: '◐',
      progressbar: '▓',
      itemslot: '🎒',
      scrolllist: '📋',
      window: '🪟',
      tooltip: '💬',
    };
    return icons[type] || '•';
  };

  const getComponentName = (component: UIComponent): string => {
    if (component.name) return component.name;
    const typeName = component.type.charAt(0).toUpperCase() + component.type.slice(1);
    return `${typeName}_${component.id.slice(0, 8)}`;
  };

  const toggleExpanded = (componentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(componentId)) {
        newSet.delete(componentId);
      } else {
        newSet.add(componentId);
      }
      return newSet;
    });
  };

  const handleDelete = () => {
    if (selectedComponent) {
      onDeleteComponent(selectedComponent.id);
    }
  };

  const handleDuplicate = () => {
    if (selectedComponent) {
      onDuplicateComponent(selectedComponent.id);
    }
  };

  const filteredComponents = components.filter(component =>
    searchTerm === '' || 
    getComponentName(component).toLowerCase().includes(searchTerm.toLowerCase()) ||
    component.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderComponent = (component: UIComponent, level: number = 0) => {
    const hasChildren = component.children && component.children.length > 0;
    const isExpanded = expandedItems.has(component.id);
    const isSelected = selectedComponent?.id === component.id;

    return (
      <React.Fragment key={component.id}>
        <ComponentTreeItem
          level={level}
          isSelected={isSelected}
          onClick={() => onSelectComponent(component)}
        >
          {hasChildren && (
            <ExpandToggle onClick={(e) => toggleExpanded(component.id, e)}>
              {isExpanded ? '▼' : '▶'}
            </ExpandToggle>
          )}
          {!hasChildren && <div style={{ width: 12 }} />}
          
          <ComponentIcon>{getComponentIcon(component.type)}</ComponentIcon>
          <ComponentName>{getComponentName(component)}</ComponentName>
          
          <VisibilityToggle
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Toggle visibility
            }}
          >
            {component.visible !== false ? '👁' : '🚫'}
          </VisibilityToggle>
        </ComponentTreeItem>
        
        {hasChildren && isExpanded && (
          component.children.map(child => renderComponent(child, level + 1))
        )}
      </React.Fragment>
    );
  };

  return (
    <HierarchyContainer>
      <HierarchyHeader>
        <span>Hierarchy</span>
        <HierarchyActions>
          <ActionButton 
            onClick={handleDuplicate}
            disabled={!selectedComponent}
            title="Duplicate"
          >
            ⧉
          </ActionButton>
          <ActionButton 
            onClick={handleDelete}
            disabled={!selectedComponent}
            title="Delete"
          >
            🗑
          </ActionButton>
        </HierarchyActions>
      </HierarchyHeader>
      
      <div style={{ padding: '4px 8px' }}>
        <SearchInput
          type="text"
          placeholder="Search components..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <HierarchyContent>
        {filteredComponents.length === 0 ? (
          <EmptyMessage>
            {components.length === 0 
              ? 'No components yet. Drag from the library to get started.'
              : 'No components match your search.'
            }
          </EmptyMessage>
        ) : (
          filteredComponents.map(component => renderComponent(component))
        )}
      </HierarchyContent>
    </HierarchyContainer>
  );
};