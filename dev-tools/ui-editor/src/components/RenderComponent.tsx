import React from 'react';
import styled from 'styled-components';
import { useDrag } from 'react-dnd';
import { UIComponent } from '../types/UIComponent';

const ComponentWrapper = styled.div<{
  position: { x: number; y: number };
  size: { width: number; height: number };
  isSelected: boolean;
  isPreviewMode: boolean;
}>`
  position: absolute;
  left: ${props => props.position.x}px;
  top: ${props => props.position.y}px;
  width: ${props => props.size.width}px;
  height: ${props => props.size.height}px;
  cursor: ${props => props.isPreviewMode ? 'default' : 'pointer'};
  user-select: none;
  
  ${props => !props.isPreviewMode && `
    border: 1px solid ${props.isSelected ? '#007acc' : 'transparent'};
    
    &:hover {
      border-color: #007acc;
    }
  `}
`;

const BaseComponent = styled.div<{ properties: any }>`
  width: 100%;
  height: 100%;
  background-color: ${props => props.properties.backgroundColor || '#ffffff'};
  color: ${props => props.properties.color || '#000000'};
  border: ${props => `${props.properties.borderWidth || 0}px solid ${props.properties.borderColor || '#cccccc'}`};
  border-radius: ${props => props.properties.borderRadius || 0}px;
  padding: ${props => props.properties.padding || 0}px;
  margin: ${props => props.properties.margin || 0}px;
  opacity: ${props => props.properties.opacity || 1};
  z-index: ${props => props.properties.zIndex || 0};
  font-size: ${props => props.properties.fontSize || 14}px;
  font-weight: ${props => props.properties.fontWeight || 'normal'};
  font-family: ${props => props.properties.fontFamily || 'sans-serif'};
  text-align: ${props => props.properties.textAlign || 'left'};
  display: flex;
  align-items: center;
  justify-content: ${props => 
    props.properties.textAlign === 'center' ? 'center' :
    props.properties.textAlign === 'right' ? 'flex-end' : 'flex-start'
  };
  box-shadow: ${props => props.properties.boxShadow || 'none'};
  overflow: ${props => props.properties.overflow || 'visible'};
`;

const ButtonComponent = styled(BaseComponent)`
  background-color: ${props => props.properties.backgroundColor || '#007acc'};
  color: ${props => props.properties.color || '#ffffff'};
  border: ${props => `${props.properties.borderWidth || 1}px solid ${props.properties.borderColor || '#005a9e'}`};
  border-radius: ${props => props.properties.borderRadius || 4}px;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
  
  &:hover {
    background-color: ${props => props.properties.hoverColor || '#1177bb'};
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const TextComponent = styled(BaseComponent)`
  background-color: transparent;
  border: none;
  white-space: pre-wrap;
  word-wrap: break-word;
`;

const InputComponent = styled.input<{ properties: any }>`
  width: 100%;
  height: 100%;
  background-color: ${props => props.properties.backgroundColor || '#ffffff'};
  color: ${props => props.properties.color || '#000000'};
  border: ${props => `${props.properties.borderWidth || 1}px solid ${props.properties.borderColor || '#cccccc'}`};
  border-radius: ${props => props.properties.borderRadius || 4}px;
  padding: ${props => props.properties.padding || 8}px;
  font-size: ${props => props.properties.fontSize || 14}px;
  font-weight: ${props => props.properties.fontWeight || 'normal'};
  font-family: ${props => props.properties.fontFamily || 'sans-serif'};
  outline: none;
  
  &:focus {
    border-color: #007acc;
    box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.3);
  }
`;

const ImageComponent = styled.img<{ properties: any }>`
  width: 100%;
  height: 100%;
  object-fit: ${props => props.properties.backgroundSize || 'cover'};
  object-position: ${props => props.properties.backgroundPosition || 'center'};
  border-radius: ${props => props.properties.borderRadius || 0}px;
`;

const PanelComponent = styled(BaseComponent)`
  background-color: ${props => props.properties.backgroundColor || 'rgba(0, 0, 0, 0.8)'};
  border: ${props => `${props.properties.borderWidth || 1}px solid ${props.properties.borderColor || '#333333'}`};
  backdrop-filter: blur(10px);
`;

const ProgressBarComponent = styled(BaseComponent)`
  background-color: ${props => props.properties.backgroundColor || '#333333'};
  border-radius: ${props => props.properties.borderRadius || 10}px;
  overflow: hidden;
  position: relative;
`;

const ProgressBarFill = styled.div<{ percentage: number; fillColor: string }>`
  height: 100%;
  width: ${props => props.percentage}%;
  background-color: ${props => props.fillColor};
  transition: width 0.3s ease;
`;

const ItemSlotComponent = styled(BaseComponent)`
  background-color: ${props => props.properties.backgroundColor || '#2a2a2a'};
  border: ${props => `${props.properties.borderWidth || 2}px solid ${props.properties.borderColor || '#555555'}`};
  border-radius: ${props => props.properties.borderRadius || 8}px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    right: 2px;
    bottom: 2px;
    background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="none" stroke="%23666" stroke-width="1" stroke-dasharray="5,5"/></svg>');
    background-size: 20px 20px;
    opacity: 0.3;
  }
`;

interface RenderComponentProps {
  component: UIComponent;
  isSelected: boolean;
  isPreviewMode: boolean;
  onSelect: () => void;
  onMove: (position: { x: number; y: number }) => void;
  onResize: (size: { width: number; height: number }) => void;
}

export const RenderComponent: React.FC<RenderComponentProps> = ({
  component,
  isSelected,
  isPreviewMode,
  onSelect,
  onMove,
  onResize,
}) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'existing-component',
    item: { componentId: component.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [component.id]);

  const renderComponentContent = () => {
    const props = component.properties;

    switch (component.type) {
      case 'button':
        return (
          <ButtonComponent properties={props}>
            {props.text || 'Button'}
          </ButtonComponent>
        );

      case 'text':
        return (
          <TextComponent properties={props}>
            {props.text || 'Sample Text'}
          </TextComponent>
        );

      case 'input':
        return (
          <InputComponent
            properties={props}
            type="text"
            placeholder={props.placeholder || 'Enter text...'}
            defaultValue={props.text || ''}
            readOnly={!isPreviewMode}
          />
        );

      case 'image':
        return (
          <ImageComponent
            properties={props}
            src={props.backgroundImage || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23e0e0e0"/><text x="50" y="50" text-anchor="middle" dy=".3em" font-family="Arial" font-size="12" fill="%23666">Image</text></svg>'}
            alt={props.text || 'Image'}
          />
        );

      case 'panel':
        return (
          <PanelComponent properties={props}>
            {props.text && <span>{props.text}</span>}
          </PanelComponent>
        );

      case 'progressbar':
        const percentage = Math.min(100, Math.max(0, ((props.statValue || 50) / (props.maxValue || 100)) * 100));
        return (
          <ProgressBarComponent properties={props}>
            <ProgressBarFill 
              percentage={percentage} 
              fillColor={props.color || '#4caf50'}
            />
            {props.text && (
              <div style={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)',
                color: props.color || '#ffffff',
                fontSize: '10px',
                fontWeight: 'bold'
              }}>
                {props.text}
              </div>
            )}
          </ProgressBarComponent>
        );

      case 'itemslot':
        return (
          <ItemSlotComponent properties={props}>
            {props.itemIcon && (
              <img 
                src={props.itemIcon} 
                alt="Item" 
                style={{ 
                  width: '80%', 
                  height: '80%', 
                  objectFit: 'contain' 
                }} 
              />
            )}
          </ItemSlotComponent>
        );

      case 'checkbox':
        return (
          <BaseComponent properties={props}>
            <input 
              type="checkbox" 
              style={{ 
                marginRight: '8px',
                transform: 'scale(1.2)'
              }} 
              readOnly={!isPreviewMode}
            />
            <span>{props.text || 'Checkbox'}</span>
          </BaseComponent>
        );

      case 'slider':
        return (
          <BaseComponent properties={props}>
            <input 
              type="range" 
              min="0" 
              max="100" 
              defaultValue={props.statValue || 50}
              style={{ 
                width: '100%',
                height: '20px'
              }}
              readOnly={!isPreviewMode}
            />
          </BaseComponent>
        );

      default:
        return (
          <BaseComponent properties={props}>
            {props.text || component.type}
          </BaseComponent>
        );
    }
  };

  return (
    <ComponentWrapper
      ref={!isPreviewMode ? drag : undefined}
      position={component.position}
      size={component.size}
      isSelected={isSelected}
      isPreviewMode={isPreviewMode}
      onClick={onSelect}
      style={{ 
        opacity: isDragging ? 0.5 : 1,
        pointerEvents: component.visible === false ? 'none' : 'auto'
      }}
    >
      {renderComponentContent()}
    </ComponentWrapper>
  );
};