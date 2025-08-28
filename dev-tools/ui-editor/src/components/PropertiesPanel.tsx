import React, { useState } from 'react';
import styled from 'styled-components';
import { ChromePicker } from 'react-color';
import { UIComponent } from '../types/UIComponent';

const PropertiesContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const PropertiesHeader = styled.div`
  background-color: #2d2d30;
  padding: 8px 12px;
  border-bottom: 1px solid #3e3e42;
  font-size: 12px;
  font-weight: 600;
  color: #cccccc;
`;

const PropertiesContent = styled.div`
  flex: 1;
  padding: 12px;
  overflow-y: auto;
`;

const PropertyGroup = styled.div`
  margin-bottom: 16px;
`;

const GroupTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 11px;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #3e3e42;
  padding-bottom: 4px;
`;

const PropertyRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
`;

const PropertyLabel = styled.label`
  flex: 1;
  font-size: 11px;
  color: #cccccc;
  min-width: 60px;
`;

const PropertyInput = styled.input`
  flex: 1;
  background-color: #3c3c3c;
  border: 1px solid #5e5e5e;
  border-radius: 3px;
  color: #cccccc;
  font-size: 11px;
  padding: 4px 6px;
  min-width: 0;

  &:focus {
    border-color: #007acc;
    background-color: #404040;
    outline: none;
  }
`;

const PropertySelect = styled.select`
  flex: 1;
  background-color: #3c3c3c;
  border: 1px solid #5e5e5e;
  border-radius: 3px;
  color: #cccccc;
  font-size: 11px;
  padding: 4px 6px;

  &:focus {
    border-color: #007acc;
    outline: none;
  }
`;

const PropertyTextarea = styled.textarea`
  width: 100%;
  background-color: #3c3c3c;
  border: 1px solid #5e5e5e;
  border-radius: 3px;
  color: #cccccc;
  font-size: 11px;
  padding: 6px;
  resize: vertical;
  min-height: 60px;

  &:focus {
    border-color: #007acc;
    background-color: #404040;
    outline: none;
  }
`;

const ColorPickerButton = styled.button<{ color: string }>`
  width: 30px;
  height: 24px;
  border: 1px solid #5e5e5e;
  border-radius: 3px;
  background-color: ${props => props.color};
  cursor: pointer;
  position: relative;

  &:hover {
    border-color: #007acc;
  }
`;

const ColorPickerPopover = styled.div`
  position: absolute;
  top: 28px;
  right: 0;
  z-index: 1000;
  background: white;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
`;

const ColorPickerCover = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
`;

const NoSelectionMessage = styled.div`
  text-align: center;
  color: #999;
  font-size: 12px;
  padding: 40px 20px;
`;

interface PropertiesPanelProps {
  selectedComponent: UIComponent | null;
  onUpdateComponent: (componentId: string, updates: Partial<UIComponent>) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedComponent,
  onUpdateComponent,
}) => {
  const [colorPickers, setColorPickers] = useState<Record<string, boolean>>({});

  if (!selectedComponent) {
    return (
      <PropertiesContainer>
        <PropertiesHeader>Properties</PropertiesHeader>
        <PropertiesContent>
          <NoSelectionMessage>
            Select a component to edit its properties
          </NoSelectionMessage>
        </PropertiesContent>
      </PropertiesContainer>
    );
  }

  const handlePropertyChange = (property: string, value: any) => {
    onUpdateComponent(selectedComponent.id, {
      properties: {
        ...selectedComponent.properties,
        [property]: value,
      },
    });
  };

  const handlePositionChange = (axis: 'x' | 'y', value: number) => {
    onUpdateComponent(selectedComponent.id, {
      position: {
        ...selectedComponent.position,
        [axis]: value,
      },
    });
  };

  const handleSizeChange = (dimension: 'width' | 'height', value: number) => {
    onUpdateComponent(selectedComponent.id, {
      size: {
        ...selectedComponent.size,
        [dimension]: value,
      },
    });
  };

  const toggleColorPicker = (property: string) => {
    setColorPickers(prev => ({
      ...prev,
      [property]: !prev[property],
    }));
  };

  const renderColorPicker = (property: string, color: string) => (
    <div style={{ position: 'relative' }}>
      <ColorPickerButton
        color={color}
        onClick={() => toggleColorPicker(property)}
      />
      {colorPickers[property] && (
        <ColorPickerPopover>
          <ColorPickerCover onClick={() => toggleColorPicker(property)} />
          <ChromePicker
            color={color}
            onChange={(newColor) => handlePropertyChange(property, newColor.hex)}
          />
        </ColorPickerPopover>
      )}
    </div>
  );

  return (
    <PropertiesContainer>
      <PropertiesHeader>
        Properties - {selectedComponent.type}
      </PropertiesHeader>
      <PropertiesContent>
        {/* Transform Properties */}
        <PropertyGroup>
          <GroupTitle>Transform</GroupTitle>
          <PropertyRow>
            <PropertyLabel>X:</PropertyLabel>
            <PropertyInput
              type="number"
              value={selectedComponent.position.x}
              onChange={(e) => handlePositionChange('x', Number(e.target.value))}
            />
            <PropertyLabel>Y:</PropertyLabel>
            <PropertyInput
              type="number"
              value={selectedComponent.position.y}
              onChange={(e) => handlePositionChange('y', Number(e.target.value))}
            />
          </PropertyRow>
          <PropertyRow>
            <PropertyLabel>Width:</PropertyLabel>
            <PropertyInput
              type="number"
              value={selectedComponent.size.width}
              onChange={(e) => handleSizeChange('width', Number(e.target.value))}
            />
            <PropertyLabel>Height:</PropertyLabel>
            <PropertyInput
              type="number"
              value={selectedComponent.size.height}
              onChange={(e) => handleSizeChange('height', Number(e.target.value))}
            />
          </PropertyRow>
        </PropertyGroup>

        {/* Text Properties */}
        {(selectedComponent.type === 'text' || selectedComponent.type === 'button') && (
          <PropertyGroup>
            <GroupTitle>Text</GroupTitle>
            <PropertyRow>
              <PropertyLabel>Content:</PropertyLabel>
            </PropertyRow>
            <PropertyTextarea
              value={selectedComponent.properties.text || ''}
              onChange={(e) => handlePropertyChange('text', e.target.value)}
              placeholder="Enter text content..."
            />
            <PropertyRow>
              <PropertyLabel>Size:</PropertyLabel>
              <PropertyInput
                type="number"
                value={selectedComponent.properties.fontSize || 14}
                onChange={(e) => handlePropertyChange('fontSize', Number(e.target.value))}
              />
              <PropertyLabel>Weight:</PropertyLabel>
              <PropertySelect
                value={selectedComponent.properties.fontWeight || 'normal'}
                onChange={(e) => handlePropertyChange('fontWeight', e.target.value)}
              >
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
                <option value="lighter">Light</option>
                <option value="100">100</option>
                <option value="200">200</option>
                <option value="300">300</option>
                <option value="400">400</option>
                <option value="500">500</option>
                <option value="600">600</option>
                <option value="700">700</option>
                <option value="800">800</option>
                <option value="900">900</option>
              </PropertySelect>
            </PropertyRow>
            <PropertyRow>
              <PropertyLabel>Align:</PropertyLabel>
              <PropertySelect
                value={selectedComponent.properties.textAlign || 'left'}
                onChange={(e) => handlePropertyChange('textAlign', e.target.value)}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </PropertySelect>
              <PropertyLabel>Color:</PropertyLabel>
              {renderColorPicker('color', selectedComponent.properties.color || '#000000')}
            </PropertyRow>
          </PropertyGroup>
        )}

        {/* Appearance Properties */}
        <PropertyGroup>
          <GroupTitle>Appearance</GroupTitle>
          <PropertyRow>
            <PropertyLabel>Background:</PropertyLabel>
            {renderColorPicker('backgroundColor', selectedComponent.properties.backgroundColor || '#ffffff')}
            <PropertyLabel>Opacity:</PropertyLabel>
            <PropertyInput
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={selectedComponent.properties.opacity || 1}
              onChange={(e) => handlePropertyChange('opacity', Number(e.target.value))}
            />
          </PropertyRow>
          <PropertyRow>
            <PropertyLabel>Border:</PropertyLabel>
            {renderColorPicker('borderColor', selectedComponent.properties.borderColor || '#cccccc')}
            <PropertyLabel>Width:</PropertyLabel>
            <PropertyInput
              type="number"
              min="0"
              value={selectedComponent.properties.borderWidth || 0}
              onChange={(e) => handlePropertyChange('borderWidth', Number(e.target.value))}
            />
          </PropertyRow>
          <PropertyRow>
            <PropertyLabel>Radius:</PropertyLabel>
            <PropertyInput
              type="number"
              min="0"
              value={selectedComponent.properties.borderRadius || 0}
              onChange={(e) => handlePropertyChange('borderRadius', Number(e.target.value))}
            />
            <PropertyLabel>Z-Index:</PropertyLabel>
            <PropertyInput
              type="number"
              value={selectedComponent.properties.zIndex || 0}
              onChange={(e) => handlePropertyChange('zIndex', Number(e.target.value))}
            />
          </PropertyRow>
        </PropertyGroup>

        {/* Spacing Properties */}
        <PropertyGroup>
          <GroupTitle>Spacing</GroupTitle>
          <PropertyRow>
            <PropertyLabel>Padding:</PropertyLabel>
            <PropertyInput
              type="number"
              min="0"
              value={selectedComponent.properties.padding || 0}
              onChange={(e) => handlePropertyChange('padding', Number(e.target.value))}
            />
            <PropertyLabel>Margin:</PropertyLabel>
            <PropertyInput
              type="number"
              min="0"
              value={selectedComponent.properties.margin || 0}
              onChange={(e) => handlePropertyChange('margin', Number(e.target.value))}
            />
          </PropertyRow>
        </PropertyGroup>

        {/* Event Properties */}
        <PropertyGroup>
          <GroupTitle>Events</GroupTitle>
          <PropertyRow>
            <PropertyLabel>On Click:</PropertyLabel>
          </PropertyRow>
          <PropertyTextarea
            value={selectedComponent.properties.onClick || ''}
            onChange={(e) => handlePropertyChange('onClick', e.target.value)}
            placeholder="e.g., openInventory(), playSound('click')"
          />
          <PropertyRow>
            <PropertyLabel>On Hover:</PropertyLabel>
          </PropertyRow>
          <PropertyTextarea
            value={selectedComponent.properties.onHover || ''}
            onChange={(e) => handlePropertyChange('onHover', e.target.value)}
            placeholder="e.g., showTooltip('Item description')"
          />
        </PropertyGroup>

        {/* Data Binding */}
        <PropertyGroup>
          <GroupTitle>Data Binding</GroupTitle>
          <PropertyRow>
            <PropertyLabel>Data Source:</PropertyLabel>
          </PropertyRow>
          <PropertyTextarea
            value={selectedComponent.properties.dataBinding || ''}
            onChange={(e) => handlePropertyChange('dataBinding', e.target.value)}
            placeholder="e.g., player.money, pokemon.hp, inventory.items[0].name"
          />
        </PropertyGroup>
      </PropertiesContent>
    </PropertiesContainer>
  );
};